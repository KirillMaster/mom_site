using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using MomSite.Core.Models;
using MomSite.Infrastructure.Data;
using MomSite.Infrastructure.Services;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.PixelFormats;

namespace MomSite.Tests.Blog;

[Collection("AdminEnvIntegration")]
public class BlogAdminControllerTests : IClassFixture<BlogAdminWebApplicationFactory>
{
    private readonly BlogAdminWebApplicationFactory _factory;

    public BlogAdminControllerTests(BlogAdminWebApplicationFactory factory) => _factory = factory;

    public static IEnumerable<object[]> ProtectedRequests()
    {
        yield return new object[] { "GET", "/api/admin/blog" };
        yield return new object[] { "GET", "/api/admin/blog/1" };
        yield return new object[] { "POST", "/api/admin/blog" };
        yield return new object[] { "PUT", "/api/admin/blog/1" };
        yield return new object[] { "DELETE", "/api/admin/blog/1" };
        yield return new object[] { "GET", "/api/admin/blog/categories" };
        yield return new object[] { "POST", "/api/admin/blog/categories" };
        yield return new object[] { "PUT", "/api/admin/blog/categories/1" };
        yield return new object[] { "DELETE", "/api/admin/blog/categories/1" };
        yield return new object[] { "POST", "/api/admin/blog/images" };
    }

    [Theory]
    [MemberData(nameof(ProtectedRequests))]
    public async Task WithoutToken_Returns401(string method, string url)
    {
        var response = await _factory.CreateClient().SendAsync(new HttpRequestMessage(new HttpMethod(method), url));
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    private async Task<HttpClient> AdminClient()
    {
        await _factory.SeedAsync();
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", await _factory.GetAdminTokenAsync(client));
        return client;
    }

    private static object Post(string slug, DateTime? publishedAt = null) => new
    {
        title = "Выставка в Москве",
        slug,
        bodyHtml = "<p>Приглашаю на выставку</p>",
        publishedAt
    };

    private static async Task<JsonElement> Json(HttpResponseMessage response) =>
        await response.Content.ReadFromJsonAsync<JsonElement>();

    [Fact]
    public async Task Create_Returns201WithFinalSlugAndDraftStatus()
    {
        var client = await AdminClient();
        var response = await client.PostAsJsonAsync("/api/admin/blog", Post("create-test"));

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var body = await Json(response);
        Assert.Equal("create-test", body.GetProperty("slug").GetString());
        Assert.Equal("Draft", body.GetProperty("status").GetString());
        Assert.Equal("Новости", body.GetProperty("categoryName").GetString());
    }

    [Fact]
    public async Task DuplicateSlug_GetsSuffix()
    {
        var client = await AdminClient();
        await client.PostAsJsonAsync("/api/admin/blog", Post("dup-test"));
        var second = await Json(await client.PostAsJsonAsync("/api/admin/blog", Post("dup-test")));
        Assert.Equal("dup-test-2", second.GetProperty("slug").GetString());
    }

    [Fact]
    public async Task ChangingSlugOfPublishedPost_Returns409()
    {
        var client = await AdminClient();
        var publishedAt = DateTime.UtcNow.AddHours(-1);
        var created = await Json(await client.PostAsJsonAsync("/api/admin/blog", Post("locked-test", publishedAt)));
        Assert.Equal("Published", created.GetProperty("status").GetString());

        var response = await client.PutAsJsonAsync($"/api/admin/blog/{created.GetProperty("id").GetInt32()}",
            Post("locked-other", publishedAt));

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        Assert.Equal("slug_locked_after_publish", (await Json(response)).GetProperty("reason").GetString());
    }

    [Fact]
    public async Task EmptyTitle_Returns400WithRussianFieldError()
    {
        var client = await AdminClient();
        var response = await client.PostAsJsonAsync("/api/admin/blog", new { slug = "x", bodyHtml = "<p>т</p>" });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("Напишите заголовок.", (await Json(response)).GetProperty("errors").GetProperty("title").GetString());
    }

    [Fact]
    public async Task UnknownPost_Returns404()
    {
        var client = await AdminClient();
        Assert.Equal(HttpStatusCode.NotFound, (await client.GetAsync("/api/admin/blog/99999")).StatusCode);
    }

    [Fact]
    public async Task UploadGif_Returns400WithMessage()
    {
        var client = await AdminClient();
        var response = await client.PostAsync("/api/admin/blog/images", FileContent(new byte[] { 1, 2, 3 }, "a.gif", "image/gif"));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.False(string.IsNullOrWhiteSpace((await Json(response)).GetProperty("message").GetString()));
    }

    [Fact]
    public async Task UploadJpeg_IsResizedAndSavedToBlogFolder()
    {
        var client = await AdminClient();
        using var image = new Image<Rgba32>(3000, 2000);
        using var ms = new MemoryStream();
        await image.SaveAsJpegAsync(ms);

        var response = await client.PostAsync("/api/admin/blog/images", FileContent(ms.ToArray(), "photo.jpg", "image/jpeg"));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("https://s3.twcstorage.ru/test/blog/saved.jpg", (await Json(response)).GetProperty("url").GetString());
        Assert.Equal("blog", _factory.Images.LastFolder);
        Assert.Equal(1920, SixLabors.ImageSharp.Image.Identify(_factory.Images.LastBytes!).Width);
    }

    private static MultipartFormDataContent FileContent(byte[] bytes, string name, string contentType)
    {
        var file = new ByteArrayContent(bytes);
        file.Headers.ContentType = new MediaTypeHeaderValue(contentType);
        return new MultipartFormDataContent { { file, "file", name } };
    }
}

public class BlogAdminWebApplicationFactory : AdminMessagesWebApplicationFactory
{
    public FakeImageService Images { get; } = new();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        base.ConfigureWebHost(builder);
        builder.ConfigureTestServices(services =>
        {
            services.AddSingleton<IImageService>(Images);
        });
    }

    public async Task SeedAsync()
    {
        using var scope = Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        if (!db.BlogCategories.Any(c => c.Slug == BlogCategory.DefaultSlug))
        {
            db.BlogCategories.Add(new BlogCategory { Slug = BlogCategory.DefaultSlug, Name = "Новости" });
            await db.SaveChangesAsync();
        }
    }
}

public class FakeImageService : IImageService
{
    public string? LastFolder { get; private set; }
    public byte[]? LastBytes { get; private set; }

    public async Task<string> SaveImageAsync(IFormFile file, string folder)
    {
        using var ms = new MemoryStream();
        await file.CopyToAsync(ms);
        LastBytes = ms.ToArray();
        LastFolder = folder;
        return $"https://s3.twcstorage.ru/test/{folder}/saved.jpg";
    }

    public Task<string> CreateThumbnailAsync(string imagePath, int width, int height) => throw new NotSupportedException();
    public Task<string> AddWatermarkAsync(string imagePath, string watermarkText) => throw new NotSupportedException();
    public Task<string> CreateVideoThumbnailAsync(string videoPath, int width, int height) => throw new NotSupportedException();
    public void DeleteImage(string imagePath) => throw new NotSupportedException();
    public string GetWatermarkText() => string.Empty;
}
