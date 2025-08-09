namespace MomSite.API.DTOs
{
    public class VideoDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string VideoPath { get; set; } = string.Empty;
        public string? ThumbnailPath { get; set; }
        public int VideoCategoryId { get; set; }
    }
}