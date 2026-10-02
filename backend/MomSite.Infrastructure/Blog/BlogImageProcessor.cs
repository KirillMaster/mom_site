using Microsoft.AspNetCore.Http;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Jpeg;
using SixLabors.ImageSharp.Processing;

namespace MomSite.Infrastructure.Blog;

/// <summary>
/// Готовит фото для статьи: поворот по EXIF (телефоны), уменьшение до 1920 px по длинной стороне,
/// JPEG 82. Загрузку дальше делает существующий IImageService.SaveImageAsync.
/// </summary>
public static class BlogImageProcessor
{
    public const long MaxBytes = 15 * 1024 * 1024;
    public const int MaxSide = 1920;
    public static readonly string[] AllowedContentTypes = { "image/jpeg", "image/png", "image/webp" };

    public static string? Validate(IFormFile? file)
    {
        if (file == null || file.Length == 0) return "Файл не выбран.";
        if (file.Length > MaxBytes) return "Фото больше 15 МБ — выберите другое или уменьшите его.";
        if (!AllowedContentTypes.Contains(file.ContentType?.ToLowerInvariant()))
            return "Подходят фото в форматах JPG, PNG или WEBP.";
        return null;
    }

    /// <summary>Возвращает уменьшенную копию как IFormFile; null — файл не является картинкой.</summary>
    public static async Task<IFormFile?> PrepareAsync(IFormFile file)
    {
        try
        {
            await using var input = file.OpenReadStream();
            using var image = await Image.LoadAsync(input);
            image.Mutate(x => x.AutoOrient());
            if (image.Width > MaxSide || image.Height > MaxSide)
                image.Mutate(x => x.Resize(new ResizeOptions { Mode = ResizeMode.Max, Size = new Size(MaxSide, MaxSide) }));
            image.Metadata.ExifProfile = null;

            using var output = new MemoryStream();
            await image.SaveAsJpegAsync(output, new JpegEncoder { Quality = 82 });
            var name = Path.GetFileNameWithoutExtension(file.FileName) + ".jpg";
            return new InMemoryFormFile(output.ToArray(), name, "image/jpeg");
        }
        catch (UnknownImageFormatException)
        {
            return null;
        }
        catch (InvalidImageContentException)
        {
            return null;
        }
    }
}
