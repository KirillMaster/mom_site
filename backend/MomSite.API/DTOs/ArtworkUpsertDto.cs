using System.ComponentModel.DataAnnotations;
using MomSite.Core.Models;

namespace MomSite.API.DTOs;

public abstract class ArtworkUpsertDtoBase : IValidatableObject
{
    public const int MinYear = 1950;

    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal? Price { get; set; }
    public int CategoryId { get; set; }
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

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        var max = DateTime.UtcNow.Year;
        if (Year is int y && (y < MinYear || y > max))
        {
            yield return new ValidationResult($"Year must be between {MinYear} and {max}", new[] { nameof(Year) });
        }
    }

    public void ApplyTo(Artwork artwork)
    {
        artwork.Title = Title;
        artwork.Description = Description;
        artwork.Price = Price;
        artwork.CategoryId = CategoryId;
        artwork.Status = Status;
        artwork.IsForSale = Status == ArtworkStatus.Available;
        artwork.WidthCm = WidthCm;
        artwork.HeightCm = HeightCm;
        artwork.Year = Year;
        artwork.Support = Support;
        artwork.Technique = Technique;
    }
}

public class CreateArtworkDto : ArtworkUpsertDtoBase
{
    public IFormFile Image { get; set; } = null!;
}

public class UpdateArtworkDto : ArtworkUpsertDtoBase
{
    public IFormFile? Image { get; set; }
}
