using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using MomSite.API.DTOs; // Added
using MomSite.Core.Models;
using MomSite.Infrastructure.Data;
using MomSite.Infrastructure.Services;
using Microsoft.AspNetCore.Http.Features;

namespace MomSite.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AdminController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IImageService _imageService;
    private readonly IConfiguration _configuration;

    public AdminController(ApplicationDbContext context, IImageService imageService, IConfiguration configuration)
    {
        _context = context;
        _imageService = imageService;
        _configuration = configuration;
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public Task<ActionResult<string>> Login([FromBody] LoginDto loginDto)
    {
        var adminPassword = _configuration["AdminPassword"] ?? "admin";
        
        if (loginDto.Username == "admin" && loginDto.Password == adminPassword)
        {
            var token = GenerateJwtToken();
            return Task.FromResult<ActionResult<string>>(Ok(new { token }));
        }

        return Task.FromResult<ActionResult<string>>(Unauthorized());
    }

    [HttpGet("categories")]
    public async Task<ActionResult<IEnumerable<Category>>> GetCategories()
    {
        var categories = await _context.Categories
            .OrderBy(c => c.DisplayOrder)
            .ToListAsync();
        return Ok(categories);
    }

    [HttpPost("categories")]
    public async Task<ActionResult<Category>> CreateCategory([FromBody] CreateCategoryDto dto)
    {
        var category = new Category
        {
            Name = dto.Name,
            Description = dto.Description,
            DisplayOrder = dto.DisplayOrder,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Categories.Add(category);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetCategories), new { id = category.Id }, category);
    }

    [HttpPut("categories/{id}")]
    public async Task<IActionResult> UpdateCategory(int id, [FromBody] UpdateCategoryDto dto)
    {
        var category = await _context.Categories.FindAsync(id);
        if (category == null)
        {
            return NotFound();
        }

        category.Name = dto.Name;
        category.Description = dto.Description;
        category.DisplayOrder = dto.DisplayOrder;
        category.IsActive = dto.IsActive;
        category.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    

    

    

    [HttpGet("page-content-by-key")]
    public async Task<ActionResult<IEnumerable<PageContent>>> GetPageContent([FromQuery] string? pageKey = null)
    {
        var query = _context.PageContents.AsQueryable();
        
        if (!string.IsNullOrEmpty(pageKey))
        {
            query = query.Where(pc => pc.PageKey == pageKey);
        }

        var content = await query
            .OrderBy(pc => pc.PageKey)
            .ThenBy(pc => pc.DisplayOrder)
            .ToListAsync();

        return Ok(content);
    }

        [HttpPut("page-content/{id}")]
    [RequestFormLimits(MultipartBodyLengthLimit = 104857600)] // 100MB
    public async Task<IActionResult> UpdatePageContent(int id, [FromForm] UpdatePageContentDto dto)
    {
        var content = await _context.PageContents.FindAsync(id);
        if (content == null)
        {
            return NotFound();
        }

        content.TextContent = dto.TextContent;
        content.LinkUrl = dto.LinkUrl;
        content.DisplayOrder = dto.DisplayOrder;
        content.IsActive = dto.IsActive;
        content.UpdatedAt = DateTime.UtcNow;

        if (dto.Image != null)
        {
            _imageService.DeleteImage(content.ImagePath ?? "");
            content.ImagePath = await _imageService.SaveImageAsync(dto.Image, "page-content");
        }

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("page-content")]
    [RequestFormLimits(MultipartBodyLengthLimit = 104857600)] // 100MB
    public async Task<ActionResult<PageContent>> CreatePageContent([FromForm] CreatePageContentDto dto)
    {
        var pageContent = new PageContent
        {
            PageKey = dto.PageKey,
            ContentKey = dto.ContentKey,
            TextContent = dto.TextContent,
            LinkUrl = dto.LinkUrl,
            DisplayOrder = dto.DisplayOrder,
            IsActive = dto.IsActive,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        if (dto.Image != null)
        {
            pageContent.ImagePath = await _imageService.SaveImageAsync(dto.Image, "page-content");
        }

        _context.PageContents.Add(pageContent);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetPageContent), new { pageKey = pageContent.PageKey }, pageContent);
    }

    [HttpGet("videos")]
    public async Task<ActionResult<IEnumerable<VideoAdminDto>>> GetVideos()
    {
        var videos = await _context.Videos
            .Include(v => v.VideoCategory)
            .OrderBy(v => v.VideoCategory.DisplayOrder)
            .ThenBy(v => v.DisplayOrder)
            .ToListAsync();
        return Ok(videos.Select(v => v.ToAdminDto()));
    }

    [HttpPost("videos")]
    [RequestFormLimits(MultipartBodyLengthLimit = 104857600)] // 100MB
    public async Task<ActionResult<Video>> CreateVideo([FromForm] CreateVideoDto dto)
    {
        var video = new Video
        {
            Title = dto.Title,
            Description = dto.Description,
            VideoPath = await _imageService.SaveImageAsync(dto.VideoFile, "videos"), // Save video file
            VideoCategoryId = dto.VideoCategoryId,
            DisplayOrder = dto.DisplayOrder,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        if (dto.Thumbnail != null)
        {
            video.ThumbnailPath = await _imageService.SaveImageAsync(dto.Thumbnail, "videos");
        }
        else
        {
            // Generate thumbnail from video if not provided
            video.ThumbnailPath = await _imageService.CreateVideoThumbnailAsync(video.VideoPath, 320, 180); // Adjust dimensions as needed
        }

        _context.Videos.Add(video);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetVideos), new { id = video.Id }, video);
    }

    [HttpPut("videos/{id}")]
    [RequestFormLimits(MultipartBodyLengthLimit = 104857600)] // 100MB
    public async Task<IActionResult> UpdateVideo(int id, [FromForm] UpdateVideoDto dto)
    {
        var video = await _context.Videos.FindAsync(id);
        if (video == null)
        {
            return NotFound();
        }

        video.Title = dto.Title ?? video.Title;
        video.Description = dto.Description ?? video.Description;
        video.VideoCategoryId = dto.VideoCategoryId ?? video.VideoCategoryId;
        video.DisplayOrder = dto.DisplayOrder ?? video.DisplayOrder;
        video.IsActive = dto.IsActive ?? video.IsActive;
        video.UpdatedAt = DateTime.UtcNow;

        if (dto.VideoFile != null)
        {
            _imageService.DeleteImage(video.VideoPath);
            video.VideoPath = await _imageService.SaveImageAsync(dto.VideoFile, "videos");
            // If video file is updated, regenerate thumbnail
            video.ThumbnailPath = await _imageService.CreateVideoThumbnailAsync(video.VideoPath, 320, 180); // Adjust dimensions as needed
        }

        if (dto.Thumbnail != null)
        {
            _imageService.DeleteImage(video.ThumbnailPath ?? "");
            video.ThumbnailPath = await _imageService.SaveImageAsync(dto.Thumbnail, "videos");
        }

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("videos/{id}")]
    public async Task<IActionResult> DeleteVideo(int id)
    {
        var video = await _context.Videos.FindAsync(id);
        if (video == null)
        {
            return NotFound();
        }

        _imageService.DeleteImage(video.VideoPath);
        _imageService.DeleteImage(video.ThumbnailPath ?? "");
        _context.Videos.Remove(video);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpGet("video-categories")]
    public async Task<ActionResult<IEnumerable<VideoCategory>>> GetVideoCategories()
    {
        var categories = await _context.VideoCategories
            .OrderBy(vc => vc.DisplayOrder)
            .ToListAsync();
        return Ok(categories);
    }

    [HttpPost("video-categories")]
    public async Task<ActionResult<VideoCategory>> CreateVideoCategory([FromBody] CreateVideoCategoryDto dto)
    {
        var category = new VideoCategory
        {
            Name = dto.Name,
            Description = dto.Description,
            DisplayOrder = dto.DisplayOrder,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.VideoCategories.Add(category);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetVideoCategories), new { id = category.Id }, category);
    }

    [HttpPut("video-categories/{id}")]
    public async Task<IActionResult> UpdateVideoCategory(int id, [FromBody] UpdateVideoCategoryDto dto)
    {
        var category = await _context.VideoCategories.FindAsync(id);
        if (category == null)
        {
            return NotFound();
        }

        category.Name = dto.Name ?? category.Name;
        category.Description = dto.Description ?? category.Description;
        category.DisplayOrder = dto.DisplayOrder ?? category.DisplayOrder;
        category.IsActive = dto.IsActive ?? category.IsActive;
        category.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("video-categories/{id}")]
    public async Task<IActionResult> DeleteVideoCategory(int id)
    {
        var category = await _context.VideoCategories.FindAsync(id);
        if (category == null)
        {
            return NotFound();
        }

        _context.VideoCategories.Remove(category);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpDelete("categories/{id}")]
    public async Task<IActionResult> DeleteCategory(int id)
    {
        var category = await _context.Categories.FindAsync(id);
        if (category == null)
        {
            return NotFound();
        }

        _context.Categories.Remove(category);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private string GenerateJwtToken()
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["JWT:Secret"] ?? "default-secret"));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.Name, "admin"),
            new Claim(ClaimTypes.Role, "Admin")
        };

        var token = new JwtSecurityToken(
            issuer: _configuration["JWT:Issuer"],
            audience: _configuration["JWT:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(24),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}

public class LoginDto
{
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class CreateCategoryDto
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int DisplayOrder { get; set; } = 0;
}

public class UpdateCategoryDto
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int DisplayOrder { get; set; } = 0;
    public bool IsActive { get; set; } = true;
}





public class UpdatePageContentDto
{
    public string? TextContent { get; set; }
    public string? LinkUrl { get; set; }
    public int DisplayOrder { get; set; } = 0;
    public bool IsActive { get; set; } = true;
    public IFormFile? Image { get; set; }
}

public class CreateVideoDto
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public IFormFile VideoFile { get; set; } = null!;
    public int VideoCategoryId { get; set; }
    public int DisplayOrder { get; set; } = 0;
    public IFormFile? Thumbnail { get; set; }
}

public class UpdateVideoDto
{
    public string? Title { get; set; }
    public string? Description { get; set; }
    public IFormFile? VideoFile { get; set; }
    public int? VideoCategoryId { get; set; }
    public int? DisplayOrder { get; set; }
    public bool? IsActive { get; set; }
    public IFormFile? Thumbnail { get; set; }
}

public class CreateVideoCategoryDto
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int DisplayOrder { get; set; } = 0;
}

public class UpdateVideoCategoryDto
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public int? DisplayOrder { get; set; }
    public bool? IsActive { get; set; }
}

public class CreatePageContentDto
{
    public string PageKey { get; set; } = string.Empty;
    public string ContentKey { get; set; } = string.Empty;
    public string? TextContent { get; set; }
    public string? LinkUrl { get; set; }
    public int DisplayOrder { get; set; } = 0;
    public bool IsActive { get; set; } = true;
    public IFormFile? Image { get; set; }
}