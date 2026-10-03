using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MomSite.Infrastructure.Services;

namespace MomSite.API.Controllers;

[ApiController]
[Route("api/admin/images")]
[Authorize]
public class ImageMaintenanceController : ControllerBase
{
    private readonly IRewatermarkService _service;

    public ImageMaintenanceController(IRewatermarkService service)
    {
        _service = service;
    }

    [HttpPost("rewatermark")]
    public async Task<IActionResult> Rewatermark([FromQuery] bool dryRun = true, [FromQuery] int take = RewatermarkService.DefaultTake)
    {
        return Ok(await _service.RunAsync(dryRun, take));
    }
}
