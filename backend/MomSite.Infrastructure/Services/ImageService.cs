using Microsoft.AspNetCore.Http;

namespace MomSite.Infrastructure.Services;

public interface IImageService
{
    Task<string> SaveImageAsync(IFormFile file, string folder);
    Task<string> CreateThumbnailAsync(string imagePath, int width, int height);
    Task<string> AddWatermarkAsync(string imagePath, string watermarkText);
    void DeleteImage(string imagePath);
    Task<string> CreateVideoThumbnailAsync(string videoPath, int width, int height);
}

public class ImageService : IImageService
{
    private readonly string _uploadPath;
    private readonly string _watermarkText;

    public ImageService()
    {
        _uploadPath = Path.Combine(Directory.GetCurrentDirectory(), "uploads");
        _watermarkText = "angelamoiseenko.ru";
        
        // Create upload directories if they don't exist
        Directory.CreateDirectory(_uploadPath);
        Directory.CreateDirectory(Path.Combine(_uploadPath, "artworks"));
        Directory.CreateDirectory(Path.Combine(_uploadPath, "thumbnails"));
        Directory.CreateDirectory(Path.Combine(_uploadPath, "page-content"));
        Directory.CreateDirectory(Path.Combine(_uploadPath, "videos"));
    }

    public async Task<string> SaveImageAsync(IFormFile file, string folder)
    {
        if (file == null || file.Length == 0)
            throw new ArgumentException("File is empty");

        var fileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
        var folderPath = Path.Combine(_uploadPath, folder);
        Directory.CreateDirectory(folderPath);
        
        var filePath = Path.Combine(folderPath, fileName);
        
        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        return $"/uploads/{folder}/{fileName}";
    }

    public Task<string> CreateThumbnailAsync(string imagePath, int width, int height)
    {
        var fullPath = Path.Combine(_uploadPath, imagePath.TrimStart('/').Replace("uploads/", ""));
        
        if (!File.Exists(fullPath))
            throw new FileNotFoundException("Image not found", fullPath);

        var fileName = Path.GetFileName(fullPath);
        var thumbnailName = $"thumb_{fileName}";
        var thumbnailPath = Path.Combine(_uploadPath, "thumbnails", thumbnailName);
        
        Directory.CreateDirectory(Path.GetDirectoryName(thumbnailPath)!);

        // For now, just copy the original file as thumbnail
        // In a production environment, you would implement proper image resizing
        File.Copy(fullPath, thumbnailPath, true);

        return Task.FromResult($"/uploads/thumbnails/{thumbnailName}");
    }

    public Task<string> AddWatermarkAsync(string imagePath, string watermarkText)
    {
        var fullPath = Path.Combine(_uploadPath, imagePath.TrimStart('/').Replace("uploads/", ""));
        
        if (!File.Exists(fullPath))
            throw new FileNotFoundException("Image not found", fullPath);

        var fileName = Path.GetFileName(fullPath);
        var watermarkedName = $"watermarked_{fileName}";
        var watermarkedPath = Path.Combine(_uploadPath, "artworks", watermarkedName);

        // For now, just copy the original file as watermarked
        // In a production environment, you would implement proper watermarking
        File.Copy(fullPath, watermarkedPath, true);

        return Task.FromResult($"/uploads/artworks/{watermarkedName}");
    }

    public void DeleteImage(string imagePath)
    {
        if (string.IsNullOrEmpty(imagePath))
            return;

        var fullPath = Path.Combine(_uploadPath, imagePath.TrimStart('/').Replace("uploads/", ""));
        
        if (File.Exists(fullPath))
        {
            File.Delete(fullPath);
        }
    }

    public async Task<string> CreateVideoThumbnailAsync(string videoPath, int width, int height)
    {
        var fullVideoPath = Path.Combine(_uploadPath, videoPath.TrimStart('/').Replace("uploads/", ""));
        
        if (!File.Exists(fullVideoPath))
            throw new FileNotFoundException("Video not found", fullVideoPath);

        var fileNameWithoutExtension = Path.GetFileNameWithoutExtension(fullVideoPath);
        var thumbnailName = $"{fileNameWithoutExtension}.jpg";
        var thumbnailPath = Path.Combine(_uploadPath, "thumbnails", thumbnailName);
        
        Directory.CreateDirectory(Path.GetDirectoryName(thumbnailPath)!);

        var command = $"-i \"{fullVideoPath}\" -ss 00:00:01 -vframes 1 -s {width}x{height} -f image2 \"{thumbnailPath}\" ";
        
        var startInfo = new System.Diagnostics.ProcessStartInfo
        {
            FileName = "ffmpeg",
            Arguments = command,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true,
        };

        using (var process = System.Diagnostics.Process.Start(startInfo))
        {
            if (process == null)
            {
                throw new InvalidOperationException("Failed to start FFmpeg process.");
            }
            await process.WaitForExitAsync();

            if (process.ExitCode != 0)
            {
                var error = await process.StandardError.ReadToEndAsync();
                throw new InvalidOperationException($"FFmpeg exited with code {process.ExitCode}: {error}");
            }
        }

        return $"/uploads/thumbnails/{thumbnailName}";
    }
} 