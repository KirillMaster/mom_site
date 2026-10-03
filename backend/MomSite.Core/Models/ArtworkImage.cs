using System.ComponentModel.DataAnnotations;

namespace MomSite.Core.Models;

public class ArtworkImage
{
    public int Id { get; set; }

    public int ArtworkId { get; set; }
    public Artwork? Artwork { get; set; }

    [Required]
    [MaxLength(500)]
    public string ImagePath { get; set; } = string.Empty;

    [Required]
    [MaxLength(500)]
    public string ThumbnailPath { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? OriginalPath { get; set; }

    public int SortOrder { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
