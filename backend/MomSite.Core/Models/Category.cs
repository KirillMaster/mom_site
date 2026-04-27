using System.ComponentModel.DataAnnotations;

namespace MomSite.Core.Models;

public class Category
{
    public int Id { get; set; }
    
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;
    
    [MaxLength(500)]
    public string? Description { get; set; }
    
    public int DisplayOrder { get; set; } = 0;
    
    public bool IsActive { get; set; } = true;

    // When false, artworks of this category are hidden from the home page carousel
    // (gallery and direct category browsing still show them)
    public bool ShowOnHome { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    public ICollection<Artwork> Artworks { get; set; } = new List<Artwork>();
} 