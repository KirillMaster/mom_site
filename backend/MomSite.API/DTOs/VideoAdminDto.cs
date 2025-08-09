namespace MomSite.API.DTOs
{
    public class VideoAdminDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string VideoPath { get; set; } = string.Empty;
        public string? ThumbnailPath { get; set; }
        public int VideoCategoryId { get; set; }
        public string? VideoCategoryName { get; set; }
        public int DisplayOrder { get; set; }
        public bool IsActive { get; set; }
    }
}