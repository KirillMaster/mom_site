using Microsoft.EntityFrameworkCore;
using MomSite.Core.Interfaces;
using MomSite.Core.Models;
using MomSite.Infrastructure.Data;

namespace MomSite.Infrastructure.Blog;

public class BlogService : IBlogService
{
    private readonly ApplicationDbContext _db;
    private readonly BlogHtmlSanitizer _sanitizer;
    private readonly TimeProvider _time;

    public BlogService(ApplicationDbContext db, BlogHtmlSanitizer sanitizer, TimeProvider time)
    {
        _db = db;
        _sanitizer = sanitizer;
        _time = time;
    }

    private DateTime Now => _time.GetUtcNow().UtcDateTime;

    public async Task<BlogResult<BlogPostPage>> ListPublishedAsync(int page, string? categorySlug)
    {
        var query = _db.BlogPosts.AsNoTracking().Published(Now);
        BlogCategory? category = null;
        if (!string.IsNullOrEmpty(categorySlug))
        {
            category = await _db.BlogCategories.AsNoTracking().FirstOrDefaultAsync(c => c.Slug == categorySlug);
            if (category == null) return BlogResult<BlogPostPage>.NotFound();
            query = query.Where(p => p.BlogCategoryId == category.Id);
        }

        var total = await query.CountAsync();
        if (category != null && total == 0) return BlogResult<BlogPostPage>.NotFound();

        var items = await query.WithCategory()
            .OrderByDescending(p => p.PublishedAt)
            .Skip((Math.Max(page, 1) - 1) * IBlogService.PageSize)
            .Take(IBlogService.PageSize)
            .ToListAsync();
        return BlogResult<BlogPostPage>.Ok(new BlogPostPage(items, total, category));
    }

    public async Task<BlogResult<BlogPublicPost>> GetPublishedBySlugAsync(string slug)
    {
        var post = await _db.BlogPosts.AsNoTracking().Published(Now).WithCategory()
            .FirstOrDefaultAsync(p => p.Slug == slug);
        if (post == null) return BlogResult<BlogPublicPost>.NotFound();
        return BlogResult<BlogPublicPost>.Ok(new BlogPublicPost(post, await _db.VisibleArtworksAsync(post.Id)));
    }

    public async Task<IReadOnlyList<BlogCategoryCount>> ListCategoriesAsync(bool onlyNonEmpty)
    {
        var now = Now;
        var rows = await _db.BlogCategories.AsNoTracking()
            .OrderBy(c => c.DisplayOrder).ThenBy(c => c.Name)
            .Select(c => new
            {
                Category = c,
                Count = onlyNonEmpty
                    ? c.Posts.Count(p => p.PublishedAt != null && p.PublishedAt <= now)
                    : c.Posts.Count()
            })
            .ToListAsync();
        return rows.Where(r => !onlyNonEmpty || r.Count > 0)
            .Select(r => new BlogCategoryCount(r.Category, r.Count))
            .ToList();
    }

    public async Task<IReadOnlyList<BlogPost>> AdminListAsync() =>
        await _db.BlogPosts.AsNoTracking().WithCategory()
            .OrderByDescending(p => p.UpdatedAt)
            .ToListAsync();

    public async Task<BlogResult<BlogPost>> AdminGetAsync(int id)
    {
        var post = await _db.BlogPosts.AsNoTracking().WithCategory().Include(p => p.Artworks)
            .FirstOrDefaultAsync(p => p.Id == id);
        return post == null ? BlogResult<BlogPost>.NotFound() : BlogResult<BlogPost>.Ok(post);
    }

    public async Task<BlogResult<BlogPost>> CreateAsync(BlogPostInput input)
    {
        var post = new BlogPost { CreatedAt = Now };
        var error = await ApplyAsync(post, input, isNew: true);
        if (error != null) return error;
        _db.BlogPosts.Add(post);
        await _db.SaveChangesAsync();
        return await AdminGetAsync(post.Id);
    }

    public async Task<BlogResult<BlogPost>> UpdateAsync(int id, BlogPostInput input)
    {
        var post = await _db.BlogPosts.Include(p => p.Artworks).FirstOrDefaultAsync(p => p.Id == id);
        if (post == null) return BlogResult<BlogPost>.NotFound();
        if (IsLive(post) && input.Slug != post.Slug)
            return BlogResult<BlogPost>.Conflict(BlogConflict.SlugLockedAfterPublish);
        var error = await ApplyAsync(post, input, isNew: false);
        if (error != null) return error;
        await _db.SaveChangesAsync();
        return await AdminGetAsync(post.Id);
    }

    public async Task<BlogResult<bool>> DeleteAsync(int id)
    {
        var post = await _db.BlogPosts.FindAsync(id);
        if (post == null) return BlogResult<bool>.NotFound();
        _db.BlogPosts.Remove(post);
        await _db.SaveChangesAsync();
        return BlogResult<bool>.Ok(true);
    }

    public Task<BlogResult<BlogCategory>> CreateCategoryAsync(BlogCategoryInput input) =>
        BlogCategoryOperations.CreateAsync(_db, input);

    public Task<BlogResult<BlogCategory>> UpdateCategoryAsync(int id, BlogCategoryInput input) =>
        BlogCategoryOperations.UpdateAsync(_db, id, input);

    public Task<BlogResult<bool>> DeleteCategoryAsync(int id) =>
        BlogCategoryOperations.DeleteAsync(_db, id);

    private bool IsLive(BlogPost post) => post.PublishedAt != null && post.PublishedAt <= Now;

    private async Task<BlogResult<BlogPost>?> ApplyAsync(BlogPost post, BlogPostInput input, bool isNew)
    {
        var body = _sanitizer.Sanitize(input.BodyHtml);
        var errors = BlogPostValidator.Validate(input, body);
        var categoryId = input.BlogCategoryId ?? await _db.BlogCategories
            .Where(c => c.Slug == BlogCategory.DefaultSlug).Select(c => (int?)c.Id).FirstOrDefaultAsync();
        if (categoryId == null || !await _db.BlogCategories.AnyAsync(c => c.Id == categoryId))
            errors["blogCategoryId"] = "Выберите рубрику.";
        var artworkIds = (input.ArtworkIds ?? Array.Empty<int>()).Distinct().ToList();
        if (artworkIds.Count > 0 && await _db.Artworks.CountAsync(a => artworkIds.Contains(a.Id)) != artworkIds.Count)
            errors["artworkIds"] = "Некоторые работы не найдены — обновите страницу.";
        if (errors.Count > 0) return BlogResult<BlogPost>.Invalid(errors);

        if (isNew || input.Slug != post.Slug)
            post.Slug = await BlogSlug.MakeUniqueAsync(input.Slug,
                s => _db.BlogPosts.AnyAsync(p => p.Slug == s && p.Id != post.Id));

        var title = input.Title.Trim();
        post.Title = title;
        post.BodyHtml = body;
        post.Excerpt = Blank(input.Excerpt);
        post.CoverImagePath = Blank(input.CoverImagePath);
        post.CoverAlt = post.CoverImagePath == null ? null : Blank(input.CoverAlt) ?? title;
        post.SeoTitle = Blank(input.SeoTitle);
        post.SeoDescription = Blank(input.SeoDescription);
        post.BlogCategoryId = categoryId!.Value;
        post.PublishedAt = input.PublishedAt?.ToUniversalTime();
        post.UpdatedAt = Now;

        post.Artworks.Clear();
        for (var i = 0; i < artworkIds.Count; i++)
            post.Artworks.Add(new BlogPostArtwork { ArtworkId = artworkIds[i], SortOrder = i });
        return null;
    }

    private static string? Blank(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
