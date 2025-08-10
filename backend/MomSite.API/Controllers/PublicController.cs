using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MomSite.Core.Models;
using MomSite.Infrastructure.Data;
using MomSite.API.DTOs; // Добавлено

namespace MomSite.API.Controllers;

[ApiController]
[Route("api/[controller]")] // Возвращаем стандартный маршрут контроллера
public class PublicController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public PublicController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet("home")] // Явный маршрут для главной страницы
    public async Task<ActionResult<HomeData>> GetHomeData()
    {
        var welcomeMessage = await _context.PageContents
            .Where(pc => pc.PageKey == "home" && pc.ContentKey == "welcome_message" && pc.IsActive)
            .FirstOrDefaultAsync();

        var bannerImage = await _context.PageContents
            .Where(pc => pc.PageKey == "home" && pc.ContentKey == "banner_image" && pc.IsActive)
            .FirstOrDefaultAsync();

        

        return Ok(new HomeData
        {
            WelcomeMessage = welcomeMessage?.TextContent ?? "Добро пожаловать в мир искусства!",
            BannerImage = bannerImage?.ImagePath ?? "/images/banner-default.jpg"
        });
    }

    [HttpGet("gallery")] // Явный маршрут для галереи
    public async Task<ActionResult<GalleryData>> GetGalleryData([FromQuery] int? categoryId = null)
    {
        var query = _context.Artworks
            .AsQueryable();

        if (categoryId.HasValue)
        {
            query = query.Where(a => a.CategoryId == categoryId.Value);
        }

        var artworks = await query
            .Include(a => a.Category)
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync();

        var categories = await _context.Categories
            .Where(c => c.IsActive)
            .OrderBy(c => c.DisplayOrder)
            .ToListAsync();

        return Ok(new GalleryData
        {
            Artworks = artworks.Select(a => a.ToDto()).ToList(),
            Categories = categories.Select(c => c.ToDto()).ToList()
        });
    }

    [HttpGet("about")] // Явный маршрут для страницы "Обо мне"
    public async Task<ActionResult<AboutData>> GetAboutData()
    {
        var biography = await _context.PageContents
            .Where(pc => pc.PageKey == "about" && pc.ContentKey == "biography" && pc.IsActive)
            .FirstOrDefaultAsync();

        var artistPhoto = await _context.PageContents
            .Where(pc => pc.PageKey == "about" && pc.ContentKey == "artist_photo" && pc.IsActive)
            .FirstOrDefaultAsync();

        var specialties = await _context.PageContents
            .Where(pc => pc.PageKey == "about" && pc.ContentKey == "specialty" && pc.IsActive)
            .OrderBy(pc => pc.DisplayOrder)
            .Select(pc => new Specialty { Title = pc.TextContent ?? "", Description = pc.LinkUrl ?? "" })
            .ToListAsync();

        return Ok(new AboutData
        {
            Biography = biography?.TextContent ?? "Информация о художнике",
            ArtistPhoto = artistPhoto?.ImagePath ?? "/images/artist-default.jpg",
            Specialties = specialties
        });
    }

    [HttpGet("contacts")] // Явный маршрут для страницы "Контакты"
    public async Task<ActionResult<ContactsData>> GetContactsData()
    {
        var contacts = await _context.PageContents
            .Where(pc => pc.PageKey == "contacts" && pc.IsActive)
            .OrderBy(pc => pc.DisplayOrder)
            .ToListAsync();

        var contactsData = new ContactsData();

        foreach (var contact in contacts)
        {
            switch (contact.ContentKey)
            {
                case "instagram":
                    contactsData.SocialLinks.Instagram = contact.LinkUrl;
                    break;
                case "vk":
                    contactsData.SocialLinks.Vk = contact.LinkUrl;
                    break;
                case "telegram":
                    contactsData.SocialLinks.Telegram = contact.LinkUrl;
                    break;
                case "whatsapp":
                    contactsData.SocialLinks.Whatsapp = contact.LinkUrl;
                    break;
                case "youtube":
                    contactsData.SocialLinks.Youtube = contact.LinkUrl;
                    break;
                case "email":
                    contactsData.Email = contact.TextContent;
                    break;
                case "phone":
                    contactsData.Phone = contact.TextContent;
                    break;
                case "address":
                    contactsData.Address = contact.TextContent;
                    break;
            }
        }

        return Ok(contactsData);
    }

    [HttpGet("videos")] // Явный маршрут для страницы "Видео"
    public async Task<ActionResult<VideosData>> GetVideosData([FromQuery] int? categoryId = null)
    {
        var query = _context.Videos
            .Include(v => v.VideoCategory)
            .Where(v => v.IsActive);

        if (categoryId.HasValue)
        {
            query = query.Where(v => v.VideoCategoryId == categoryId.Value);
        }

        var videos = await query
            .OrderBy(v => v.VideoCategory.DisplayOrder)
            .ThenBy(v => v.DisplayOrder)
            .ToListAsync();

        var categories = await _context.VideoCategories
            .Where(vc => vc.IsActive)
            .OrderBy(vc => vc.DisplayOrder)
            .ToListAsync();

        return Ok(new VideosData
        {
            Videos = videos.Select(v => v.ToPublicDto()).ToList(),
            Categories = categories.Select(c => c.ToPublicDto()).ToList()
        });
    }

    [HttpGet("health")]
    public IActionResult HealthCheck()
    {
        return Ok();
    }
}