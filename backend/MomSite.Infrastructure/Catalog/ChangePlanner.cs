using MomSite.Core.Models;
using MomSite.Core.Models.Catalog;

namespace MomSite.Infrastructure.Catalog;

/// <summary>Строит план изменений из разобранных строк и текущего состояния БД. Один и тот же план используют dry-run и apply.</summary>
public static class ChangePlanner
{
    public static ImportPlan Plan(
        IReadOnlyList<RowResult> results, IReadOnlyDictionary<int, Artwork> existing,
        IEnumerable<string> existingTitles, bool hasCategory, bool templateMismatch)
    {
        var state = new Dictionary<int, Dictionary<string, string?>>();
        var titles = new HashSet<string>(existingTitles.Select(Key));
        var planned = new List<PlannedRow>();
        foreach (var r in results)
            planned.Add(PlanRow(r, existing, state, titles, hasCategory));
        return new ImportPlan(planned, templateMismatch);
    }

    private static PlannedRow PlanRow(
        RowResult r, IReadOnlyDictionary<int, Artwork> existing,
        Dictionary<int, Dictionary<string, string?>> state, HashSet<string> titles, bool hasCategory)
    {
        var issues = r.Issues.ToList();
        if (r.HasError) return new PlannedRow(r, null, [], issues);

        Dictionary<string, string?> current;
        if (r.Id is int id)
        {
            if (!existing.TryGetValue(id, out var art))
            {
                issues.Add(new ImportIssue(ImportIssue.Error, "ID", $"Работа с ID {id} не найдена, строка пропущена"));
                return new PlannedRow(r, null, [], issues);
            }
            if (!state.TryGetValue(id, out current!)) state[id] = current = ArtworkFields.Snapshot(art);
        }
        else
        {
            if (!hasCategory)
            {
                issues.Add(new ImportIssue(ImportIssue.Error, "ID", "Нет ни одной категории: новую работу создать нельзя"));
                return new PlannedRow(r, null, [], issues);
            }
            current = ArtworkFields.Snapshot(NewDraft());
            AddNewWorkNotes(r, titles, issues);
        }

        var changes = Diff(r.Edits, current);
        return new PlannedRow(r, r.Id, changes, issues);
    }

    private static void AddNewWorkNotes(RowResult r, HashSet<string> titles, List<ImportIssue> issues)
    {
        var title = r.Edits.First(e => e.Field == ArtworkFields.Title).Value!;
        if (!titles.Add(Key(title)))
            issues.Add(new ImportIssue(ImportIssue.Warning, "Название", $"Работа с названием «{title}» уже есть"));
        issues.Add(new ImportIssue(ImportIssue.Warning, "ID", "Новая работа создаётся черновиком без фото: добавьте фото в админке"));
    }

    private static List<FieldChange> Diff(IReadOnlyList<FieldEdit> edits, Dictionary<string, string?> current)
    {
        var changes = new List<FieldChange>();
        foreach (var e in edits)
        {
            var old = current[e.Field];
            if (old == e.Value) continue;
            changes.Add(new FieldChange(e.Field, old, e.Value));
            current[e.Field] = e.Value;
        }
        return changes;
    }

    public static Artwork NewDraft() => new() { IsPublished = false, ImagePath = "", ThumbnailPath = "" };

    private static string Key(string t) => ValueParsers.Normalize(t).ToLowerInvariant();

    public static ImportReport ToReport(ImportPlan plan, int? logId = null)
    {
        var rows = new List<RowReport>();
        int updated = 0, created = 0, skipped = 0, warnings = 0, errors = 0;
        foreach (var p in plan.Rows)
        {
            warnings += p.Issues.Count(i => i.Level == ImportIssue.Warning);
            errors += p.Issues.Count(i => i.Level == ImportIssue.Error);
            if (p.HasError) skipped++;
            else if (p.Changes.Count == 0) skipped++;
            else if (p.IsNew) created++;
            else updated++;
            if (p.Changes.Count > 0 || p.Issues.Count > 0)
                rows.Add(new RowReport(p.Result.Raw.Row, p.Result.Raw.Sheet, p.ArtworkId ?? (p.Result.Id is > 0 ? p.Result.Id : null),
                    p.Result.Title, p.HasError ? [] : p.Changes, p.Issues, p.Result.Comment));
        }
        var summary = new ImportSummary(updated, created, skipped, warnings, errors, plan.TemplateVersionMismatch);
        return new ImportReport(summary, rows, logId);
    }
}
