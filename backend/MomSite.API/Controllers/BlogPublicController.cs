using Microsoft.AspNetCore.Mvc;
using MomSite.API.DTOs.Blog;
using MomSite.Core.Interfaces;

namespace MomSite.API.Controllers;

/// <summary>Опубликованные статьи блога для сайта. Черновики и запланированные — 404.</summary>
[ApiController]
[Route("api/public/blog")]
public class BlogPublicController : ControllerBase
{
    private readonly IBlogService _blog;

    public BlogPublicController(IBlogService blog) => _blog = blog;

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] int page = 1, [FromQuery] string? categorySlug = null)
    {
        page = Math.Max(page, 1);
        var result = await _blog.ListPublishedAsync(page, categorySlug);
        return result.Outcome == BlogOutcome.Ok ? Ok(result.Value!.ToDto(page)) : NotFoundMessage();
    }

    [HttpGet("categories")]
    public async Task<ActionResult<IEnumerable<BlogPublicCategoryDto>>> Categories() =>
        Ok((await _blog.ListCategoriesAsync(onlyNonEmpty: true)).Select(c => c.ToPublicDto()));

    [HttpGet("{slug}")]
    public async Task<IActionResult> Get(string slug)
    {
        var result = await _blog.GetPublishedBySlugAsync(slug);
        return result.Outcome == BlogOutcome.Ok ? Ok(result.Value!.ToDto()) : NotFoundMessage();
    }

    private NotFoundObjectResult NotFoundMessage() => NotFound(new { message = "Статья не найдена." });
}
