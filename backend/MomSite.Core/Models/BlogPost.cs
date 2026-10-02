using System.ComponentModel.DataAnnotations;

namespace MomSite.Core.Models;

public class BlogPost
{
    public int Id { get; set; }

    [Required]
    [MaxLength(120)]
    public string Slug { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(300)]
    public string? Excerpt { get; set; }

    [Required]
    public string BodyHtml { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? CoverImagePath { get; set; }

    [MaxLength(200)]
    public string? CoverAlt { get; set; }

    [MaxLength(70)]
    public string? SeoTitle { get; set; }

    [MaxLength(200)]
    public string? SeoDescription { get; set; }

    public int BlogCategoryId { get; set; }
    public BlogCategory BlogCategory { get; set; } = null!;

    /// <summary>null — черновик; в будущем — запланировано.</summary>
    public DateTime? PublishedAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<BlogPostArtwork> Artworks { get; set; } = new List<BlogPostArtwork>();
}
