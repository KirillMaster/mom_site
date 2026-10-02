using System.Globalization;
using MomSite.Core.Models;
using MomSite.Core.Models.Catalog;

namespace MomSite.Infrastructure.Catalog;

/// <summary>Разбор строки листа в набор правок. Не обращается к БД.</summary>
public static class RowValidator
{
    public static List<RowResult> Validate(IEnumerable<RawRow> rows, DateTime now)
    {
        var results = new List<RowResult>();
        var seen = new HashSet<(string, int)>();
        foreach (var raw in rows)
        {
            if (IsBlank(raw)) continue;
            var r = ValidateRow(raw, now);
            if (r.Id is int id && !seen.Add((raw.Sheet, id)))
                r = r with { Issues = r.Issues.Append(Err(CatalogColumn.Id, $"ID {id} повторяется на листе")).ToList() };
            results.Add(r);
        }
        return results;
    }

    private static bool IsBlank(RawRow raw) =>
        raw.Cells.Where(kv => kv.Key != CatalogColumn.Comment).All(kv => ValueParsers.Normalize(kv.Value).Length == 0);

    private static RowResult ValidateRow(RawRow raw, DateTime now)
    {
        var issues = new List<ImportIssue>();
        var edits = new List<FieldEdit>();
        var exhibition = raw.Sheet == SheetNames.Exhibitions;
        var id = ParseId(raw, exhibition, issues);
        if (exhibition) ExhibitionEdits(raw, edits, issues);
        else CatalogEdits(raw, now, edits, issues);

        var title = ValueParsers.Normalize(raw.Cell(CatalogColumn.Title));
        if (!exhibition && id is null && !issues.Any(i => i.Level == ImportIssue.Error) && !edits.Any(e => e.Field == ArtworkFields.Title))
            issues.Add(Err(CatalogColumn.Title, "У новой работы нужно название"));
        var comment = ValueParsers.Normalize(raw.Cell(CatalogColumn.Comment));
        return new RowResult(raw, id, title, edits, issues, comment.Length == 0 ? null : comment);
    }

    private static int? ParseId(RawRow raw, bool required, List<ImportIssue> issues)
    {
        var s = ValueParsers.Normalize(raw.Cell(CatalogColumn.Id));
        if (s.Length == 0)
        {
            if (required) issues.Add(Err(CatalogColumn.Id, "Не указан ID"));
            return null;
        }
        if (decimal.TryParse(s, NumberStyles.AllowDecimalPoint, CultureInfo.InvariantCulture, out var d)
            && d == decimal.Truncate(d) && d > 0 && d <= int.MaxValue)
            return (int)d;
        issues.Add(Err(CatalogColumn.Id, $"Некорректный ID «{s}»"));
        return -1;
    }

    private static void CatalogEdits(RawRow raw, DateTime now, List<FieldEdit> edits, List<ImportIssue> issues)
    {
        void Add<T>(CatalogColumn col, string field, Parsed<T> p, Func<T, string> fmt, bool clearable = true)
        {
            switch (p.Kind)
            {
                case ParseKind.Set: edits.Add(new FieldEdit(field, fmt(p.Value!))); break;
                case ParseKind.Clear when clearable: edits.Add(new FieldEdit(field, null)); break;
                case ParseKind.Clear: issues.Add(Warn(col, "Это поле нельзя очистить")); break;
                case ParseKind.Warn: issues.Add(Warn(col, p.Message!)); break;
            }
        }
        string C(CatalogColumn c) => raw.Cell(c);
        Add(CatalogColumn.Title, ArtworkFields.Title, ValueParsers.ParseText(C(CatalogColumn.Title), ArtworkFieldRules.TitleMax, "Название"), s => s, false);
        Add(CatalogColumn.Price, ArtworkFields.Price, ValueParsers.ParsePrice(C(CatalogColumn.Price)), v => v.ToString("0.##", CultureInfo.InvariantCulture));
        Add(CatalogColumn.Status, ArtworkFields.Status, ValueParsers.ParseStatus(C(CatalogColumn.Status)), v => v.ToString(), false);
        Add(CatalogColumn.Width, ArtworkFields.Width, ValueParsers.ParseSize(C(CatalogColumn.Width)), v => v.ToString("0.#", CultureInfo.InvariantCulture));
        Add(CatalogColumn.Height, ArtworkFields.Height, ValueParsers.ParseSize(C(CatalogColumn.Height)), v => v.ToString("0.#", CultureInfo.InvariantCulture));
        Add(CatalogColumn.Year, ArtworkFields.Year, ValueParsers.ParseYear(C(CatalogColumn.Year), now), v => v.ToString(CultureInfo.InvariantCulture));
        Add(CatalogColumn.Support, ArtworkFields.Support, ValueParsers.ParseText(C(CatalogColumn.Support), ArtworkFieldRules.SupportMax, "Основа"), s => s);
        Add(CatalogColumn.Technique, ArtworkFields.Technique, ValueParsers.ParseText(C(CatalogColumn.Technique), ArtworkFieldRules.TechniqueMax, "Техника"), s => s);
        Add(CatalogColumn.ShortDescription, ArtworkFields.ShortDescription, ValueParsers.ParseText(C(CatalogColumn.ShortDescription), ArtworkFieldRules.ShortDescriptionMax, "Короткое описание"), s => s);
        Add(CatalogColumn.Description, ArtworkFields.Description, ValueParsers.ParseText(C(CatalogColumn.Description), ArtworkFieldRules.DescriptionMax, "История"), s => s);
        Add(CatalogColumn.Featured, ArtworkFields.Featured, ValueParsers.ParseFlag(C(CatalogColumn.Featured)), Bool, false);
        Add(CatalogColumn.Reshoot, ArtworkFields.Reshoot, ValueParsers.ParseFlag(C(CatalogColumn.Reshoot), true), Bool, false);
    }

    private static void ExhibitionEdits(RawRow raw, List<FieldEdit> edits, List<ImportIssue> issues)
    {
        var keep = ValueParsers.ParseFlag(raw.Cell(CatalogColumn.ExhibitionKeep));
        if (keep.Kind == ParseKind.Warn) issues.Add(Warn(CatalogColumn.ExhibitionKeep, keep.Message!));
        else if (keep.Kind == ParseKind.Set && keep.Value == false) edits.Add(new FieldEdit(ArtworkFields.Published, "false"));

        var where = ValueParsers.ParseText(raw.Cell(CatalogColumn.ExhibitionWhere), ArtworkFieldRules.DescriptionMax, "Где и когда");
        if (where.Kind == ParseKind.Warn) issues.Add(Warn(CatalogColumn.ExhibitionWhere, where.Message!));
        else if (where.Kind == ParseKind.Set) edits.Add(new FieldEdit(ArtworkFields.Description, where.Value));
    }

    private static string Bool(bool b) => b ? "true" : "false";
    private static ImportIssue Err(CatalogColumn c, string m) => new(ImportIssue.Error, CatalogColumnNames.Display(c), m);
    private static ImportIssue Warn(CatalogColumn c, string m) => new(ImportIssue.Warning, CatalogColumnNames.Display(c), m);
}
