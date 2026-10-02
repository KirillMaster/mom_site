using MomSite.Core.Interfaces;
using MomSite.Core.Models;

namespace MomSite.API.DTOs.Blog;

[System.Text.Json.Serialization.JsonConverter(typeof(System.Text.Json.Serialization.JsonStringEnumConverter))]
public enum BlogPostStatus { Draft, Scheduled, Published }

public class BlogCoverDto
{
    public string? ImagePath { get; set; }
    public string? Alt { get; set; }
}

public class BlogSeoDto
{
    public string? Title { get; set; }
    public string? Description { get; set; }
}

/// <summary>Тело POST/PUT. Длины проверяет BlogService — здесь без DataAnnotations, чтобы ошибки шли одним форматом.</summary>
public class BlogPostSaveDto
{
    public string? Title { get; set; }
    public string? Slug { get; set; }
    public string? BodyHtml { get; set; }
    public string? Excerpt { get; set; }
    public BlogCoverDto? Cover { get; set; }
    public BlogSeoDto? Seo { get; set; }
    public int? BlogCategoryId { get; set; }
    public List<int>? ArtworkIds { get; set; }
    public DateTime? PublishedAt { get; set; }

    public BlogPostInput ToInput() => new(
        Title ?? string.Empty, Slug ?? string.Empty, BodyHtml ?? string.Empty, Excerpt,
        Cover?.ImagePath, Cover?.Alt, Seo?.Title, Seo?.Description,
        BlogCategoryId, ArtworkIds, PublishedAt);
}

public class BlogPostAdminListItemDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public BlogPostStatus Status { get; set; }
    public DateTime? PublishedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public int BlogCategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
}

public class BlogPostAdminDto : BlogPostAdminListItemDto
{
    public string BodyHtml { get; set; } = string.Empty;
    public string? Excerpt { get; set; }
    public BlogCoverDto Cover { get; set; } = new();
    public BlogSeoDto Seo { get; set; } = new();
    public List<int> ArtworkIds { get; set; } = new();
}

public class BlogCategorySaveDto
{
    public string? Name { get; set; }
    public string? Slug { get; set; }
    public string? Description { get; set; }
    public int DisplayOrder { get; set; }

    public BlogCategoryInput ToInput() => new(Name ?? string.Empty, Slug ?? string.Empty, Description, DisplayOrder);
}

public class BlogCategoryDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int DisplayOrder { get; set; }
    public int PostCount { get; set; }
}

public static class BlogAdminMapping
{
    public static BlogPostStatus StatusAt(this BlogPost post, DateTime now) =>
        post.PublishedAt == null ? BlogPostStatus.Draft
        : post.PublishedAt > now ? BlogPostStatus.Scheduled
        : BlogPostStatus.Published;

    public static BlogPostAdminListItemDto ToListItem(this BlogPost post, DateTime now) =>
        Fill(new BlogPostAdminListItemDto(), post, now);

    public static BlogPostAdminDto ToAdminDto(this BlogPost post, DateTime now)
    {
        var dto = Fill(new BlogPostAdminDto(), post, now);
        dto.BodyHtml = post.BodyHtml;
        dto.Excerpt = post.Excerpt;
        dto.Cover = new BlogCoverDto { ImagePath = post.CoverImagePath, Alt = post.CoverAlt };
        dto.Seo = new BlogSeoDto { Title = post.SeoTitle, Description = post.SeoDescription };
        dto.ArtworkIds = post.Artworks.OrderBy(a => a.SortOrder).Select(a => a.ArtworkId).ToList();
        return dto;
    }

    public static BlogCategoryDto ToDto(this BlogCategory category, int postCount = 0) => new()
    {
        Id = category.Id,
        Name = category.Name,
        Slug = category.Slug,
        Description = category.Description,
        DisplayOrder = category.DisplayOrder,
        PostCount = postCount
    };

    private static T Fill<T>(T dto, BlogPost post, DateTime now) where T : BlogPostAdminListItemDto
    {
        dto.Id = post.Id;
        dto.Title = post.Title;
        dto.Slug = post.Slug;
        dto.Status = post.StatusAt(now);
        dto.PublishedAt = post.PublishedAt;
        dto.UpdatedAt = post.UpdatedAt;
        dto.BlogCategoryId = post.BlogCategoryId;
        dto.CategoryName = post.BlogCategory?.Name ?? string.Empty;
        return dto;
    }
}
