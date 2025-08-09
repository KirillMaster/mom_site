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
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public int CategoryId { get; set; }
        public CategoryDto? Category { get; set; } // Ссылка на DTO категории
    }
}