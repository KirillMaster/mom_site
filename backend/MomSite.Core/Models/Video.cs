using System.ComponentModel.DataAnnotations;

namespace MomSite.Core.Models;

public class Video
{
    public int Id { get; set; }
    
    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;
    
    [MaxLength(1000)]
    public string? Description { get; set; }
    
    [MaxLength(500)]
    public string VideoPath { get; set; } = string.Empty;
    
    [MaxLength(500)]
    public string? ThumbnailPath { get; set; }
    
    public int DisplayOrder { get; set; } = 0;
    
    public bool IsActive { get; set; } = true;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    public int VideoCategoryId { get; set; }
    public VideoCategory VideoCategory { get; set; } = null!;
} 