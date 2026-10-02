using MomSite.Core.Models;

namespace MomSite.Core.Interfaces;

public enum BlogOutcome { Ok, NotFound, ValidationFailed, Conflict }

public static class BlogConflict
{
    public const string SlugLockedAfterPublish = "slug_locked_after_publish";
    public const string CategoryNotEmpty = "category_not_empty";
}

public record BlogResult<T>(
    BlogOutcome Outcome,
    T? Value = default,
    IReadOnlyDictionary<string, string>? Errors = null,
    string? ConflictReason = null,
    int? PostCount = null)
{
    public static BlogResult<T> Ok(T value) => new(BlogOutcome.Ok, value);
    public static BlogResult<T> NotFound() => new(BlogOutcome.NotFound);
    public static BlogResult<T> Invalid(IReadOnlyDictionary<string, string> errors) => new(BlogOutcome.ValidationFailed, Errors: errors);
    public static BlogResult<T> Conflict(string reason, int? postCount = null) => new(BlogOutcome.Conflict, ConflictReason: reason, PostCount: postCount);
}

public record BlogPostInput(
    string Title,
    string Slug,
    string BodyHtml,
    string? Excerpt,
    string? CoverImagePath,
    string? CoverAlt,
    string? SeoTitle,
    string? SeoDescription,
    int? BlogCategoryId,
    IReadOnlyList<int>? ArtworkIds,
    DateTime? PublishedAt);

public record BlogCategoryInput(string Name, string Slug, string? Description, int DisplayOrder);

public record BlogPostPage(IReadOnlyList<BlogPost> Items, int Total, BlogCategory? Category);

public record BlogPublicPost(BlogPost Post, IReadOnlyList<Artwork> Artworks);

public record BlogCategoryCount(BlogCategory Category, int PostCount);

public interface IBlogService
{
    public const int PageSize = 12;

    Task<BlogResult<BlogPostPage>> ListPublishedAsync(int page, string? categorySlug);
    Task<BlogResult<BlogPublicPost>> GetPublishedBySlugAsync(string slug);
    Task<IReadOnlyList<BlogCategoryCount>> ListCategoriesAsync(bool onlyNonEmpty);

    Task<IReadOnlyList<BlogPost>> AdminListAsync();
    Task<BlogResult<BlogPost>> AdminGetAsync(int id);
    Task<BlogResult<BlogPost>> CreateAsync(BlogPostInput input);
    Task<BlogResult<BlogPost>> UpdateAsync(int id, BlogPostInput input);
    Task<BlogResult<bool>> DeleteAsync(int id);

    Task<BlogResult<BlogCategory>> CreateCategoryAsync(BlogCategoryInput input);
    Task<BlogResult<BlogCategory>> UpdateCategoryAsync(int id, BlogCategoryInput input);
    Task<BlogResult<bool>> DeleteCategoryAsync(int id);
}
