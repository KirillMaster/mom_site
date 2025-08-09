using System.ComponentModel.DataAnnotations;

namespace MomSite.Core.Models;

public class PageContent
{
    public int Id { get; set; }
    
    [Required]
    [MaxLength(100)]
    public string PageKey { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(100)]
    public string ContentKey { get; set; } = string.Empty;
    
    [MaxLength(2000)]
    public string? TextContent { get; set; }
    
    [MaxLength(500)]
    public string? ImagePath { get; set; }
    
    [MaxLength(500)]
    public string? LinkUrl { get; set; }
    
    public int DisplayOrder { get; set; } = 0;
    
    public bool IsActive { get; set; } = true;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
} 