using System.ComponentModel.DataAnnotations;
using MomSite.Core.Models;

namespace MomSite.API.DTOs;

public abstract class ArtworkUpsertDtoBase : IValidatableObject
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal? Price { get; set; }
    public int CategoryId { get; set; }
    public ArtworkStatus Status { get; set; } = ArtworkStatus.Available;

    public decimal? WidthCm { get; set; }

    public decimal? HeightCm { get; set; }

    public int? Year { get; set; }

    [MaxLength(ArtworkFieldRules.SupportMax)]
    public string? Support { get; set; }

    [MaxLength(ArtworkFieldRules.TechniqueMax)]
    public string? Technique { get; set; }

    [MaxLength(ArtworkFieldRules.ShortDescriptionMax)]
    public string? ShortDescription { get; set; }

    public bool IsFeatured { get; set; }

    public bool NeedsReshoot { get; set; }

    public bool IsPublished { get; set; } = true;

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        var max = DateTime.UtcNow.Year;
        if (Year is int y && !ArtworkFieldRules.IsYearValid(y, DateTime.UtcNow))
        {
            yield return new ValidationResult($"Year must be between {ArtworkFieldRules.YearMin} and {max}", new[] { nameof(Year) });
        }
        if (WidthCm is decimal w && !ArtworkFieldRules.IsSizeValid(w))
        {
            yield return new ValidationResult("WidthCm must be between 1 and 1000", new[] { nameof(WidthCm) });
        }
        if (HeightCm is decimal h && !ArtworkFieldRules.IsSizeValid(h))
        {
            yield return new ValidationResult("HeightCm must be between 1 and 1000", new[] { nameof(HeightCm) });
        }
        if (Description is { } d && d.Length > ArtworkFieldRules.DescriptionMax)
        {
            yield return new ValidationResult($"Description must be at most {ArtworkFieldRules.DescriptionMax} characters", new[] { nameof(Description) });
        }
    }

    public void ApplyTo(Artwork artwork)
    {
        artwork.Title = Title;
        artwork.Description = Description;
        artwork.Price = Price;
        artwork.CategoryId = CategoryId;
        artwork.ApplyStatus(Status);
        artwork.WidthCm = WidthCm;
        artwork.HeightCm = HeightCm;
        artwork.Year = Year;
        artwork.Support = Support;
        artwork.Technique = Technique;
        artwork.ShortDescription = ShortDescription;
        artwork.IsFeatured = IsFeatured;
        artwork.NeedsReshoot = NeedsReshoot;
        artwork.IsPublished = IsPublished;
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
