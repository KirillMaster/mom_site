namespace MomSite.API.DTOs
{
    public class ArtworkImageDto
    {
        public int Id { get; set; }
        public string ImagePath { get; set; } = string.Empty;
        public string ThumbnailPath { get; set; } = string.Empty;
        public int SortOrder { get; set; }
    }

    public class ReorderImagesDto
    {
        public List<int> ImageIds { get; set; } = new();
    }

    public class ArtworkImagesResponse
    {
        public List<ArtworkImageDto> Images { get; set; } = new();
    }
}
