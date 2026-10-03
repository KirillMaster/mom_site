using System.Security.Cryptography;
using Microsoft.EntityFrameworkCore;
using MomSite.Core.Interfaces;
using MomSite.Core.Models;
using MomSite.Core.Models.Catalog;
using MomSite.Infrastructure.Data;

namespace MomSite.Infrastructure.Catalog;

public sealed class CatalogImportService(ApplicationDbContext db) : ICatalogImportService
{
    private static readonly SemaphoreSlim Gate = new(1, 1);

    public async Task<ImportOutcome> ImportAsync(Stream file, string fileName, bool dryRun, string userName, CancellationToken ct = default)
    {
        if (!Gate.Wait(0, ct)) return ImportOutcome.Busy();
        try
        {
            var buffer = new MemoryStream();
            await file.CopyToAsync(buffer, ct);
            buffer.Position = 0;
            var read = WorkbookReader.Read(buffer, fileName);
            if (read.Workbook is null) return ImportOutcome.Invalid(read.Error!.Value);

            var now = DateTime.UtcNow;
            var results = RowValidator.Validate(read.Workbook.Catalog.Concat(read.Workbook.Exhibitions), now);
            var ids = results.Where(r => r.Id is > 0).Select(r => r.Id!.Value).Distinct().ToList();
            var existing = await db.Artworks.Where(a => ids.Contains(a.Id)).ToDictionaryAsync(a => a.Id, ct);
            var titles = await db.Artworks.Select(a => a.Title).ToListAsync(ct);
            var categoryId = await db.Categories.OrderBy(c => c.DisplayOrder).ThenBy(c => c.Id)
                .Select(c => (int?)c.Id).FirstOrDefaultAsync(ct);

            var plan = ChangePlanner.Plan(results, existing, titles, categoryId.HasValue, read.Workbook.TemplateVersionMismatch);
            if (dryRun || !plan.Rows.Any(r => !r.HasError && r.Changes.Count > 0))
                return ImportOutcome.Ok(ChangePlanner.ToReport(plan));

            var logId = await SaveAsync(plan, existing, categoryId!.Value, buffer, fileName, userName, now, ct);
            return ImportOutcome.Ok(ChangePlanner.ToReport(plan, logId));
        }
        finally { Gate.Release(); }
    }

    private async Task<int> SaveAsync(ImportPlan plan, IReadOnlyDictionary<int, Artwork> existing, int categoryId,
        MemoryStream file, string fileName, string userName, DateTime now, CancellationToken ct)
    {
        await using var tx = db.Database.IsRelational() ? await db.Database.BeginTransactionAsync(ct) : null;
        var applied = ImportApplier.Apply(db, plan, existing, categoryId, now);
        await db.SaveChangesAsync(ct);

        var log = new CatalogImportLog
        {
            CreatedAt = now,
            UserName = userName.Length > 200 ? userName[..200] : userName,
            FileName = fileName.Length > 300 ? fileName[..300] : fileName,
            FileSha256 = Convert.ToHexString(SHA256.HashData(file.ToArray())).ToLowerInvariant(),
            Summary = ChangePlanner.ToReport(plan).Summary,
            Snapshot = applied.Snapshot,
            CreatedIds = applied.Created.Select(a => a.Id).ToList()
        };
        db.CatalogImportLogs.Add(log);
        await db.SaveChangesAsync(ct);
        if (tx != null) await tx.CommitAsync(ct);
        return log.Id;
    }

    public async Task<RollbackOutcome> RollbackLastAsync(CancellationToken ct = default)
    {
        if (!Gate.Wait(0, ct)) return RollbackOutcome.Busy();
        try
        {
            var result = await new ImportRollback(db).RunAsync(ct);
            return result is null ? RollbackOutcome.Nothing() : RollbackOutcome.Ok(result);
        }
        finally { Gate.Release(); }
    }
}
