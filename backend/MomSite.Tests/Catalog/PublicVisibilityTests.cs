using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using MomSite.API.Controllers;
using MomSite.Core.Interfaces;
using MomSite.Core.Models;
using MomSite.Infrastructure.Data;
using Xunit;

namespace MomSite.Tests.Catalog;

public class PublicVisibilityTests
{
    private sealed class Allow : IContactRateLimiter { public bool TryAcquire(string clientKey) => true; }

    private static async Task<MomSite.API.DTOs.GalleryData> Gallery(params Artwork[] items)
    {
        var db = new ApplicationDbContext(new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);
        db.Categories.Add(new Category { Id = 1, Name = "К", IsActive = true });
        foreach (var a in items) { a.CategoryId = 1; db.Artworks.Add(a); }
        await db.SaveChangesAsync();
        var c = new PublicController(db, Array.Empty<IFeedbackNotifier>(), Mock.Of<ILogger<PublicController>>(), new Allow());
        var ok = Assert.IsType<OkObjectResult>((await c.GetGalleryData()).Result);
        return Assert.IsType<MomSite.API.DTOs.GalleryData>(ok.Value);
    }

    private static Artwork Art(string title, ArtworkStatus status, bool published = true, decimal? price = 900)
    {
        var a = new Artwork { Title = title, Price = price, ImagePath = "a.jpg", ThumbnailPath = "t.jpg", IsPublished = published, NeedsReshoot = true };
        a.ApplyStatus(status);
        return a;
    }

    [Fact]
    public async Task Unpublished_and_not_mine_are_hidden()
    {
        var g = await Gallery(Art("ok", ArtworkStatus.Available), Art("draft", ArtworkStatus.Available, published: false), Art("alien", ArtworkStatus.NotMine));
        Assert.Equal(new[] { "ok" }, g.Artworks.Select(a => a.Title));
    }

    [Fact]
    public async Task Price_is_public_only_when_available()
    {
        var g = await Gallery(Art("a", ArtworkStatus.Available), Art("s", ArtworkStatus.Sold), Art("c", ArtworkStatus.PrivateCollection));
        Assert.Equal(900, g.Artworks.Single(a => a.Title == "a").Price);
        Assert.All(g.Artworks.Where(a => a.Title != "a"), a => Assert.Null(a.Price));
    }

    [Fact]
    public async Task Public_json_has_no_needs_reshoot()
    {
        var g = await Gallery(Art("a", ArtworkStatus.Available));
        Assert.DoesNotContain("reshoot", System.Text.Json.JsonSerializer.Serialize(g.Artworks[0]), StringComparison.OrdinalIgnoreCase);
    }
}
