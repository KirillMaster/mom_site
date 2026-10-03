using System.ComponentModel.DataAnnotations;

namespace MomSite.Core.Models;

public class Artwork
{
    public int Id { get; set; }
    
    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;
    
    [MaxLength(ArtworkFieldRules.DescriptionMax)]
    public string? Description { get; set; }
    
    [Required]
    [MaxLength(500)]
    public string ImagePath { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(500)]
    public string ThumbnailPath { get; set; } = string.Empty;
    
    public decimal? Price { get; set; }
    
    public bool IsForSale { get; set; } = true;

    public ArtworkStatus Status { get; set; } = ArtworkStatus.Available;

    public decimal? WidthCm { get; set; }

    public decimal? HeightCm { get; set; }

    public int? Year { get; set; }

    [MaxLength(100)]
    public string? Support { get; set; }

    [MaxLength(100)]
    public string? Technique { get; set; }
    
    [MaxLength(ArtworkFieldRules.ShortDescriptionMax)]
    public string? ShortDescription { get; set; }

    public bool IsFeatured { get; set; }

    public bool NeedsReshoot { get; set; }

    public bool IsPublished { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    public int CategoryId { get; set; }
    public Category Category { get; set; } = null!;

    public List<ArtworkImage> Images { get; set; } = new();

    /// <summary>IsForSale is derived from Status; never written directly.</summary>
    public void ApplyStatus(ArtworkStatus status)
    {
        Status = status;
        IsForSale = status == ArtworkStatus.Available;
    }
}
