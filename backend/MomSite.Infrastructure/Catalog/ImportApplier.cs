using MomSite.Core.Models;
using MomSite.Core.Models.Catalog;
using MomSite.Infrastructure.Data;

namespace MomSite.Infrastructure.Catalog;

public sealed record ApplyResult(List<SnapshotEntry> Snapshot, List<Artwork> Created);

/// <summary>Применяет готовый план к контексту (без SaveChanges). Снимок хранит исходные значения для отката.</summary>
public static class ImportApplier
{
    public static ApplyResult Apply(
        ApplicationDbContext db, ImportPlan plan, IReadOnlyDictionary<int, Artwork> existing, int categoryId, DateTime now)
    {
        var snapshot = new List<SnapshotEntry>();
        var seen = new HashSet<(int, string)>();
        var created = new List<Artwork>();

        foreach (var row in plan.Rows.Where(r => !r.HasError && r.Changes.Count > 0))
        {
            if (row.IsNew)
            {
                var art = ChangePlanner.NewDraft();
                art.CategoryId = categoryId;
                art.CreatedAt = art.UpdatedAt = now;
                foreach (var c in row.Changes) ArtworkFields.Set(art, c.Field, c.New);
                db.Artworks.Add(art);
                created.Add(art);
                continue;
            }

            var target = existing[row.ArtworkId!.Value];
            foreach (var c in row.Changes)
            {
                if (seen.Add((target.Id, c.Field))) snapshot.Add(new SnapshotEntry(target.Id, c.Field, c.Old));
                ArtworkFields.Set(target, c.Field, c.New);
            }
            target.UpdatedAt = now;
        }
        return new ApplyResult(snapshot, created);
    }
}
