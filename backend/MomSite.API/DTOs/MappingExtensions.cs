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
                IsActive = category.IsActive,
                ShowOnHome = category.ShowOnHome
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

        public static ContactMessageAdminDto ToAdminDto(this ContactMessage message)
        {
            return new ContactMessageAdminDto
            {
                Id = message.Id,
                Name = message.Name,
                Email = message.Email,
                Subject = message.Subject,
                Message = message.Message,
                IpAddress = message.IpAddress,
                UserAgent = message.UserAgent,
                UtmSource = message.UtmSource,
                UtmMedium = message.UtmMedium,
                UtmCampaign = message.UtmCampaign,
                CreatedAt = message.CreatedAt,
                Status = message.Status.ToString()
            };
        }

        public static ReviewAdminDto ToAdminDto(this Review review)
        {
            return new ReviewAdminDto
            {
                Id = review.Id,
                AuthorName = review.AuthorName,
                AuthorCity = review.AuthorCity,
                Text = review.Text,
                Rating = review.Rating,
                CreatedAt = review.CreatedAt,
                IsPublished = review.IsPublished,
                PublishedAt = review.PublishedAt,
                SortOrder = review.SortOrder,
                ArtworkId = review.ArtworkId,
                PhotoPath = review.PhotoPath
            };
        }

        public static ReviewDto ToDto(this Review review)
        {
            return new ReviewDto
            {
                Id = review.Id,
                AuthorName = review.AuthorName,
                AuthorCity = review.AuthorCity,
                Text = review.Text,
                Rating = review.Rating,
                CreatedAt = review.CreatedAt,
                SortOrder = review.SortOrder,
                ArtworkId = review.ArtworkId,
                PhotoPath = review.PhotoPath
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
