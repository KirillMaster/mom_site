using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using MomSite.Core.Models;
using MomSite.Infrastructure.Data;

namespace MomSite.Infrastructure.Services;

public enum ArtworkImageStatus { Ok, NotFound, BadRequest }

public record ArtworkImageResult(ArtworkImageStatus Status, string? Message, IReadOnlyList<ArtworkImage> Images)
{
    public static ArtworkImageResult Ok(IReadOnlyList<ArtworkImage> images) => new(ArtworkImageStatus.Ok, null, images);
    public static ArtworkImageResult NotFound() => new(ArtworkImageStatus.NotFound, null, Array.Empty<ArtworkImage>());
    public static ArtworkImageResult BadRequest(string message) => new(ArtworkImageStatus.BadRequest, message, Array.Empty<ArtworkImage>());
}

public interface IArtworkImageService
{
    Task<ArtworkImageResult> AddImagesAsync(int artworkId, IReadOnlyList<IFormFile> files);
    Task<ArtworkImageResult> DeleteImageAsync(int artworkId, int imageId);
    Task<ArtworkImageResult> ReorderAsync(int artworkId, IReadOnlyList<int> imageIds);
    Task SetCoverAsync(Artwork artwork, IFormFile file);
    void DeleteAllFiles(Artwork artwork);
}

public class ArtworkImageService : IArtworkImageService
{
    public const int MaxImagesPerArtwork = 10;
    public const long MaxFileSizeBytes = 15 * 1024 * 1024;
    public const string LastImageMessage = "У работы должно быть хотя бы одно фото";

    private readonly ApplicationDbContext _context;
    private readonly IImageService _imageService;

    public ArtworkImageService(ApplicationDbContext context, IImageService imageService)
    {
        _context = context;
        _imageService = imageService;
    }

    public async Task<ArtworkImageResult> AddImagesAsync(int artworkId, IReadOnlyList<IFormFile> files)
    {
        var artwork = await LoadAsync(artworkId);
        if (artwork == null) return ArtworkImageResult.NotFound();

        var error = ValidateFiles(files, artwork.Images.Count);
        if (error != null) return ArtworkImageResult.BadRequest(error);

        foreach (var file in files)
        {
            var (path, thumb) = await StoreAsync(file);
            artwork.Images.Add(NewImage(path, thumb, artwork.Images.Count));
        }

        await FinalizeAsync(artwork);
        return ArtworkImageResult.Ok(Ordered(artwork));
    }

    public async Task<ArtworkImageResult> DeleteImageAsync(int artworkId, int imageId)
    {
        var artwork = await LoadAsync(artworkId);
        var image = artwork?.Images.FirstOrDefault(i => i.Id == imageId);
        if (artwork == null || image == null) return ArtworkImageResult.NotFound();

        if (artwork.Images.Count <= 1) return ArtworkImageResult.BadRequest(LastImageMessage);

        DeleteFiles(image.ImagePath, image.ThumbnailPath);
        artwork.Images.Remove(image);
        _context.ArtworkImages.Remove(image);

        await FinalizeAsync(artwork);
        return ArtworkImageResult.Ok(Ordered(artwork));
    }

    public async Task<ArtworkImageResult> ReorderAsync(int artworkId, IReadOnlyList<int> imageIds)
    {
        var artwork = await LoadAsync(artworkId);
        if (artwork == null) return ArtworkImageResult.NotFound();

        var current = artwork.Images.Select(i => i.Id).ToHashSet();
        if (imageIds.Count != current.Count || !imageIds.ToHashSet().SetEquals(current))
        {
            return ArtworkImageResult.BadRequest("Список фото не совпадает с фото этой работы: нужны все id по одному разу");
        }

        var byId = artwork.Images.ToDictionary(i => i.Id);
        for (var i = 0; i < imageIds.Count; i++) byId[imageIds[i]].SortOrder = i;

        await FinalizeAsync(artwork);
        return ArtworkImageResult.Ok(Ordered(artwork));
    }

    public async Task SetCoverAsync(Artwork artwork, IFormFile file)
    {
        var cover = artwork.Images.OrderBy(i => i.SortOrder).FirstOrDefault();
        DeleteFiles(artwork.ImagePath, artwork.ThumbnailPath);

        var (path, thumb) = await StoreAsync(file);
        if (cover == null)
        {
            artwork.Images.Add(NewImage(path, thumb, 0));
        }
        else
        {
            cover.ImagePath = path;
            cover.ThumbnailPath = thumb;
        }
        artwork.ImagePath = path;
        artwork.ThumbnailPath = thumb;
    }

    public void DeleteAllFiles(Artwork artwork)
    {
        var paths = artwork.Images
            .SelectMany(i => new[] { i.ImagePath, i.ThumbnailPath })
            .Append(artwork.ImagePath)
            .Append(artwork.ThumbnailPath)
            .Distinct();
        DeleteFiles(paths.ToArray());
    }

    private static string? ValidateFiles(IReadOnlyList<IFormFile> files, int existing)
    {
        if (files.Count == 0) return "Не выбрано ни одного файла";
        var fileError = files.Select(ValidateFile).FirstOrDefault(e => e != null);
        if (fileError != null) return fileError;
        if (existing + files.Count > MaxImagesPerArtwork)
            return $"У работы может быть не более {MaxImagesPerArtwork} фото";
        return null;
    }

    private static string? ValidateFile(IFormFile file)
    {
        if (file.Length == 0) return $"Файл «{file.FileName}» пустой";
        if (file.ContentType == null || !file.ContentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
            return $"Файл «{file.FileName}» не является изображением";
        if (file.Length > MaxFileSizeBytes) return $"Файл «{file.FileName}» больше 15 МБ";
        return null;
    }

    private static ArtworkImage NewImage(string path, string thumb, int sortOrder) => new()
    {
        ImagePath = path,
        ThumbnailPath = thumb,
        SortOrder = sortOrder,
        CreatedAt = DateTime.UtcNow
    };

    private void DeleteFiles(params string[] paths)
    {
        foreach (var path in paths.Where(p => !string.IsNullOrEmpty(p))) _imageService.DeleteImage(path);
    }

    private async Task<(string Path, string Thumb)> StoreAsync(IFormFile file)
    {
        var path = await _imageService.SaveImageAsync(file, "artworks");
        var thumb = await _imageService.CreateThumbnailAsync(path, 300, 300);
        var watermarked = await _imageService.AddWatermarkAsync(path, _imageService.GetWatermarkText());
        return (watermarked, thumb);
    }

    private async Task<Artwork?> LoadAsync(int artworkId)
    {
        var artwork = await _context.Artworks.Include(a => a.Images).FirstOrDefaultAsync(a => a.Id == artworkId);
        if (artwork != null && artwork.Images.Count == 0 && !string.IsNullOrEmpty(artwork.ImagePath))
        {
            artwork.Images.Add(NewImage(artwork.ImagePath, artwork.ThumbnailPath, 0));
        }
        return artwork;
    }

    private static List<ArtworkImage> Ordered(Artwork artwork) => artwork.Images.OrderBy(i => i.SortOrder).ToList();

    private async Task FinalizeAsync(Artwork artwork)
    {
        var ordered = Ordered(artwork);
        for (var i = 0; i < ordered.Count; i++) ordered[i].SortOrder = i;
        if (ordered.Count > 0)
        {
            artwork.ImagePath = ordered[0].ImagePath;
            artwork.ThumbnailPath = ordered[0].ThumbnailPath;
        }
        artwork.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
    }
}
