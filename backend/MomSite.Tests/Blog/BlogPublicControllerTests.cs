using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.DependencyInjection;
using MomSite.Core.Models;
using MomSite.Infrastructure.Data;

namespace MomSite.Tests.Blog;

[Collection("AdminEnvIntegration")]
public class BlogPublicControllerTests : IClassFixture<BlogAdminWebApplicationFactory>
{
    private readonly BlogAdminWebApplicationFactory _factory;

    public BlogPublicControllerTests(BlogAdminWebApplicationFactory factory) => _factory = factory;

    private async Task<BlogCategory> CategoryAsync(string slug, string name = "Рубрика")
    {
        await _factory.SeedAsync();
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var category = db.BlogCategories.FirstOrDefault(c => c.Slug == slug);
        if (category != null) return category;
        category = new BlogCategory { Slug = slug, Name = name, Description = "Описание рубрики" };
        db.BlogCategories.Add(category);
        await db.SaveChangesAsync();
        return category;
    }

    private async Task AddPostAsync(BlogCategory category, string slug, DateTime? publishedAt,
        string body = "<p>Приглашаю на выставку</p>", string? excerpt = null, int? artworkId = null)
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var post = new BlogPost
        {
            Slug = slug, Title = "Заголовок " + slug, BodyHtml = body, Excerpt = excerpt,
            BlogCategoryId = category.Id, PublishedAt = publishedAt
        };
        if (artworkId != null) post.Artworks.Add(new BlogPostArtwork { ArtworkId = artworkId.Value });
        db.BlogPosts.Add(post);
        await db.SaveChangesAsync();
    }

    private async Task<HttpResponseMessage> Get(string url) => await _factory.CreateClient().GetAsync(url);

    private static async Task<JsonElement> Json(HttpResponseMessage response) =>
        await response.Content.ReadFromJsonAsync<JsonElement>();

    private static readonly DateTime Past = DateTime.UtcNow.AddDays(-1);

    [Theory]
    [InlineData("pub-draft", false)]
    [InlineData("pub-future", true)]
    public async Task DraftOrScheduledPost_Returns404(string slug, bool scheduled)
    {
        var category = await CategoryAsync("pub-hidden");
        await AddPostAsync(category, slug, scheduled ? DateTime.UtcNow.AddDays(3) : null);

        var response = await Get($"/api/public/blog/{slug}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.False(string.IsNullOrWhiteSpace((await Json(response)).GetProperty("message").GetString()));
    }

    [Fact]
    public async Task UnknownPost_Returns404() =>
        Assert.Equal(HttpStatusCode.NotFound, (await Get("/api/public/blog/net-takoy")).StatusCode);

    [Fact]
    public async Task PublishedPost_ReturnsBodyCategoryAndAutoExcerpt()
    {
        var category = await CategoryAsync("pub-one", "Выставки");
        await AddPostAsync(category, "pub-open", Past, body: "<p>Приглашаю&nbsp;на <b>выставку</b></p>");

        var response = await Get("/api/public/blog/pub-open");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var post = (await Json(response)).GetProperty("post");
        Assert.Equal("<p>Приглашаю&nbsp;на <b>выставку</b></p>", post.GetProperty("bodyHtml").GetString());
        Assert.Equal("Приглашаю на выставку", post.GetProperty("excerpt").GetString());
        Assert.Equal("pub-one", post.GetProperty("category").GetProperty("slug").GetString());
        Assert.Equal("Выставки", post.GetProperty("category").GetProperty("name").GetString());
        Assert.Equal(1, post.GetProperty("readingMinutes").GetInt32());
    }

    [Fact]
    public async Task List_Returns12PerPageNewestFirst()
    {
        var category = await CategoryAsync("pub-many");
        for (var i = 1; i <= 15; i++)
            await AddPostAsync(category, $"pub-many-{i}", Past.AddMinutes(i));
        await AddPostAsync(category, "pub-many-draft", null);

        var first = await Json(await Get("/api/public/blog?categorySlug=pub-many"));
        var second = await Json(await Get("/api/public/blog?categorySlug=pub-many&page=2"));

        Assert.Equal(15, first.GetProperty("total").GetInt32());
        Assert.Equal(12, first.GetProperty("pageSize").GetInt32());
        Assert.Equal(12, first.GetProperty("items").GetArrayLength());
        Assert.Equal("pub-many-15", first.GetProperty("items")[0].GetProperty("slug").GetString());
        Assert.Equal(2, second.GetProperty("page").GetInt32());
        Assert.Equal(3, second.GetProperty("items").GetArrayLength());
        Assert.Equal("Описание рубрики", first.GetProperty("category").GetProperty("description").GetString());
    }

    [Fact]
    public async Task List_FiltersByCategory()
    {
        var a = await CategoryAsync("pub-a");
        var b = await CategoryAsync("pub-b");
        await AddPostAsync(a, "pub-in-a", Past);
        await AddPostAsync(b, "pub-in-b", Past);

        var items = (await Json(await Get("/api/public/blog?categorySlug=pub-a"))).GetProperty("items");

        Assert.Equal(new[] { "pub-in-a" }, items.EnumerateArray().Select(i => i.GetProperty("slug").GetString()));
    }

    [Theory]
    [InlineData("pub-unknown-category")]
    [InlineData("pub-only-drafts")]
    public async Task List_UnknownOrEmptyCategory_Returns404(string slug)
    {
        if (slug == "pub-only-drafts") await AddPostAsync(await CategoryAsync(slug), "pub-od", null);
        Assert.Equal(HttpStatusCode.NotFound, (await Get($"/api/public/blog?categorySlug={slug}")).StatusCode);
    }

    [Fact]
    public async Task Categories_ReturnOnlyNonEmpty()
    {
        await AddPostAsync(await CategoryAsync("pub-cat-full"), "pub-cat-post", Past);
        await AddPostAsync(await CategoryAsync("pub-cat-draft"), "pub-cat-draft-post", null);
        await CategoryAsync("pub-cat-empty");

        var categories = (await Json(await Get("/api/public/blog/categories"))).EnumerateArray().ToList();
        var slugs = categories.Select(c => c.GetProperty("slug").GetString()).ToList();

        Assert.Contains("pub-cat-full", slugs);
        Assert.DoesNotContain("pub-cat-draft", slugs);
        Assert.DoesNotContain("pub-cat-empty", slugs);
        Assert.Equal(1, categories.Single(c => c.GetProperty("slug").GetString() == "pub-cat-full")
            .GetProperty("postCount").GetInt32());
    }

    [Fact]
    public async Task ExistingPublicRoutes_StillWork() =>
        Assert.Equal(HttpStatusCode.OK, (await Get("/api/Public/health")).StatusCode);
}
