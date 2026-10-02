using System.Net.Http.Headers;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using MomSite.Core.Models;
using MomSite.Infrastructure.Data;
using MomSite.Infrastructure.Services;

namespace MomSite.Tests
{
    internal static class ArtworkImageFixtures
    {
        public static IFormFile Image(string name = "a.jpg", string contentType = "image/jpeg", long? length = null)
        {
            var bytes = new byte[] { 1, 2, 3 };
            var stream = new MemoryStream(bytes);
            return new FormFile(stream, 0, length ?? bytes.Length, "Images", name)
            {
                Headers = new HeaderDictionary(),
                ContentType = contentType
            };
        }

        public static Mock<IImageService> ImageServiceMock(List<string>? deleted = null)
        {
            var mock = new Mock<IImageService>();
            mock.Setup(m => m.SaveImageAsync(It.IsAny<IFormFile>(), It.IsAny<string>()))
                .ReturnsAsync((IFormFile f, string _) => $"/uploads/artworks/{Guid.NewGuid():N}_{f.FileName}");
            mock.Setup(m => m.CreateThumbnailAsync(It.IsAny<string>(), It.IsAny<int>(), It.IsAny<int>()))
                .ReturnsAsync((string p, int w, int h) => p.Replace("/artworks/", "/thumbnails/"));
            mock.Setup(m => m.AddWatermarkAsync(It.IsAny<string>(), It.IsAny<string>()))
                .ReturnsAsync((string p, string t) => p);
            mock.Setup(m => m.GetWatermarkText()).Returns("wm");
            if (deleted != null)
                mock.Setup(m => m.DeleteImage(It.IsAny<string>())).Callback<string>(deleted.Add);
            return mock;
        }

        public static async Task<Artwork> SeedArtworkAsync(ApplicationDbContext context, int imageCount, string title = "Сирень")
        {
            var category = new Category { Name = "Cat " + Guid.NewGuid().ToString("N") };
            var artwork = new Artwork { Title = title, Category = category };
            for (var i = 0; i < imageCount; i++)
            {
                artwork.Images.Add(new ArtworkImage
                {
                    ImagePath = $"/uploads/artworks/{title}-{i}.jpg",
                    ThumbnailPath = $"/uploads/thumbnails/{title}-{i}.jpg",
                    SortOrder = i
                });
            }
            artwork.ImagePath = imageCount > 0 ? artwork.Images[0].ImagePath : "/uploads/artworks/legacy.jpg";
            artwork.ThumbnailPath = imageCount > 0 ? artwork.Images[0].ThumbnailPath : "/uploads/thumbnails/legacy.jpg";
            context.Artworks.Add(artwork);
            await context.SaveChangesAsync();
            return artwork;
        }
    }

    public class ArtworkImagesWebApplicationFactory : WebApplicationFactory<Program>
    {
        private const string Secret = "artwork-images-integration-test-jwt-signing-secret-32b";
        private const string Password = "artwork-images-integration-test-admin-password";

        private readonly SqliteConnection _connection = new("DataSource=:memory:");
        public List<string> DeletedFiles { get; } = new();

        public ArtworkImagesWebApplicationFactory()
        {
            _connection.Open();
            Environment.SetEnvironmentVariable("JWT__Secret", Secret);
            Environment.SetEnvironmentVariable("AdminPassword", Password);
            using var scope = Services.CreateScope();
            scope.ServiceProvider.GetRequiredService<ApplicationDbContext>().Database.EnsureCreated();
        }

        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.UseEnvironment("Testing");
            builder.ConfigureServices(services =>
            {
                var remove = services
                    .Where(d => d.ServiceType == typeof(ApplicationDbContext)
                             || d.ServiceType == typeof(IImageService)
                             || (d.ServiceType.IsGenericType
                                 && d.ServiceType.GetGenericArguments().Contains(typeof(ApplicationDbContext))))
                    .ToList();
                foreach (var d in remove) services.Remove(d);
                services.AddDbContext<ApplicationDbContext>(o => o.UseSqlite(_connection));
                services.AddSingleton(ArtworkImageFixtures.ImageServiceMock(DeletedFiles).Object);
            });
        }

        public async Task<HttpClient> CreateAuthorizedClientAsync()
        {
            var client = CreateClient();
            var response = await client.PostAsJsonAsync("/api/admin/login", new { Username = "admin", Password = Password });
            response.EnsureSuccessStatusCode();
            var payload = await response.Content.ReadFromJsonAsync<LoginResponse>();
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", payload!.Token);
            return client;
        }

        public async Task<T> WithDbAsync<T>(Func<ApplicationDbContext, Task<T>> action)
        {
            using var scope = Services.CreateScope();
            return await action(scope.ServiceProvider.GetRequiredService<ApplicationDbContext>());
        }

        protected override void Dispose(bool disposing)
        {
            base.Dispose(disposing);
            if (disposing)
            {
                _connection.Dispose();
                Environment.SetEnvironmentVariable("JWT__Secret", null);
                Environment.SetEnvironmentVariable("AdminPassword", null);
            }
        }

        private sealed class LoginResponse { public string Token { get; set; } = string.Empty; }
    }
}
