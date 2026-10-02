using Microsoft.EntityFrameworkCore;
using MomSite.Core.Models;
using MomSite.Infrastructure.Data;

namespace MomSite.Infrastructure.Blog;

/// <summary>Выборки блога: «опубликовано» = PublishedAt задан и уже наступил.</summary>
public static class BlogQueries
{
    internal static IQueryable<BlogPost> Published(this IQueryable<BlogPost> posts, DateTime now) =>
        posts.Where(p => p.PublishedAt != null && p.PublishedAt <= now);

    internal static IQueryable<BlogPost> WithCategory(this IQueryable<BlogPost> posts) =>
        posts.Include(p => p.BlogCategory);

    internal static async Task<List<Artwork>> VisibleArtworksAsync(this ApplicationDbContext db, int postId) =>
        await db.BlogPostArtworks
            .Where(l => l.BlogPostId == postId)
            .OrderBy(l => l.SortOrder)
            .Join(db.Artworks.Visible(), l => l.ArtworkId, a => a.Id, (l, a) => a)
            .ToListAsync();

    public static int ReadingMinutes(string bodyHtml)
    {
        var text = System.Text.RegularExpressions.Regex.Replace(bodyHtml ?? string.Empty, "<[^>]+>", " ");
        var words = text.Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries).Length;
        return Math.Max(1, (int)Math.Ceiling(words / 180.0));
    }
}
