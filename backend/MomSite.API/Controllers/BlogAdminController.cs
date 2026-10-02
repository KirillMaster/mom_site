using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MomSite.API.DTOs.Blog;
using MomSite.Core.Interfaces;
using MomSite.Infrastructure.Blog;
using MomSite.Infrastructure.Services;

namespace MomSite.API.Controllers;

[ApiController]
[Route("api/admin/blog")]
[Authorize]
public class BlogAdminController : ControllerBase
{
    private readonly IBlogService _blog;
    private readonly IImageService _imageService;
    private readonly TimeProvider _time;

    public BlogAdminController(IBlogService blog, IImageService imageService, TimeProvider time)
    {
        _blog = blog;
        _imageService = imageService;
        _time = time;
    }

    private DateTime Now => _time.GetUtcNow().UtcDateTime;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<BlogPostAdminListItemDto>>> List() =>
        Ok((await _blog.AdminListAsync()).Select(p => p.ToListItem(Now)));

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id) => ToPost(await _blog.AdminGetAsync(id));

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] BlogPostSaveDto dto)
    {
        var result = await _blog.CreateAsync(dto.ToInput());
        return result.Outcome == BlogOutcome.Ok
            ? CreatedAtAction(nameof(Get), new { id = result.Value!.Id }, result.Value.ToAdminDto(Now))
            : ToPost(result);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] BlogPostSaveDto dto) =>
        ToPost(await _blog.UpdateAsync(id, dto.ToInput()));

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id) => ToEmpty(await _blog.DeleteAsync(id));

    [HttpGet("categories")]
    public async Task<ActionResult<IEnumerable<BlogCategoryDto>>> ListCategories() =>
        Ok((await _blog.ListCategoriesAsync(onlyNonEmpty: false)).Select(c => c.Category.ToDto(c.PostCount)));

    [HttpPost("categories")]
    public async Task<IActionResult> CreateCategory([FromBody] BlogCategorySaveDto dto) =>
        ToCategory(await _blog.CreateCategoryAsync(dto.ToInput()));

    [HttpPut("categories/{id:int}")]
    public async Task<IActionResult> UpdateCategory(int id, [FromBody] BlogCategorySaveDto dto) =>
        ToCategory(await _blog.UpdateCategoryAsync(id, dto.ToInput()));

    [HttpDelete("categories/{id:int}")]
    public async Task<IActionResult> DeleteCategory(int id) => ToEmpty(await _blog.DeleteCategoryAsync(id));

    [HttpPost("images")]
    [RequestSizeLimit(16_000_000)]
    [RequestFormLimits(MultipartBodyLengthLimit = 16_000_000)]
    public async Task<IActionResult> UploadImage(IFormFile? file)
    {
        var invalid = BlogImageProcessor.Validate(file);
        if (invalid != null) return BadRequest(new { message = invalid });
        var prepared = await BlogImageProcessor.PrepareAsync(file!);
        if (prepared == null) return BadRequest(new { message = "Файл не похож на фото. Выберите снимок в формате JPEG, PNG или WebP." });
        return Ok(new { url = await _imageService.SaveImageAsync(prepared, "blog") });
    }

    private IActionResult ToPost(BlogResult<Core.Models.BlogPost> result) =>
        result.Outcome == BlogOutcome.Ok ? Ok(result.Value!.ToAdminDto(Now)) : Fail(result);

    private IActionResult ToCategory(BlogResult<Core.Models.BlogCategory> result) =>
        result.Outcome == BlogOutcome.Ok ? Ok(result.Value!.ToDto()) : Fail(result);

    private IActionResult ToEmpty(BlogResult<bool> result) =>
        result.Outcome == BlogOutcome.Ok ? NoContent() : Fail(result);

    private IActionResult Fail<T>(BlogResult<T> result) => result.Outcome switch
    {
        BlogOutcome.NotFound => NotFound(new { message = "Не найдено — возможно, уже удалено." }),
        BlogOutcome.ValidationFailed => BadRequest(new { errors = result.Errors }),
        BlogOutcome.Conflict => Conflict(new
        {
            reason = result.ConflictReason,
            postCount = result.PostCount,
            message = result.ConflictReason == BlogConflict.CategoryNotEmpty
                ? $"В рубрике есть статьи ({result.PostCount}) — сначала перенесите их в другую рубрику."
                : "Статья уже опубликована — её адрес менять нельзя, иначе старые ссылки перестанут работать."
        }),
        _ => StatusCode(500)
    };
}
