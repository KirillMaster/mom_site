using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MomSite.Core.Models;
using MomSite.Infrastructure.Data;
using MomSite.Infrastructure.Services;
using MomSite.API.DTOs;

namespace MomSite.API.Controllers;

[ApiController]
[Route("api/admin/[controller]")]
[Authorize]
public class ArtworksController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IArtworkImageService _artworkImages;

    public ArtworksController(ApplicationDbContext context, IArtworkImageService artworkImages)
    {
        _context = context;
        _artworkImages = artworkImages;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ArtworkAdminDto>>> GetArtworks([FromQuery] int? categoryId = null) // Изменен возвращаемый тип
    {
        var query = _context.Artworks
            .Include(a => a.Category) // Включено обратно
            .Include(a => a.Images)
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
                Status = a.Status,
                WidthCm = a.WidthCm,
                HeightCm = a.HeightCm,
                Year = a.Year,
                Support = a.Support,
                Technique = a.Technique,
                ShortDescription = a.ShortDescription,
                IsFeatured = a.IsFeatured,
                NeedsReshoot = a.NeedsReshoot,
                IsPublished = a.IsPublished,
                CreatedAt = a.CreatedAt,
                UpdatedAt = a.UpdatedAt,
                CategoryId = a.CategoryId,
                Images = a.Images.OrderBy(i => i.SortOrder).Select(i => new ArtworkImageDto
                {
                    Id = i.Id,
                    ImagePath = i.ImagePath,
                    ThumbnailPath = i.ThumbnailPath,
                    SortOrder = i.SortOrder
                }).ToList(),
                Category = new CategoryDto
                {
                    Id = a.Category.Id,
                    Name = a.Category.Name,
                    Description = a.Category.Description,
                    DisplayOrder = a.Category.DisplayOrder
                }
            })
            .ToListAsync();

        foreach (var artwork in artworks.Where(a => a.Images.Count == 0))
        {
            artwork.Images = MappingExtensions.FallbackImages(artwork.ImagePath, artwork.ThumbnailPath);
        }

        return Ok(artworks);
    }

    [HttpGet("{id}")] // Оставляем только GET для получения по ID
    public async Task<ActionResult<ArtworkDto>> GetArtwork(int id)
    {
        var artwork = await _context.Artworks
            .Include(a => a.Category)
            .Include(a => a.Images)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (artwork == null)
        {
            return NotFound();
        }

        return Ok(artwork.ToDto());
    }

    [HttpPost("create")] // Изменено: добавлен явный маршрут "create"
    [RequestFormLimits(MultipartBodyLengthLimit = 104857600)] // 100MB
    public async Task<ActionResult<Artwork>> CreateArtwork([FromForm] CreateArtworkDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        Console.WriteLine($"CreateArtwork: Title={dto.Title}, Description={dto.Description}, ImageFileName={dto.Image?.FileName}");

        var artwork = new Artwork
        {
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        dto.ApplyTo(artwork);
        await _artworkImages.SetCoverAsync(artwork, dto.Image!);

        _context.Artworks.Add(artwork);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetArtwork), new { id = artwork.Id }, artwork.ToDto());
    }

    [HttpPut("{id}")]
    [RequestFormLimits(MultipartBodyLengthLimit = 104857600)] // 100MB
    public async Task<IActionResult> UpdateArtwork(int id, [FromForm] UpdateArtworkDto dto)
    {
        var artwork = await _context.Artworks.Include(a => a.Images).FirstOrDefaultAsync(a => a.Id == id);
        if (artwork == null)
        {
            return NotFound();
        }

        Console.WriteLine($"UpdateArtwork: Id={id}, Title={dto.Title}, Description={dto.Description}, ImageFileName={dto.Image?.FileName}");

        dto.ApplyTo(artwork);
        artwork.UpdatedAt = DateTime.UtcNow;

        if (dto.Image != null)
        {
            await _artworkImages.SetCoverAsync(artwork, dto.Image);
        }

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteArtwork(int id)
    {
        var artwork = await _context.Artworks.Include(a => a.Images).FirstOrDefaultAsync(a => a.Id == id);
        if (artwork == null)
        {
            return NotFound();
        }

        _artworkImages.DeleteAllFiles(artwork);

        _context.Artworks.Remove(artwork);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}
