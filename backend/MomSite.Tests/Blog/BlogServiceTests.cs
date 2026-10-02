using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Time.Testing;
using MomSite.Core.Interfaces;
using MomSite.Core.Models;
using MomSite.Infrastructure.Blog;
using MomSite.Infrastructure.Data;

namespace MomSite.Tests.Blog;

public class BlogServiceTests
{
    private static readonly DateTime Now = new(2026, 10, 2, 12, 0, 0, DateTimeKind.Utc);
    private readonly ApplicationDbContext _db;
    private readonly BlogService _sut;

    public BlogServiceTests()
    {
        _db = new ApplicationDbContext(AdminTestHelpers.CreateDbOptions(Guid.NewGuid().ToString()));
        _db.BlogCategories.AddRange(
            new BlogCategory { Id = 1, Slug = BlogCategory.DefaultSlug, Name = "Новости" },
            new BlogCategory { Id = 2, Slug = "masterskaya", Name = "Мастерская", DisplayOrder = 1 });
        _db.Categories.Add(new Category { Id = 1, Name = "Пейзаж" });
        _db.Artworks.AddRange(
            new Artwork { Id = 10, Title = "Море", ImagePath = "a", ThumbnailPath = "a", CategoryId = 1 },
            new Artwork { Id = 11, Title = "Цирк", ImagePath = "b", ThumbnailPath = "b", CategoryId = 1 });
        _db.SaveChanges();
        _sut = new BlogService(_db, new BlogHtmlSanitizer(new[] { "s3.twcstorage.ru" }, "angelamoiseenko.ru"),
            new FakeTimeProvider(new DateTimeOffset(Now)));
    }

    private static BlogPostInput Input(string title = "Выставка", string slug = "vystavka", DateTime? publishedAt = null,
        int? categoryId = null, IReadOnlyList<int>? artworks = null, string? cover = null, string body = "<p>Текст</p>") =>
        new(title, slug, body, null, cover, null, null, null, categoryId, artworks, publishedAt);

    private async Task<BlogPost> Create(BlogPostInput input) => (await _sut.CreateAsync(input)).Value!;

    [Fact]
    public async Task DraftAndScheduledAreHiddenFromPublic()
    {
        await Create(Input(slug: "draft"));
        await Create(Input(slug: "tomorrow", publishedAt: Now.AddDays(1)));
        await Create(Input(slug: "live", publishedAt: Now.AddHours(-1)));

        var page = (await _sut.ListPublishedAsync(1, null)).Value!;
        Assert.Equal(new[] { "live" }, page.Items.Select(p => p.Slug));
        Assert.Equal(BlogOutcome.NotFound, (await _sut.GetPublishedBySlugAsync("draft")).Outcome);
        Assert.Equal(BlogOutcome.NotFound, (await _sut.GetPublishedBySlugAsync("tomorrow")).Outcome);
        Assert.Equal(BlogOutcome.Ok, (await _sut.GetPublishedBySlugAsync("live")).Outcome);
    }

    [Fact]
    public async Task DefaultsToNewsCategory() =>
        Assert.Equal(1, (await Create(Input())).BlogCategoryId);

    [Fact]
    public async Task CoverAltDefaultsToTitle() =>
        Assert.Equal("Выставка", (await Create(Input(cover: "https://s3.twcstorage.ru/b/blog/1.jpg"))).CoverAlt);

    [Fact]
    public async Task BodyIsSanitizedOnSave() =>
        Assert.Equal("<p>Текст</p>", (await Create(Input(body: "<script>x</script><p>Текст</p>"))).BodyHtml);

    [Fact]
    public async Task EmptyTitleAndBodyGiveRussianErrors()
    {
        var result = await _sut.CreateAsync(Input(title: " ", body: "<script>x</script>"));
        Assert.Equal(BlogOutcome.ValidationFailed, result.Outcome);
        Assert.Equal("Напишите заголовок.", result.Errors!["title"]);
        Assert.Contains("bodyHtml", result.Errors!.Keys);
    }

    [Fact]
    public async Task DuplicateSlugGetsSuffix()
    {
        await Create(Input());
        Assert.Equal("vystavka-2", (await Create(Input())).Slug);
    }

    [Fact]
    public async Task SlugIsLockedAfterPublish()
    {
        var post = await Create(Input(publishedAt: Now.AddHours(-1)));
        var result = await _sut.UpdateAsync(post.Id, Input(slug: "other", publishedAt: post.PublishedAt));
        Assert.Equal(BlogOutcome.Conflict, result.Outcome);
        Assert.Equal(BlogConflict.SlugLockedAfterPublish, result.ConflictReason);
    }

    [Fact]
    public async Task DraftSlugCanChange()
    {
        var post = await Create(Input());
        Assert.Equal("other", (await _sut.UpdateAsync(post.Id, Input(slug: "other"))).Value!.Slug);
    }

    [Fact]
    public async Task UpdateTouchesUpdatedAt()
    {
        var post = await Create(Input());
        var updated = (await _sut.UpdateAsync(post.Id, Input(title: "Новое"))).Value!;
        Assert.Equal("Новое", updated.Title);
        Assert.Equal(Now, updated.UpdatedAt);
    }

    [Fact]
    public async Task NonEmptyCategoryCannotBeDeleted()
    {
        await Create(Input(categoryId: 2));
        var result = await _sut.DeleteCategoryAsync(2);
        Assert.Equal(BlogConflict.CategoryNotEmpty, result.ConflictReason);
        Assert.Equal(1, result.PostCount);
    }

    [Fact]
    public async Task EmptyCategoryIsDeleted() =>
        Assert.Equal(BlogOutcome.Ok, (await _sut.DeleteCategoryAsync(2)).Outcome);

    [Fact]
    public async Task RelatedArtworksKeepOrder()
    {
        await Create(Input(publishedAt: Now.AddHours(-1), artworks: new[] { 11, 10 }));
        var post = (await _sut.GetPublishedBySlugAsync("vystavka")).Value!;
        Assert.Equal(new[] { 11, 10 }, post.Artworks.Select(a => a.Id));
    }

    [Fact]
    public async Task UnknownArtworkIsValidationError() =>
        Assert.Contains("artworkIds", (await _sut.CreateAsync(Input(artworks: new[] { 999 }))).Errors!.Keys);

    [Fact]
    public async Task CategoryFilterAndEmptyCategory404()
    {
        await Create(Input(publishedAt: Now.AddHours(-1), categoryId: 2));
        Assert.Single((await _sut.ListPublishedAsync(1, "masterskaya")).Value!.Items);
        Assert.Equal(BlogOutcome.NotFound, (await _sut.ListPublishedAsync(1, BlogCategory.DefaultSlug)).Outcome);
        Assert.Equal(BlogOutcome.NotFound, (await _sut.ListPublishedAsync(1, "unknown")).Outcome);
    }

    [Fact]
    public async Task PublicCategoriesOnlyNonEmpty()
    {
        await Create(Input(publishedAt: Now.AddHours(-1), categoryId: 2));
        var list = await _sut.ListCategoriesAsync(onlyNonEmpty: true);
        Assert.Equal("masterskaya", Assert.Single(list).Category.Slug);
    }

    [Fact]
    public async Task PaginatesByTwelve()
    {
        for (var i = 0; i < 15; i++) await Create(Input(slug: $"p{i}", publishedAt: Now.AddMinutes(-i - 1)));
        var page2 = (await _sut.ListPublishedAsync(2, null)).Value!;
        Assert.Equal(15, page2.Total);
        Assert.Equal(3, page2.Items.Count);
    }

    [Fact]
    public void ReadingMinutesRoundsUp() =>
        Assert.Equal(2, BlogQueries.ReadingMinutes("<p>" + string.Join(" ", Enumerable.Repeat("слово", 200)) + "</p>"));
}
