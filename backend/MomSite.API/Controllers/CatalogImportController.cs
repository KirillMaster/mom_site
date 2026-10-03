using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MomSite.Core.Interfaces;
using MomSite.Core.Models.Catalog;

namespace MomSite.API.Controllers;

[ApiController]
[Route("api/admin/catalog")]
[Authorize]
public class CatalogImportController : ControllerBase
{
    public const long MaxFileBytes = 5 * 1024 * 1024;

    private readonly ICatalogImportService _service;

    public CatalogImportController(ICatalogImportService service) => _service = service;

    [HttpPost("import")]
    [RequestSizeLimit(MaxFileBytes + 256 * 1024)]
    public async Task<IActionResult> Import(IFormFile? file, [FromQuery] bool dryRun = true, CancellationToken ct = default)
    {
        if (file is null || file.Length == 0) return BadRequest(FileError(Core.Models.Catalog.FileError.NotXlsx));
        if (file.Length > MaxFileBytes) return StatusCode(StatusCodes.Status413PayloadTooLarge);

        await using var stream = file.OpenReadStream();
        var outcome = await _service.ImportAsync(stream, file.FileName, dryRun, User.Identity?.Name ?? "admin", ct);
        return outcome.Kind switch
        {
            ImportOutcomeKind.Report => Ok(outcome.Report),
            ImportOutcomeKind.FileInvalid => BadRequest(FileError(outcome.Error!.Value)),
            _ => Conflict(new { error = "import_in_progress", message = "Сейчас выполняется другой импорт. Подождите и повторите." })
        };
    }

    [HttpPost("import/rollback")]
    public async Task<IActionResult> Rollback(CancellationToken ct)
    {
        var outcome = await _service.RollbackLastAsync(ct);
        return outcome.Kind switch
        {
            RollbackOutcomeKind.RolledBack => Ok(outcome.Result),
            RollbackOutcomeKind.NothingToRollback => NotFound(new { error = "nothing_to_rollback", message = "Нет импорта, который можно откатить." }),
            _ => Conflict(new { error = "import_in_progress", message = "Сейчас выполняется другой импорт. Подождите и повторите." })
        };
    }

    private static object FileError(FileError e) => e switch
    {
        Core.Models.Catalog.FileError.NotXlsx => new { error = "not_xlsx", message = "Нужен файл .xlsx (в Google Таблицах: Файл → Скачать → Microsoft Excel)." },
        Core.Models.Catalog.FileError.FileUnreadable => new { error = "file_unreadable", message = "Не удалось прочитать файл: он повреждён или защищён паролем." },
        Core.Models.Catalog.FileError.SheetMissing => new { error = "sheet_missing", message = "В файле нет листа «Каталог»." },
        Core.Models.Catalog.FileError.RequiredHeaderMissing => new { error = "required_header_missing", message = "В листе «Каталог» нет обязательных колонок «ID» и «Название» в первой строке." },
        _ => new { error = "too_many_rows", message = "Слишком много строк: допустимо не более 2000." }
    };
}
