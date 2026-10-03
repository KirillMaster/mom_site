using Microsoft.EntityFrameworkCore;
using MomSite.Core.Models;
using MomSite.Core.Models.Catalog;
using MomSite.Infrastructure.Data;

namespace MomSite.Infrastructure.Catalog;

/// <summary>Откат последнего импорта по снимку. Работы, правленные после импорта, не трогаем.</summary>
public sealed class ImportRollback(ApplicationDbContext db)
{
    public async Task<RollbackResult?> RunAsync(CancellationToken ct)
    {
        var log = await db.CatalogImportLogs.OrderByDescending(l => l.Id).FirstOrDefaultAsync(ct);
        if (log is null || log.RolledBackAt != null) return null;

        var now = DateTime.UtcNow;
        var ids = log.Snapshot.Select(s => s.ArtworkId).Distinct().ToList();
        var arts = await db.Artworks.Where(a => ids.Contains(a.Id)).ToDictionaryAsync(a => a.Id, ct);
        var edited = arts.Values.Where(a => a.UpdatedAt > log.CreatedAt).Select(a => a.Id).OrderBy(i => i).ToList();

        var restored = 0;
        foreach (var s in log.Snapshot.Where(s => arts.ContainsKey(s.ArtworkId) && !edited.Contains(s.ArtworkId)))
        {
            ArtworkFields.Set(arts[s.ArtworkId], s.Field, s.OldValue);
            arts[s.ArtworkId].UpdatedAt = now;
            restored++;
        }

        var deleted = await DeleteDraftsAsync(log.CreatedIds, ct);
        log.RolledBackAt = now;

        await using var tx = db.Database.IsRelational() ? await db.Database.BeginTransactionAsync(ct) : null;
        await db.SaveChangesAsync(ct);
        if (tx != null) await tx.CommitAsync(ct);
        return new RollbackResult(restored, deleted, edited);
    }

    private async Task<int> DeleteDraftsAsync(List<int> createdIds, CancellationToken ct)
    {
        var drafts = await db.Artworks.Include(a => a.Images)
            .Where(a => createdIds.Contains(a.Id) && a.ImagePath == "" && !a.Images.Any())
            .ToListAsync(ct);
        db.Artworks.RemoveRange(drafts);
        return drafts.Count;
    }
}
