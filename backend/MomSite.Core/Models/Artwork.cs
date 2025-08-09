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
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    public int CategoryId { get; set; }
    public Category Category { get; set; } = null!;
} 