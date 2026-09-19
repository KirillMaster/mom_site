namespace MomSite.API.DTOs
{
    public class ReviewAdminDto
    {
        public int Id { get; set; }
        public string AuthorName { get; set; } = string.Empty;
        public string? AuthorCity { get; set; }
        public string Text { get; set; } = string.Empty;
        public int Rating { get; set; }
        public DateTime CreatedAt { get; set; }
        public bool IsPublished { get; set; }
        public DateTime? PublishedAt { get; set; }
        public int SortOrder { get; set; }
        public int? ArtworkId { get; set; }
        public string? PhotoPath { get; set; }
    }

    public class CreateReviewAdminDto
    {
        public string AuthorName { get; set; } = string.Empty;
        public string? AuthorCity { get; set; }
        public string Text { get; set; } = string.Empty;
        public int Rating { get; set; }
        public int SortOrder { get; set; } = 0;
        public int? ArtworkId { get; set; }
        public string? PhotoPath { get; set; }
    }

    public class UpdateReviewDto
    {
        public string? AuthorName { get; set; }
        public string? AuthorCity { get; set; }
        public string? Text { get; set; }
        public int? Rating { get; set; }
        public int? SortOrder { get; set; }
        public int? ArtworkId { get; set; }
        public string? PhotoPath { get; set; }
    }
}
