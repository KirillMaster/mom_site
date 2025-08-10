using MomSite.Core.Models;

namespace MomSite.API.DTOs
{
    public static class MappingExtensions
    {
        public static ArtworkDto ToDto(this Artwork artwork)
        {
            return new ArtworkDto
            {
                Id = artwork.Id,
                Title = artwork.Title,
                Description = artwork.Description,
                ImagePath = artwork.ImagePath,
                ThumbnailPath = artwork.ThumbnailPath,
                Price = artwork.Price,
                IsForSale = artwork.IsForSale,
                CreatedAt = artwork.CreatedAt,
                UpdatedAt = artwork.UpdatedAt,
                CategoryId = artwork.CategoryId,
                Category = artwork.Category?.ToDto()
            };
        }

        public static CategoryDto ToDto(this Category category)
        {
            return new CategoryDto
            {
                Id = category.Id,
                Name = category.Name,
                Description = category.Description,
                DisplayOrder = category.DisplayOrder,
                IsActive = category.IsActive
            };
        }

        

        public static VideoDto ToDto(this Video video)
        {
            return new VideoDto
            {
                Id = video.Id,
                Title = video.Title,
                Description = video.Description,
                VideoPath = video.VideoPath,
                ThumbnailPath = video.ThumbnailPath,
                VideoCategoryId = video.VideoCategoryId,
            };
        }

        public static VideoCategoryDto ToDto(this VideoCategory videoCategory)
        {
            return new VideoCategoryDto
            {
                Id = videoCategory.Id,
                Name = videoCategory.Name,
                Description = videoCategory.Description,
                DisplayOrder = videoCategory.DisplayOrder
            };
        }

        public static VideoPublicDto ToPublicDto(this Video video)
        {
            return new VideoPublicDto
            {
                Id = video.Id,
                Title = video.Title,
                Description = video.Description,
                VideoPath = video.VideoPath,
                ThumbnailPath = video.ThumbnailPath,
                VideoCategoryId = video.VideoCategoryId
            };
        }

        public static VideoAdminDto ToAdminDto(this Video video)
        {
            return new VideoAdminDto
            {
                Id = video.Id,
                Title = video.Title,
                Description = video.Description,
                VideoPath = video.VideoPath,
                ThumbnailPath = video.ThumbnailPath,
                VideoCategoryId = video.VideoCategoryId,
                VideoCategoryName = video.VideoCategory?.Name,
                DisplayOrder = video.DisplayOrder,
                IsActive = video.IsActive
            };
        }

        public static VideoCategoryPublicDto ToPublicDto(this VideoCategory videoCategory)
        {
            return new VideoCategoryPublicDto
            {
                Id = videoCategory.Id,
                Name = videoCategory.Name,
                Description = videoCategory.Description,
                DisplayOrder = videoCategory.DisplayOrder,
                Videos = videoCategory.Videos.Select(v => v.ToPublicDto()).ToList()
            };
        }
    }
}
