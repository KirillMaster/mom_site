using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MomSite.Core.Models;
using MomSite.Infrastructure.Data;
using MomSite.Infrastructure.Services;
using MomSite.API.DTOs; // Добавлено

namespace MomSite.API.Controllers;

[ApiController]
[Route("api/admin/[controller]")]
[Authorize]
public class ArtworksController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IImageService _imageService;

    public ArtworksController(ApplicationDbContext context, IImageService imageService)
    {
        _context = context;
        _imageService = imageService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ArtworkAdminDto>>> GetArtworks([FromQuery] int? categoryId = null) // Изменен возвращаемый тип
    {
        var query = _context.Artworks
            .Include(a => a.Category) // Включено обратно
            .AsQueryable();

        if (categoryId.HasValue)
        {
            query = query.Where(a => a.CategoryId == categoryId.Value);
        }

        var artworks = await query
            .OrderByDescending(a => a.CreatedAt)
            .Select(a => new ArtworkAdminDto // Проекция в ArtworkAdminDto
            {
                Id = a.Id,
                Title = a.Title,
                Description = a.Description,
                ImagePath = a.ImagePath,
                ThumbnailPath = a.ThumbnailPath,
                Price = a.Price,
                IsForSale = a.IsForSale,
                CreatedAt = a.CreatedAt,
                UpdatedAt = a.UpdatedAt,
                CategoryId = a.CategoryId,
                Category = new CategoryDto
                {
                    Id = a.Category.Id,
                    Name = a.Category.Name,
                    Description = a.Category.Description,
                    DisplayOrder = a.Category.DisplayOrder
                }
            })
            .ToListAsync();

        // Добавляем логирование здесь, чтобы увидеть данные перед отправкой
        foreach (var artwork in artworks)
        {
            Console.WriteLine($"Artwork ID: {artwork.Id}, Title: {artwork.Title}, Description: {artwork.Description}, ImagePath: {artwork.ImagePath}");
        }
        Console.WriteLine($"Returning {artworks.Count} artworks from GetArtworks. First artwork title: {artworks.FirstOrDefault()?.Title}");

        return Ok(artworks);
    }

    [HttpGet("{id}")] // Оставляем только GET для получения по ID
    public async Task<ActionResult<Artwork>> GetArtwork(int id)
    {
        var artwork = await _context.Artworks
            .Include(a => a.Category)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (artwork == null)
        {
            return NotFound();
        }

        return Ok(artwork);
    }

    [HttpPost("create")] // Изменено: добавлен явный маршрут "create"
    public async Task<ActionResult<Artwork>> CreateArtwork([FromForm] CreateArtworkDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        Console.WriteLine($"CreateArtwork: Title={dto.Title}, Description={dto.Description}, ImageFileName={dto.Image?.FileName}");

        // Save original image
        var imagePath = await _imageService.SaveImageAsync(dto.Image!, "artworks");
        
        // Create thumbnail
        var thumbnailPath = await _imageService.CreateThumbnailAsync(imagePath, 300, 300);
        
        // Add watermark to original
        var watermarkedPath = await _imageService.AddWatermarkAsync(imagePath, _imageService.GetWatermarkText());

        var artwork = new Artwork
        {
            Title = dto.Title,
            Description = dto.Description,
            ImagePath = watermarkedPath,
            ThumbnailPath = thumbnailPath,
            Price = dto.Price,
            IsForSale = dto.IsForSale,
            CategoryId = dto.CategoryId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Artworks.Add(artwork);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetArtwork), new { id = artwork.Id }, artwork);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateArtwork(int id, [FromForm] UpdateArtworkDto dto)
    {
        var artwork = await _context.Artworks.FindAsync(id);
        if (artwork == null)
        {
            return NotFound();
        }

        Console.WriteLine($"UpdateArtwork: Id={id}, Title={dto.Title}, Description={dto.Description}, ImageFileName={dto.Image?.FileName}");

        artwork.Title = dto.Title;
        artwork.Description = dto.Description;
        artwork.Price = dto.Price;
        artwork.IsForSale = dto.IsForSale;
        artwork.CategoryId = dto.CategoryId;
        artwork.UpdatedAt = DateTime.UtcNow;

        if (dto.Image != null)
        {
            // Delete old images
            _imageService.DeleteImage(artwork.ImagePath);
            _imageService.DeleteImage(artwork.ThumbnailPath);

            // Save new image
            var imagePath = await _imageService.SaveImageAsync(dto.Image, "artworks");
            var thumbnailPath = await _imageService.CreateThumbnailAsync(imagePath, 300, 300);
            var watermarkedPath = await _imageService.AddWatermarkAsync(imagePath, _imageService.GetWatermarkText());

            artwork.ImagePath = watermarkedPath;
            artwork.ThumbnailPath = thumbnailPath;
        }

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteArtwork(int id)
    {
        var artwork = await _context.Artworks.FindAsync(id);
        if (artwork == null)
        {
            return NotFound();
        }

        _imageService.DeleteImage(artwork.ImagePath);
        _imageService.DeleteImage(artwork.ThumbnailPath);

        _context.Artworks.Remove(artwork);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}

public class CreateArtworkDto
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public IFormFile Image { get; set; } = null!;
    public decimal? Price { get; set; }
    public bool IsForSale { get; set; } = true;
    public int CategoryId { get; set; }
}

public class UpdateArtworkDto
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public IFormFile? Image { get; set; }
    public decimal? Price { get; set; }
    public bool IsForSale { get; set; } = true;
    public int CategoryId { get; set; }
} 