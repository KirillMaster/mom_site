using Amazon.S3;
using Amazon.S3.Model;
using Amazon.S3.Transfer;
using Microsoft.Extensions.Configuration;
using System.Text;

namespace MomSite.Infrastructure.Services
{
    public interface IS3Service
    {
        Task<string> UploadFileAsync(Stream fileStream, string fileName, string contentType);
        Task<bool> DeleteFileAsync(string fileUrl);
        Task<string> GetFileUrlAsync(string fileName);
        Task<bool> FileExistsAsync(string fileName);
        Task<bool> TestConnectionAsync();
        Task<GetObjectResponse> GetObjectAsync(string key);
    }

    public class S3Service : IS3Service
    {
        private readonly IAmazonS3 _s3Client;
        private readonly string _bucketName;
        private readonly string _baseUrl;

        public S3Service(IConfiguration configuration)
        {
            var accessKey = Environment.GetEnvironmentVariable("S3_ACCESS_KEY") ?? configuration["S3:AccessKey"];
            var secretKey = Environment.GetEnvironmentVariable("S3_SECRET_KEY") ?? configuration["S3:SecretKey"];
            var serviceUrl = Environment.GetEnvironmentVariable("S3_SERVICE_URL") ?? configuration["S3:ServiceUrl"];
            _bucketName = Environment.GetEnvironmentVariable("S3_BUCKET_NAME") ?? configuration["S3:BucketName"];
            _baseUrl = Environment.GetEnvironmentVariable("S3_BASE_URL") ?? configuration["S3:BaseUrl"];

            Console.WriteLine($"S3Service initialized:");
            Console.WriteLine($"AccessKey: {(!string.IsNullOrEmpty(accessKey) ? "SET" : "NOT SET")}");
            Console.WriteLine($"SecretKey: {(!string.IsNullOrEmpty(secretKey) ? "SET" : "NOT SET")}");
            Console.WriteLine($"ServiceUrl: {serviceUrl}");
            Console.WriteLine($"BucketName: {_bucketName}");
            Console.WriteLine($"BaseUrl: {_baseUrl}");

            // Для Timeweb S3 используем правильный endpoint согласно документации
            var config = new AmazonS3Config
            {
                ServiceURL = "https://s3.twcstorage.ru", // Правильный endpoint для Timeweb S3
                ForcePathStyle = true, // Важно для S3-совместимых сервисов
                // RegionEndpoint = Amazon.RegionEndpoint.USEast1, // Используем любой регион, так как ForcePathStyle=true
                UseHttp = false, // Используем HTTPS
                Timeout = TimeSpan.FromMinutes(5) // Увеличиваем timeout
            };

            _s3Client = new AmazonS3Client(accessKey, secretKey, config);
            Console.WriteLine("S3Client created successfully");
            Console.WriteLine($"Using endpoint: https://s3.twcstorage.ru");
            Console.WriteLine($"Using region: ru-1 (configured via ForcePathStyle)");
            Console.WriteLine($"Bucket: {_bucketName}");
            Console.WriteLine($"Base URL: {_baseUrl}");
        }

        public async Task<bool> TestConnectionAsync()
        {
            try
            {
                Console.WriteLine("Testing S3 connection...");
                
                // Пробуем получить список объектов в bucket
                var listRequest = new ListObjectsV2Request
                {
                    BucketName = _bucketName,
                    MaxKeys = 1
                };

                var response = await _s3Client.ListObjectsV2Async(listRequest);
                Console.WriteLine($"S3 connection test successful. Found {response.S3Objects.Count} objects in bucket.");
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"S3 connection test failed: {ex.Message}");
                return false;
            }
        }

        public async Task<string> UploadFileAsync(Stream fileStream, string fileName, string contentType)
        {
            try
            {
                Console.WriteLine($"S3Service.UploadFileAsync called with fileName: {fileName}");
                
                // Генерируем уникальное имя файла
                var uniqueFileName = $"{DateTime.UtcNow:yyyy/MM/dd}/{Guid.NewGuid()}_{fileName}";
                Console.WriteLine($"Unique fileName: {uniqueFileName}");

                var putRequest = new PutObjectRequest
                {
                    BucketName = _bucketName,
                    Key = uniqueFileName,
                    InputStream = fileStream,
                    ContentType = contentType
                };

                var response = await _s3Client.PutObjectAsync(putRequest);
                Console.WriteLine($"File uploaded to S3 successfully. ETag: {response.ETag}");

                // Возвращаем полный URL файла согласно документации Timeweb
                // Формат: https://s3.twcstorage.ru/{bucket-name}/{key}
                var result = $"https://s3.twcstorage.ru/{_bucketName}/{uniqueFileName}";
                Console.WriteLine($"Returning URL: {result}");
                return result;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error uploading file to S3: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                throw;
            }
        }

        public async Task<bool> DeleteFileAsync(string fileUrl)
        {
            try
            {
                // Извлекаем ключ файла из URL
                var key = ExtractKeyFromUrl(fileUrl);
                if (string.IsNullOrEmpty(key))
                    return false;

                var deleteRequest = new DeleteObjectRequest
                {
                    BucketName = _bucketName,
                    Key = key
                };

                await _s3Client.DeleteObjectAsync(deleteRequest);
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error deleting file from S3: {ex.Message}");
                return false;
            }
        }

        public async Task<string> GetFileUrlAsync(string fileName)
        {
            // Возвращаем URL в формате Timeweb S3
            return $"https://s3.twcstorage.ru/{_bucketName}/{fileName}";
        }

        public async Task<bool> FileExistsAsync(string fileName)
        {
            try
            {
                var request = new GetObjectMetadataRequest
                {
                    BucketName = _bucketName,
                    Key = fileName
                };

                await _s3Client.GetObjectMetadataAsync(request);
                return true;
            }
            catch (AmazonS3Exception ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
            {
                return false;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error checking file existence in S3: {ex.Message}");
                return false;
            }
        }

        private string ExtractKeyFromUrl(string fileUrl)
        {
            try
            {
                var uri = new Uri(fileUrl);
                var path = uri.AbsolutePath;
                
                // Убираем начальный слеш
                if (path.StartsWith("/"))
                    path = path.Substring(1);
                
                return path;
            }
            catch
            {
                return null;
            }
        }

        public async Task<GetObjectResponse> GetObjectAsync(string key)
        {
            try
            {
                Console.WriteLine($"S3Service.GetObjectAsync called with key: {key}");
                
                var request = new GetObjectRequest
                {
                    BucketName = _bucketName,
                    Key = key
                };

                var response = await _s3Client.GetObjectAsync(request);
                Console.WriteLine($"File downloaded from S3 successfully. ContentLength: {response.ContentLength}");
                
                return response;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error downloading file from S3: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                throw;
            }
        }
    }
}
