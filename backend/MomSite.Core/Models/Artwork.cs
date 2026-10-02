using System.ComponentModel.DataAnnotations;

namespace MomSite.Core.Models;

public class Artwork
{
    public int Id { get; set; }
    
    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;
    
    [MaxLength(1000)]
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

    [Range(1, 1000)]
    public int? WidthCm { get; set; }

    [Range(1, 1000)]
    public int? HeightCm { get; set; }

    public int? Year { get; set; }

    [MaxLength(100)]
    public string? Support { get; set; }

    [MaxLength(100)]
    public string? Technique { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    public int CategoryId { get; set; }
    public Category Category { get; set; } = null!;

    public List<ArtworkImage> Images { get; set; } = new();
} 