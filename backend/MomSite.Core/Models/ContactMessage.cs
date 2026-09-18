using System.ComponentModel.DataAnnotations;

namespace MomSite.Core.Models;

public enum ContactMessageStatus
{
    New,
    Read,
    Archived
}

public class ContactMessage
{
    public int Id { get; set; }

    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    public string Subject { get; set; } = string.Empty;

    [Required]
    [MaxLength(5000)]
    public string Message { get; set; } = string.Empty;

    [MaxLength(64)]
    public string? IpAddress { get; set; }

    [MaxLength(512)]
    public string? UserAgent { get; set; }

    [MaxLength(200)]
    public string? UtmSource { get; set; }

    [MaxLength(200)]
    public string? UtmMedium { get; set; }

    [MaxLength(200)]
    public string? UtmCampaign { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ContactMessageStatus Status { get; set; } = ContactMessageStatus.New;
}
