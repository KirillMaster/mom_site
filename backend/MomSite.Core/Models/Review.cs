using System.ComponentModel.DataAnnotations;

namespace MomSite.Core.Models;

public class Review
{
    public int Id { get; set; }
    
    [Required]
    [MaxLength(200)]
    public string AuthorName { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(1000)]
    public string Content { get; set; } = string.Empty;
    
    public int Rating { get; set; } = 5;
    
    public bool IsActive { get; set; } = true;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
} 