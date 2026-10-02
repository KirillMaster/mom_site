using System.Text.RegularExpressions;
using MomSite.Core.Interfaces;
using MomSite.Core.Models;
using MomSite.Infrastructure.Blog;

namespace MomSite.API.DTOs.Blog;

public class BlogCategoryRefDto
{
    public string Slug { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
}

public class BlogPageCategoryDto : BlogCategoryRefDto
{
    public string? Description { get; set; }
}

public class BlogPublicCategoryDto : BlogCategoryRefDto
{
    public int PostCount { get; set; }
}

public class BlogPostListItemDto
{
    public string Slug { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Excerpt { get; set; } = string.Empty;
    public string? CoverImagePath { get; set; }
    public string? CoverAlt { get; set; }
    public BlogCategoryRefDto Category { get; set; } = new();
    public DateTime PublishedAt { get; set; }
    public int ReadingMinutes { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class BlogPostDto : BlogPostListItemDto
{
    public string BodyHtml { get; set; } = string.Empty;
    public string? SeoTitle { get; set; }
    public string? SeoDescription { get; set; }
}

/// <summary>Slug работы фронт строит сам (buildArtworkSlug) — в БД его нет.</summary>
public class BlogRelatedArtworkDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string ThumbnailPath { get; set; } = string.Empty;
    public bool IsForSale { get; set; }
}

public class BlogPostPageDto
{
    public List<BlogPostListItemDto> Items { get; set; } = new();
    public int Total { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public BlogPageCategoryDto? Category { get; set; }
}

public class BlogPublicPostDto
{
    public BlogPostDto Post { get; set; } = new();
    public List<BlogRelatedArtworkDto> Artworks { get; set; } = new();
}

public static partial class BlogPublicMapping
{
    private const int AutoExcerptLength = 200;

    public static BlogPostPageDto ToDto(this BlogPostPage page, int pageNumber) => new()
    {
        Items = page.Items.Select(p => Fill(new BlogPostListItemDto(), p)).ToList(),
        Total = page.Total,
        Page = pageNumber,
        PageSize = IBlogService.PageSize,
        Category = page.Category == null ? null : new BlogPageCategoryDto
        {
            Slug = page.Category.Slug,
            Name = page.Category.Name,
            Description = page.Category.Description
        }
    };

    public static BlogPublicPostDto ToDto(this BlogPublicPost result)
    {
        var post = Fill(new BlogPostDto(), result.Post);
        post.BodyHtml = result.Post.BodyHtml;
        post.SeoTitle = result.Post.SeoTitle;
        post.SeoDescription = result.Post.SeoDescription;
        return new BlogPublicPostDto
        {
            Post = post,
            Artworks = result.Artworks.Select(a => new BlogRelatedArtworkDto
            {
                Id = a.Id,
                Title = a.Title,
                ThumbnailPath = a.ThumbnailPath,
                IsForSale = a.IsForSale
            }).ToList()
        };
    }

    public static BlogPublicCategoryDto ToPublicDto(this BlogCategoryCount c) =>
        new() { Slug = c.Category.Slug, Name = c.Category.Name, PostCount = c.PostCount };

    /// <summary>Анонс не обязателен для мамы — без него берём начало текста.</summary>
    public static string ExcerptOf(BlogPost post)
    {
        if (!string.IsNullOrWhiteSpace(post.Excerpt)) return post.Excerpt;
        var text = Spaces().Replace(System.Net.WebUtility.HtmlDecode(Tags().Replace(post.BodyHtml, " ")), " ").Trim();
        if (text.Length <= AutoExcerptLength) return text;
        var cut = text[..AutoExcerptLength];
        var lastSpace = cut.LastIndexOf(' ');
        return (lastSpace > 0 ? cut[..lastSpace] : cut).TrimEnd(',', '.', ';', ':') + "…";
    }

    private static T Fill<T>(T dto, BlogPost post) where T : BlogPostListItemDto
    {
        dto.Slug = post.Slug;
        dto.Title = post.Title;
        dto.Excerpt = ExcerptOf(post);
        dto.CoverImagePath = post.CoverImagePath;
        dto.CoverAlt = post.CoverAlt;
        dto.Category = new BlogCategoryRefDto { Slug = post.BlogCategory.Slug, Name = post.BlogCategory.Name };
        dto.PublishedAt = post.PublishedAt!.Value;
        dto.ReadingMinutes = BlogQueries.ReadingMinutes(post.BodyHtml);
        dto.UpdatedAt = post.UpdatedAt;
        return dto;
    }

    [GeneratedRegex("<[^>]+>")]
    private static partial Regex Tags();

    [GeneratedRegex(@"\s+")]
    private static partial Regex Spaces();
}
