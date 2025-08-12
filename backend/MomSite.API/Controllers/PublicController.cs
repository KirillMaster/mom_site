using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MomSite.Core.Models;
using MomSite.Infrastructure.Data;
using MomSite.API.Services;
using MomSite.API.DTOs; // Добавлено

namespace MomSite.API.Controllers;

[ApiController]
[Route("api/[controller]")] // Возвращаем стандартный маршрут контроллера
public class PublicController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IEmailService _emailService;

    public PublicController(ApplicationDbContext context, IEmailService emailService)
    {
        _context = context;
        _emailService = emailService;
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

        var artworks = await _context.Artworks
            .Include(a => a.Category) // Include category for display
            .OrderByDescending(a => a.CreatedAt) // Latest first
            .Take(9) // Limit to 9 artworks for the carousel
            .ToListAsync();

        var biographyText = await _context.PageContents
            .Where(pc => pc.PageKey == "home" && pc.ContentKey == "home_biography_text" && pc.IsActive)
            .FirstOrDefaultAsync();

        var authorPhoto = await _context.PageContents
            .Where(pc => pc.PageKey == "home" && pc.ContentKey == "home_author_photo" && pc.IsActive)
            .FirstOrDefaultAsync();

        var contactsData = new ContactsData();

        // Get contact info from contacts page
        var contactsContent = await _context.PageContents
            .Where(pc => pc.PageKey == "contacts" && pc.IsActive)
            .OrderBy(pc => pc.DisplayOrder)
            .ToListAsync();

        foreach (var contact in contactsContent)
        {
            switch (contact.ContentKey)
            {
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

        // Get social links from social page
        var socialContent = await _context.PageContents
            .Where(pc => pc.PageKey == "social" && pc.IsActive)
            .OrderBy(pc => pc.DisplayOrder)
            .ToListAsync();

        foreach (var social in socialContent)
        {
            switch (social.ContentKey)
            {
                case "instagram":
                    contactsData.SocialLinks.Instagram = social.LinkUrl;
                    break;
                case "vk":
                    contactsData.SocialLinks.Vk = social.LinkUrl;
                    break;
                case "telegram":
                    contactsData.SocialLinks.Telegram = social.LinkUrl;
                    break;
                case "whatsapp":
                    contactsData.SocialLinks.Whatsapp = social.LinkUrl;
                    break;
                case "youtube":
                    contactsData.SocialLinks.Youtube = social.LinkUrl;
                    break;
            }
        }

        return Ok(new HomeData
        {
            WelcomeMessage = welcomeMessage?.TextContent ?? "Добро пожаловать в мир искусства!",
            BannerImage = bannerImage?.ImagePath ?? "/images/banner-default.jpg",
            BiographyText = biographyText?.TextContent ?? "Информация о художнике",
            AuthorPhoto = authorPhoto?.ImagePath ?? "/images/artist-default.jpg",
            Artworks = artworks.Select(a => a.ToDto()).ToList(),
            Contacts = contactsData // Assign the populated contactsData
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

        // Get banner content for gallery
        var bannerTitle = await _context.PageContents
            .Where(pc => pc.PageKey == "gallery" && pc.ContentKey == "banner_title" && pc.IsActive)
            .FirstOrDefaultAsync();

        var bannerDescription = await _context.PageContents
            .Where(pc => pc.PageKey == "gallery" && pc.ContentKey == "banner_description" && pc.IsActive)
            .FirstOrDefaultAsync();

        return Ok(new GalleryData
        {
            Artworks = artworks.Select(a => a.ToDto()).ToList(),
            Categories = categories.Select(c => c.ToDto()).ToList(),
            BannerTitle = bannerTitle?.TextContent ?? "Галерея работ",
            BannerDescription = bannerDescription?.TextContent ?? "Исследуйте коллекцию уникальных работ в стиле импрессионизма. Каждая картина создана с любовью и передает особую атмосферу."
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

        var additionalBiography = await _context.PageContents
            .Where(pc => pc.PageKey == "about" && pc.ContentKey == "additional_biography" && pc.IsActive)
            .FirstOrDefaultAsync();

        var philosophy = await _context.PageContents
            .Where(pc => pc.PageKey == "about" && pc.ContentKey == "philosophy" && pc.IsActive)
            .FirstOrDefaultAsync();

        // Get banner content for about page
        var bannerTitle = await _context.PageContents
            .Where(pc => pc.PageKey == "about" && pc.ContentKey == "banner_title" && pc.IsActive)
            .FirstOrDefaultAsync();

        var bannerDescription = await _context.PageContents
            .Where(pc => pc.PageKey == "about" && pc.ContentKey == "banner_description" && pc.IsActive)
            .FirstOrDefaultAsync();

        return Ok(new AboutData
        {
            Biography = biography?.TextContent ?? "Информация о художнике",
            ArtistPhoto = artistPhoto?.ImagePath ?? "/images/artist-default.jpg",
            AdditionalBiography = additionalBiography?.TextContent ?? "Мое творчество основано на глубоком понимании классических техник живописи, которые я сочетаю с современным видением и индивидуальным подходом к каждому произведению. Каждая картина - это история, эмоция, момент времени, запечатленный на холсте.",
            Philosophy = philosophy?.TextContent ?? "Искусство - это способ передать красоту мира через призму собственного восприятия. Каждый мазок кисти - это эмоция, каждый цвет - это настроение, а каждая картина - это история, которую я хочу рассказать зрителю.",
            BannerTitle = bannerTitle?.TextContent ?? "Обо мне",
            BannerDescription = bannerDescription?.TextContent ?? "Познакомьтесь с художником и узнайте больше о моем творческом пути"
        });
    }

    [HttpGet("contacts")]
    public async Task<ActionResult<ContactsData>> GetContactsData()
    {
        var contactsData = new ContactsData();

        // Get contacts page content
        var contactsContent = await _context.PageContents
            .Where(pc => pc.PageKey == "contacts" && pc.IsActive)
            .OrderBy(pc => pc.DisplayOrder)
            .ToListAsync();

        foreach (var contact in contactsContent)
        {
            switch (contact.ContentKey)
            {
                case "phone":
                    contactsData.Phone = contact.TextContent;
                    break;
                case "email":
                    contactsData.Email = contact.TextContent;
                    break;
                case "address":
                    contactsData.Address = contact.TextContent;
                    break;
            }
        }

        // Get social links from social page
        var socialContent = await _context.PageContents
            .Where(pc => pc.PageKey == "social" && pc.IsActive)
            .OrderBy(pc => pc.DisplayOrder)
            .ToListAsync();

        foreach (var social in socialContent)
        {
            switch (social.ContentKey)
            {
                case "instagram":
                    contactsData.SocialLinks.Instagram = social.LinkUrl;
                    break;
                case "vk":
                    contactsData.SocialLinks.Vk = social.LinkUrl;
                    break;
                case "telegram":
                    contactsData.SocialLinks.Telegram = social.LinkUrl;
                    break;
                case "whatsapp":
                    contactsData.SocialLinks.Whatsapp = social.LinkUrl;
                    break;
                case "youtube":
                    contactsData.SocialLinks.Youtube = social.LinkUrl;
                    break;
            }
        }

        // Get banner content for contacts page
        var bannerTitle = await _context.PageContents
            .Where(pc => pc.PageKey == "contacts" && pc.ContentKey == "banner_title" && pc.IsActive)
            .FirstOrDefaultAsync();

        var bannerDescription = await _context.PageContents
            .Where(pc => pc.PageKey == "contacts" && pc.ContentKey == "banner_description" && pc.IsActive)
            .FirstOrDefaultAsync();

        contactsData.BannerTitle = bannerTitle?.TextContent ?? "Свяжитесь со мной";
        contactsData.BannerDescription = bannerDescription?.TextContent ?? "Буду рада ответить на ваши вопросы и обсудить идеи!";

        // Get FAQ items
        var faqItems = new List<FAQItem>();
        for (int i = 1; i <= 4; i++)
        {
            var question = await _context.PageContents
                .Where(pc => pc.PageKey == "contacts" && pc.ContentKey == $"faq_question_{i}" && pc.IsActive)
                .FirstOrDefaultAsync();

            var answer = await _context.PageContents
                .Where(pc => pc.PageKey == "contacts" && pc.ContentKey == $"faq_answer_{i}" && pc.IsActive)
                .FirstOrDefaultAsync();

            if (question?.TextContent != null && answer?.TextContent != null)
            {
                faqItems.Add(new FAQItem
                {
                    Question = question.TextContent,
                    Answer = answer.TextContent
                });
            }
        }

        contactsData.FAQ = faqItems;

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

    [HttpGet("footer")]
    public async Task<ActionResult<FooterData>> GetFooterData()
    {
        var footerData = new FooterData();

        // Get footer description
        var footerContent = await _context.PageContents
            .Where(pc => pc.PageKey == "footer" && pc.IsActive)
            .OrderBy(pc => pc.DisplayOrder)
            .ToListAsync();

        foreach (var content in footerContent)
        {
            switch (content.ContentKey)
            {
                case "description":
                    footerData.Description = content.TextContent;
                    break;
            }
        }

        // Get contact info from contacts page
        var contactsContent = await _context.PageContents
            .Where(pc => pc.PageKey == "contacts" && pc.IsActive)
            .OrderBy(pc => pc.DisplayOrder)
            .ToListAsync();

        foreach (var contact in contactsContent)
        {
            switch (contact.ContentKey)
            {
                case "email":
                    footerData.Email = contact.TextContent;
                    break;
                case "phone":
                    footerData.Phone = contact.TextContent;
                    break;
            }
        }

        // Get social links from social page
        var socialContent = await _context.PageContents
            .Where(pc => pc.PageKey == "social" && pc.IsActive)
            .OrderBy(pc => pc.DisplayOrder)
            .ToListAsync();

        foreach (var social in socialContent)
        {
            switch (social.ContentKey)
            {
                case "instagram":
                    footerData.SocialLinks.Instagram = social.LinkUrl;
                    break;
                case "vk":
                    footerData.SocialLinks.Vk = social.LinkUrl;
                    break;
                case "telegram":
                    footerData.SocialLinks.Telegram = social.LinkUrl;
                    break;
                case "whatsapp":
                    footerData.SocialLinks.Whatsapp = social.LinkUrl;
                    break;
                case "youtube":
                    footerData.SocialLinks.Youtube = social.LinkUrl;
                    break;
            }
        }

        return Ok(footerData);
    }

    [HttpPost("contact-message")]
    public async Task<IActionResult> SendContactMessage([FromBody] ContactMessageDto message)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var success = await _emailService.SendContactMessageAsync(message);
        
        if (success)
        {
            return Ok(new { message = "Сообщение успешно отправлено!" });
        }
        else
        {
            return StatusCode(500, new { message = "Ошибка при отправке сообщения. Попробуйте позже." });
        }
    }

    [HttpGet("health")]
    public IActionResult HealthCheck()
    {
        return Ok();
    }
}