using System.ComponentModel.DataAnnotations;

namespace MomSite.Core.Models;

public class Review
{
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string AuthorName { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? AuthorCity { get; set; }

    [Required]
    [MaxLength(2000)]
    public string Text { get; set; } = string.Empty;

    [Range(1, 5)]
    public int Rating { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public bool IsPublished { get; set; } = false;

    public DateTime? PublishedAt { get; set; }

    public int SortOrder { get; set; }

    public int? ArtworkId { get; set; }
    public Artwork? Artwork { get; set; }

    [MaxLength(500)]
    public string? PhotoPath { get; set; }
}
