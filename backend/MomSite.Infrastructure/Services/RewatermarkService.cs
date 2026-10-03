using Microsoft.EntityFrameworkCore;
using MomSite.Core.Models;
using MomSite.Infrastructure.Data;

namespace MomSite.Infrastructure.Services;

public record RewatermarkFailure(int Id, string Error);

public record RewatermarkReport(bool DryRun, int Matched, int Processed, IReadOnlyList<int> Skipped, IReadOnlyList<RewatermarkFailure> Failed, int Remaining);

public interface IRewatermarkService
{
    Task<RewatermarkReport> RunAsync(bool dryRun, int take);
}

public class RewatermarkService : IRewatermarkService
{
    public const int DefaultTake = 25;
    public const int MaxTake = 100;

    private readonly ApplicationDbContext _context;
    private readonly IS3Service _s3;
    private readonly IImageService _images;

    public RewatermarkService(ApplicationDbContext context, IS3Service s3, IImageService images)
    {
        _context = context;
        _s3 = s3;
        _images = images;
    }

    public async Task<RewatermarkReport> RunAsync(bool dryRun, int take)
    {
        take = Math.Clamp(take, 1, MaxTake);
        var batch = await _context.ArtworkImages
            .Include(i => i.Artwork)
            .Where(i => i.OriginalPath == null)
            .OrderBy(i => i.Id)
            .Take(take)
            .ToListAsync();

        var skipped = new List<int>();
        var failed = new List<RewatermarkFailure>();
        var matched = 0;
        var processed = 0;

        if (batch.Count > 0)
        {
            var pairs = await BuildPairsAsync();
            foreach (var image in batch)
            {
                var pair = pairs.FirstOrDefault(p => image.ImagePath.EndsWith(p.CopyKey, StringComparison.Ordinal));
                if (pair == default)
                {
                    skipped.Add(image.Id);
                    continue;
                }
                matched++;
                if (dryRun) continue;
                try
                {
                    await ProcessAsync(image, pair);
                    processed++;
                }
                catch (Exception ex)
                {
                    failed.Add(new RewatermarkFailure(image.Id, ex.Message));
                }
            }
        }

        var remaining = await _context.ArtworkImages.CountAsync(i => i.OriginalPath == null);
        return new RewatermarkReport(dryRun, matched, processed, skipped, failed, remaining);
    }

    private async Task<List<(string CopyKey, string OriginalKey)>> BuildPairsAsync()
    {
        var objects = await _s3.ListObjectsAsync("");
        var map = WatermarkPairing.Match(
            objects.Where(o => WatermarkPairing.IsOriginal(o.Key)),
            objects.Where(o => WatermarkPairing.IsCopy(o.Key)));
        return map.Select(kv => (kv.Key, kv.Value)).ToList();
    }

    private async Task ProcessAsync(ArtworkImage image, (string CopyKey, string OriginalKey) pair)
    {
        var oldPath = image.ImagePath;
        var oldThumb = image.ThumbnailPath;
        var originalUrl = oldPath[..^pair.CopyKey.Length] + pair.OriginalKey;

        var newPath = await _images.AddWatermarkAsync(originalUrl, _images.GetWatermarkText());
        if (string.IsNullOrEmpty(newPath) || newPath == originalUrl)
            throw new InvalidOperationException("Не удалось создать копию со знаком");

        string newThumb;
        try
        {
            newThumb = await _images.CreateThumbnailAsync(originalUrl, 300, 300);
            if (string.IsNullOrEmpty(newThumb) || newThumb == originalUrl)
                throw new InvalidOperationException("Не удалось создать превью");
        }
        catch
        {
            _images.DeleteImage(newPath);
            throw;
        }

        var artwork = image.Artwork;
        var artworkPath = artwork?.ImagePath;
        var artworkThumb = artwork?.ThumbnailPath;
        image.ImagePath = newPath;
        image.ThumbnailPath = newThumb;
        image.OriginalPath = originalUrl;
        if (artwork != null)
        {
            if (artwork.ImagePath == oldPath) artwork.ImagePath = newPath;
            if (artwork.ThumbnailPath == oldThumb) artwork.ThumbnailPath = newThumb;
        }

        try
        {
            await _context.SaveChangesAsync();
        }
        catch
        {
            image.ImagePath = oldPath;
            image.ThumbnailPath = oldThumb;
            image.OriginalPath = null;
            if (artwork != null)
            {
                artwork.ImagePath = artworkPath!;
                artwork.ThumbnailPath = artworkThumb!;
            }
            _images.DeleteImage(newPath);
            _images.DeleteImage(newThumb);
            throw;
        }

        if (oldPath != newPath) _images.DeleteImage(oldPath);
        if (oldThumb != newThumb) _images.DeleteImage(oldThumb);
    }
}
