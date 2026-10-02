using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MomSite.API.DTOs;
using MomSite.Infrastructure.Services;

namespace MomSite.API.Controllers;

[ApiController]
[Route("api/admin/artworks/{id:int}/images")]
[Authorize]
public class ArtworkImagesController : ControllerBase
{
    private const long UploadLimit = 167772160; // 160MB: 10 files x 15MB + overhead

    private readonly IArtworkImageService _service;

    public ArtworkImagesController(IArtworkImageService service)
    {
        _service = service;
    }

    [HttpPost]
    [RequestSizeLimit(UploadLimit)]
    [RequestFormLimits(MultipartBodyLengthLimit = UploadLimit)]
    public async Task<IActionResult> Add(int id, [FromForm] List<IFormFile>? images)
    {
        var files = images ?? Request.Form.Files.Where(f => f.Name.Equals("Images", StringComparison.OrdinalIgnoreCase)).ToList();
        return ToResponse(await _service.AddImagesAsync(id, files));
    }

    [HttpDelete("{imageId:int}")]
    public async Task<IActionResult> Delete(int id, int imageId)
    {
        return ToResponse(await _service.DeleteImageAsync(id, imageId));
    }

    [HttpPut("order")]
    public async Task<IActionResult> Reorder(int id, [FromBody] ReorderImagesDto dto)
    {
        return ToResponse(await _service.ReorderAsync(id, dto.ImageIds ?? new List<int>()));
    }

    private IActionResult ToResponse(ArtworkImageResult result)
    {
        return result.Status switch
        {
            ArtworkImageStatus.NotFound => NotFound(),
            ArtworkImageStatus.BadRequest => BadRequest(new { message = result.Message }),
            _ => Ok(new ArtworkImagesResponse { Images = result.Images.Select(i => i.ToDto()).ToList() })
        };
    }
}
