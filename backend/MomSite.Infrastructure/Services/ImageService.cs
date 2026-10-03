using Microsoft.AspNetCore.Http;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Drawing.Processing;
using SixLabors.ImageSharp.Processing;
using SixLabors.ImageSharp.Formats;
using SixLabors.ImageSharp.Formats.Jpeg;
using SixLabors.ImageSharp.Formats.Png;
using SixLabors.ImageSharp.Formats.Gif;
using SixLabors.ImageSharp.Formats.Bmp;
using SixLabors.Fonts;

namespace MomSite.Infrastructure.Services;

public interface IImageService
{
    Task<string> SaveImageAsync(IFormFile file, string folder);
    Task<string> CreateThumbnailAsync(string imagePath, int width, int height);
    Task<string> AddWatermarkAsync(string imagePath, string watermarkText);
    void DeleteImage(string imagePath);
    Task<string> CreateVideoThumbnailAsync(string videoPath, int width, int height);
    string GetWatermarkText();
}

public class ImageService : IImageService
{
    private const string WatermarkText = "angelamoiseenko.ru";
    private readonly string _uploadPath;
    private readonly string _watermarkText;
    private readonly IS3Service _s3Service;
    private readonly bool _useS3;
    private readonly string _bucketName;

    public ImageService(IS3Service s3Service)
    {
        _s3Service = s3Service;
        _uploadPath = System.IO.Path.Combine(Directory.GetCurrentDirectory(), "uploads");
        _watermarkText = "angelamoiseenko.ru";
        _useS3 = !string.IsNullOrEmpty(Environment.GetEnvironmentVariable("S3_ACCESS_KEY"));
        _bucketName = Environment.GetEnvironmentVariable("S3_BUCKET_NAME") ?? "";
        
        // Debug logging
        Console.WriteLine($"ImageService initialized:");
        Console.WriteLine($"S3_ACCESS_KEY set: {!string.IsNullOrEmpty(Environment.GetEnvironmentVariable("S3_ACCESS_KEY"))}");
        Console.WriteLine($"S3_SECRET_KEY set: {!string.IsNullOrEmpty(Environment.GetEnvironmentVariable("S3_SECRET_KEY"))}");
        Console.WriteLine($"S3_SERVICE_URL set: {!string.IsNullOrEmpty(Environment.GetEnvironmentVariable("S3_SERVICE_URL"))}");
        Console.WriteLine($"S3_BUCKET_NAME set: {!string.IsNullOrEmpty(Environment.GetEnvironmentVariable("S3_BUCKET_NAME"))}");
        Console.WriteLine($"S3_BASE_URL set: {!string.IsNullOrEmpty(Environment.GetEnvironmentVariable("S3_BASE_URL"))}");
        Console.WriteLine($"UseS3: {_useS3}");
        Console.WriteLine($"BucketName: {_bucketName}");
        
        // Create upload directories if they don't exist (for local fallback)
        Directory.CreateDirectory(_uploadPath);
        Directory.CreateDirectory(System.IO.Path.Combine(_uploadPath, "artworks"));
        Directory.CreateDirectory(System.IO.Path.Combine(_uploadPath, "thumbnails"));
        Directory.CreateDirectory(System.IO.Path.Combine(_uploadPath, "page-content"));
        Directory.CreateDirectory(System.IO.Path.Combine(_uploadPath, "videos"));
    }

    public async Task<string> SaveImageAsync(IFormFile file, string folder)
    {
        if (file == null || file.Length == 0)
            throw new ArgumentException("File is empty");

        var fileName = $"{Guid.NewGuid()}{System.IO.Path.GetExtension(file.FileName)}";
        
        Console.WriteLine($"SaveImageAsync called:");
        Console.WriteLine($"File: {file.FileName}, Size: {file.Length}, ContentType: {file.ContentType}");
        Console.WriteLine($"Folder: {folder}, UseS3: {_useS3}");

        if (_useS3)
        {
            // Upload to S3
            Console.WriteLine("Attempting to upload to S3...");
            using var stream = file.OpenReadStream();
            var s3Path = $"{folder}/{fileName}";
            var result = await _s3Service.UploadFileAsync(stream, s3Path, file.ContentType);
            Console.WriteLine($"S3 upload successful: {result}");
            return result;
        }
        else
        {
            // Local storage fallback
            Console.WriteLine("Using local storage fallback...");
            var folderPath = System.IO.Path.Combine(_uploadPath, folder);
            Directory.CreateDirectory(folderPath);
            
            var filePath = System.IO.Path.Combine(folderPath, fileName);
        
        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

            var localPath = $"/uploads/{folder}/{fileName}";
            Console.WriteLine($"Local storage path: {localPath}");
            return localPath;
        }
    }

    public async Task<string> CreateThumbnailAsync(string imagePath, int width, int height)
    {
        if (_useS3)
        {
            // For S3: download, process, and re-upload
            Console.WriteLine($"Creating thumbnail for S3 image: {imagePath}");
            
            try
            {
                // Create temp directory
                var tempDir = System.IO.Path.Combine(_uploadPath, "temp");
                Directory.CreateDirectory(tempDir);
                
                // Generate unique filenames
                var tempImagePath = System.IO.Path.Combine(tempDir, $"temp_image_{Guid.NewGuid()}{System.IO.Path.GetExtension(imagePath)}");
                var tempThumbnailPath = System.IO.Path.Combine(tempDir, $"temp_thumb_{Guid.NewGuid()}{System.IO.Path.GetExtension(imagePath)}");
                
                try
                {
                    // Download image from S3
                    Console.WriteLine($"Downloading image from S3: {imagePath}");
                    
                    // Extract key from URL
                    var uri = new Uri(imagePath);
                    var key = uri.AbsolutePath.TrimStart('/');
                    if (key.StartsWith(_bucketName + "/"))
                    {
                        key = key.Substring(_bucketName.Length + 1);
                    }
                    
                    Console.WriteLine($"Extracted S3 key: {key}");
                    
                    // Download file from S3
                    using (var response = await _s3Service.GetObjectAsync(key))
                    using (var fileStream = File.Create(tempImagePath))
                    {
                        await response.ResponseStream.CopyToAsync(fileStream);
                    }
                    
                    Console.WriteLine($"Image downloaded to: {tempImagePath}");
                    
                    // Create thumbnail with watermark
                    using (var originalImage = await Image.LoadAsync(tempImagePath))
                    {
                        // Calculate aspect ratio to maintain proportions
                        var aspectRatio = (double)originalImage.Width / originalImage.Height;
                        var targetWidth = width;
                        var targetHeight = height;

                        if (aspectRatio > 1) // Landscape
                        {
                            targetHeight = (int)(width / aspectRatio);
                        }
                        else // Portrait or square
                        {
                            targetWidth = (int)(height * aspectRatio);
                        }

                        // Resize image
                        originalImage.Mutate(x => x.Resize(targetWidth, targetHeight));

                        // Save the thumbnail
                        var format = GetImageFormat(System.IO.Path.GetExtension(tempImagePath));
                        await originalImage.SaveAsync(tempThumbnailPath, format);
                    }
                    
                    Console.WriteLine($"Thumbnail created: {tempThumbnailPath}");
                    
                    // Upload thumbnail back to S3
                    using (var thumbnailStream = File.OpenRead(tempThumbnailPath))
                    {
                        var thumbnailName = $"thumbnails/thumb_{Guid.NewGuid()}{System.IO.Path.GetExtension(imagePath)}";
                        var thumbnailUrl = await _s3Service.UploadFileAsync(thumbnailStream, thumbnailName, "image/jpeg");
                        
                        Console.WriteLine($"Thumbnail uploaded to S3: {thumbnailUrl}");
                        return thumbnailUrl;
                    }
                }
                finally
                {
                    // Clean up temp files
                    if (File.Exists(tempImagePath))
                        File.Delete(tempImagePath);
                    if (File.Exists(tempThumbnailPath))
                        File.Delete(tempThumbnailPath);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error creating thumbnail for S3: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                // Fallback to original image if thumbnail creation fails
                return imagePath;
            }
        }
        else
        {
            // Local storage implementation
            var fullPath = System.IO.Path.Combine(_uploadPath, imagePath.TrimStart('/').Replace("uploads/", ""));
        
        if (!File.Exists(fullPath))
            throw new FileNotFoundException("Image not found", fullPath);

            var fileName = System.IO.Path.GetFileName(fullPath);
        var thumbnailName = $"thumb_{fileName}";
            var thumbnailPath = System.IO.Path.Combine(_uploadPath, "thumbnails", thumbnailName);
        
            Directory.CreateDirectory(System.IO.Path.GetDirectoryName(thumbnailPath)!);

        // Create thumbnail with watermark
        using (var originalImage = await Image.LoadAsync(fullPath))
        {
            // Calculate aspect ratio to maintain proportions
            var aspectRatio = (double)originalImage.Width / originalImage.Height;
            var targetWidth = width;
            var targetHeight = height;

            if (aspectRatio > 1) // Landscape
            {
                targetHeight = (int)(width / aspectRatio);
            }
            else // Portrait or square
            {
                targetWidth = (int)(height * aspectRatio);
            }

            // Resize image
            originalImage.Mutate(x => x.Resize(targetWidth, targetHeight));

            // Save the thumbnail
                var format = GetImageFormat(System.IO.Path.GetExtension(fullPath));
            await originalImage.SaveAsync(thumbnailPath, format);
        }

        return $"/uploads/thumbnails/{thumbnailName}";
        }
    }

    public async Task<string> AddWatermarkAsync(string imagePath, string watermarkText)
    {
        if (_useS3)
        {
            // For S3: download, process, and re-upload
            Console.WriteLine($"Adding watermark to S3 image: {imagePath}");
            
            try
            {
                // Create temp directory
                var tempDir = System.IO.Path.Combine(_uploadPath, "temp");
                Directory.CreateDirectory(tempDir);
                
                // Generate unique filenames
                var tempImagePath = System.IO.Path.Combine(tempDir, $"temp_image_{Guid.NewGuid()}{System.IO.Path.GetExtension(imagePath)}");
                var tempWatermarkedPath = System.IO.Path.Combine(tempDir, $"temp_watermarked_{Guid.NewGuid()}{System.IO.Path.GetExtension(imagePath)}");
                
                try
                {
                    // Download image from S3
                    Console.WriteLine($"Downloading image from S3: {imagePath}");
                    
                    // Extract key from URL
                    var uri = new Uri(imagePath);
                    var key = uri.AbsolutePath.TrimStart('/');
                    if (key.StartsWith(_bucketName + "/"))
                    {
                        key = key.Substring(_bucketName.Length + 1);
                    }
                    
                    Console.WriteLine($"Extracted S3 key: {key}");
                    
                    // Download file from S3
                    using (var response = await _s3Service.GetObjectAsync(key))
                    using (var fileStream = File.Create(tempImagePath))
                    {
                        await response.ResponseStream.CopyToAsync(fileStream);
                    }
                    
                    Console.WriteLine($"Image downloaded to: {tempImagePath}");
                    
                    // Create watermarked image
                    using (var originalImage = await Image.LoadAsync(tempImagePath))
                    {
                        // Add corner watermark
                        AddCornerWatermark(originalImage, originalImage.Width, originalImage.Height);

                        // Save the watermarked image
                        var format = GetImageFormat(System.IO.Path.GetExtension(tempImagePath));
                        await originalImage.SaveAsync(tempWatermarkedPath, format);
                    }
                    
                    Console.WriteLine($"Watermarked image created: {tempWatermarkedPath}");
                    
                    // Upload watermarked image back to S3
                    using (var watermarkedStream = File.OpenRead(tempWatermarkedPath))
                    {
                        var watermarkedName = $"artworks/watermarked_{Guid.NewGuid()}{System.IO.Path.GetExtension(imagePath)}";
                        var watermarkedUrl = await _s3Service.UploadFileAsync(watermarkedStream, watermarkedName, "image/jpeg");
                        
                        Console.WriteLine($"Watermarked image uploaded to S3: {watermarkedUrl}");
                        return watermarkedUrl;
                    }
                }
                finally
                {
                    // Clean up temp files
                    if (File.Exists(tempImagePath))
                        File.Delete(tempImagePath);
                    if (File.Exists(tempWatermarkedPath))
                        File.Delete(tempWatermarkedPath);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error adding watermark to S3 image: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                // Fallback to original image if watermarking fails
                return imagePath;
            }
        }
        else
        {
            // Local storage implementation
            var fullPath = System.IO.Path.Combine(_uploadPath, imagePath.TrimStart('/').Replace("uploads/", ""));
        
        if (!File.Exists(fullPath))
            throw new FileNotFoundException("Image not found", fullPath);

            var fileName = System.IO.Path.GetFileName(fullPath);
        var watermarkedName = $"watermarked_{fileName}";
            var watermarkedPath = System.IO.Path.Combine(_uploadPath, "artworks", watermarkedName);

        // Create watermarked image
        using (var originalImage = await Image.LoadAsync(fullPath))
        {
                // Add corner watermark
                AddCornerWatermark(originalImage, originalImage.Width, originalImage.Height);

                // Save the watermarked image
                var format = GetImageFormat(System.IO.Path.GetExtension(fullPath));
                await originalImage.SaveAsync(watermarkedPath, format);
            }

            return $"/uploads/artworks/{watermarkedName}";
        }
    }

    private void AddCornerWatermark(Image image, int width, int height)
    {
        var layout = WatermarkGeometry.Compute(width, height);
        try
        {
            var families = SystemFonts.Collection.Families.ToList();
            if (families.Count == 0)
            {
                CreateFallbackWatermark(image, layout);
                return;
            }

            var preferred = families.Where(f =>
                f.Name.Contains("DejaVu", StringComparison.OrdinalIgnoreCase) ||
                f.Name.Contains("Arial", StringComparison.OrdinalIgnoreCase) ||
                f.Name.Contains("Sans", StringComparison.OrdinalIgnoreCase)).ToList();
            var fontFamily = preferred.Count > 0 ? preferred[0] : families[0];

            var font = fontFamily.CreateFont(layout.FontSize);
            RichTextOptions Options(float dx, float dy) => new(font)
            {
                Origin = new PointF(layout.OriginX + dx, layout.OriginY + dy),
                KerningMode = KerningMode.Standard,
                HorizontalAlignment = HorizontalAlignment.Right,
                VerticalAlignment = VerticalAlignment.Bottom
            };

            image.Mutate(x => x
                .DrawText(Options(1, 1), WatermarkText, Color.FromRgba(0, 0, 0, (byte)(layout.Alpha * 0.8)))
                .DrawText(Options(0, 0), WatermarkText, Color.FromRgba(255, 255, 255, layout.Alpha)));
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error applying text watermark: {ex.Message}");
            CreateFallbackWatermark(image, layout);
        }
    }

    private static void CreateFallbackWatermark(Image image, WatermarkLayout layout)
    {
        var textWidth = WatermarkText.Length * layout.FontSize * 0.6f;
        var rect = new RectangleF(layout.OriginX - textWidth, layout.OriginY - layout.FontSize, textWidth, layout.FontSize);
        image.Mutate(x => x.Fill(Color.FromRgba(255, 255, 255, layout.Alpha), rect));
    }

    private IImageEncoder GetImageFormat(string extension)
    {
        return extension.ToLower() switch
        {
            ".jpg" or ".jpeg" => new JpegEncoder(),
            ".png" => new PngEncoder(),
            ".gif" => new GifEncoder(),
            ".bmp" => new BmpEncoder(),
            _ => new JpegEncoder()
        };
    }

    public void DeleteImage(string imagePath)
    {
        if (string.IsNullOrEmpty(imagePath))
            return;

        if (_useS3)
        {
            // Delete from S3
            _ = _s3Service.DeleteFileAsync(imagePath);
        }
        else
        {
            // Local storage fallback
            var fullPath = System.IO.Path.Combine(_uploadPath, imagePath.TrimStart('/').Replace("uploads/", ""));
        
        if (File.Exists(fullPath))
        {
            File.Delete(fullPath);
            }
        }
    }

    public async Task<string> CreateVideoThumbnailAsync(string videoPath, int width, int height)
    {
        if (_useS3)
        {
            // Для S3: скачиваем видео, создаем thumbnail, загружаем обратно в S3
            Console.WriteLine($"Creating video thumbnail for S3 video: {videoPath}");
            
            try
            {
                // Создаем временную папку для работы с файлами
                var tempDir = System.IO.Path.Combine(_uploadPath, "temp");
                Directory.CreateDirectory(tempDir);
                
                // Генерируем уникальные имена файлов
                var tempVideoPath = System.IO.Path.Combine(tempDir, $"temp_video_{Guid.NewGuid()}.mp4");
                var tempThumbnailPath = System.IO.Path.Combine(tempDir, $"temp_thumb_{Guid.NewGuid()}.jpg");
                
                try
                {
                    // Скачиваем видео из S3
                    Console.WriteLine($"Downloading video from S3: {videoPath}");
                    
                    // Извлекаем ключ из URL
                    var uri = new Uri(videoPath);
                    var key = uri.AbsolutePath.TrimStart('/');
                    if (key.StartsWith(_bucketName + "/"))
                    {
                        key = key.Substring(_bucketName.Length + 1);
                    }
                    
                    Console.WriteLine($"Extracted S3 key: {key}");
                    
                    // Скачиваем файл из S3
                    using (var response = await _s3Service.GetObjectAsync(key))
                    using (var fileStream = File.Create(tempVideoPath))
                    {
                        await response.ResponseStream.CopyToAsync(fileStream);
                    }
                    
                    Console.WriteLine($"Video downloaded to: {tempVideoPath}");
                    
                    // Создаем thumbnail с помощью FFmpeg
                    var command = $"-i \"{tempVideoPath}\" -ss 00:00:01 -vframes 1 -s {width}x{height} -f image2 \"{tempThumbnailPath}\"";
                    
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
                    
                    Console.WriteLine($"Thumbnail created: {tempThumbnailPath}");
                    
                    // Загружаем thumbnail обратно в S3
                    using (var thumbnailStream = File.OpenRead(tempThumbnailPath))
                    {
                        var thumbnailName = $"thumbnails/{DateTime.UtcNow:yyyy/MM/dd}/thumb_{Guid.NewGuid()}.jpg";
                        var thumbnailUrl = await _s3Service.UploadFileAsync(thumbnailStream, thumbnailName, "image/jpeg");
                        
                        Console.WriteLine($"Thumbnail uploaded to S3: {thumbnailUrl}");
                        return thumbnailUrl;
                    }
                }
                finally
                {
                    // Очищаем временные файлы
                    if (File.Exists(tempVideoPath))
                        File.Delete(tempVideoPath);
                    if (File.Exists(tempThumbnailPath))
                        File.Delete(tempThumbnailPath);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error creating video thumbnail for S3: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                throw;
            }
        }
        else
        {
            // Локальное хранилище
            var fullVideoPath = System.IO.Path.Combine(_uploadPath, videoPath.TrimStart('/').Replace("uploads/", ""));
        
        if (!File.Exists(fullVideoPath))
            throw new FileNotFoundException("Video not found", fullVideoPath);

            var fileNameWithoutExtension = System.IO.Path.GetFileNameWithoutExtension(fullVideoPath);
        var thumbnailName = $"{fileNameWithoutExtension}.jpg";
            var thumbnailPath = System.IO.Path.Combine(_uploadPath, "thumbnails", thumbnailName);
        
            Directory.CreateDirectory(System.IO.Path.GetDirectoryName(thumbnailPath)!);

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

    public string GetWatermarkText()
    {
        return _watermarkText;
    }
} 