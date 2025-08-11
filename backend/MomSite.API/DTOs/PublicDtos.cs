using System.Collections.Generic;
using MomSite.Core.Models;

namespace MomSite.API.DTOs
{
    public class HomeData
    {
        public string WelcomeMessage { get; set; } = string.Empty;
        public string BannerImage { get; set; } = string.Empty;
        public string BiographyText { get; set; } = string.Empty;
        public string AuthorPhoto { get; set; } = string.Empty;
        public List<ArtworkDto> Artworks { get; set; } = new();
        public ContactsData Contacts { get; set; } = new ContactsData();
        
    }

    public class GalleryData
    {
        public List<ArtworkDto> Artworks { get; set; } = new(); // Изменено на ArtworkDto
        public List<CategoryDto> Categories { get; set; } = new(); // Изменено на CategoryDto
        public string BannerTitle { get; set; } = string.Empty;
        public string BannerDescription { get; set; } = string.Empty;
    }

    public class AboutData
    {
        public string Biography { get; set; } = string.Empty;
        public string ArtistPhoto { get; set; } = string.Empty;
        public string BannerTitle { get; set; } = string.Empty;
        public string BannerDescription { get; set; } = string.Empty;
    }

    public class ContactsData
    {
        public SocialLinks SocialLinks { get; set; } = new SocialLinks();
        public string? Email { get; set; }
        public string? Phone { get; set; }
        public string? Address { get; set; }
        public string BannerTitle { get; set; } = string.Empty;
        public string BannerDescription { get; set; } = string.Empty;
    }

    public class SocialLinks
    {
        public string? Instagram { get; set; }
        public string? Vk { get; set; }
        public string? Telegram { get; set; }
        public string? Whatsapp { get; set; }
        public string? Youtube { get; set; }
    }

    public class VideosData
    {
        public List<VideoPublicDto> Videos { get; set; } = new();
        public List<VideoCategoryPublicDto> Categories { get; set; } = new();
    }

    public class VideoPublicDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string VideoPath { get; set; } = string.Empty;
        public string? ThumbnailPath { get; set; }
        public int VideoCategoryId { get; set; }
    }

    public class VideoCategoryPublicDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int DisplayOrder { get; set; }
        public List<VideoPublicDto> Videos { get; set; } = new();
    }

    public class FooterData
    {
        public string Description { get; set; } = string.Empty;
        public SocialLinks SocialLinks { get; set; } = new SocialLinks();
        public string? Email { get; set; }
        public string? Phone { get; set; }
    }

    public class Specialty
    {
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
    }
}