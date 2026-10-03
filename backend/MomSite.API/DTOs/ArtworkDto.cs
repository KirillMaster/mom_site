using System.Text.Json.Serialization;
using MomSite.Core.Models;
namespace MomSite.API.DTOs
{
    public class ArtworkDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string ImagePath { get; set; } = string.Empty;
        public string ThumbnailPath { get; set; } = string.Empty;
        public decimal? Price { get; set; }
        public bool IsForSale { get; set; }
        [JsonConverter(typeof(JsonStringEnumConverter))]
        public ArtworkStatus Status { get; set; }
        public decimal? WidthCm { get; set; }
        public decimal? HeightCm { get; set; }
        public int? Year { get; set; }
        public string? Support { get; set; }
        public string? Technique { get; set; }
        public string? ShortDescription { get; set; }
        public bool IsFeatured { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public int CategoryId { get; set; }
        public CategoryDto? Category { get; set; } // Ссылка на DTO категории
        public List<ArtworkImageDto> Images { get; set; } = new();
    }
}