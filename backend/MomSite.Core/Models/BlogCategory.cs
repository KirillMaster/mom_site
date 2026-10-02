using System.ComponentModel.DataAnnotations;

namespace MomSite.Core.Models;

public class BlogCategory
{
    public const string DefaultSlug = "novosti";

    public int Id { get; set; }

    [Required]
    [MaxLength(80)]
    public string Slug { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Description { get; set; }

    public int DisplayOrder { get; set; }

    public ICollection<BlogPost> Posts { get; set; } = new List<BlogPost>();
}
