using MomSite.Core.Models.Catalog;

namespace MomSite.Infrastructure.Catalog;

public static class SheetNames
{
    public const string Catalog = "Каталог";
    public const string Exhibitions = "Фото с выставок";
    public const string Howto = "Как заполнять";
    public const string ExpectedFormat = "format: v1";
}

public sealed record RawRow(string Sheet, int Row, IReadOnlyDictionary<CatalogColumn, string> Cells)
{
    public string Cell(CatalogColumn c) => Cells.TryGetValue(c, out var v) ? v : "";
}

public sealed record ParsedWorkbook(IReadOnlyList<RawRow> Catalog, IReadOnlyList<RawRow> Exhibitions, bool TemplateVersionMismatch);

/// <summary>Одно правка поля: Clear = очистить (Value == null), иначе записать Value.</summary>
public sealed record FieldEdit(string Field, string? Value);

public sealed record RowResult(
    RawRow Raw, int? Id, string Title, IReadOnlyList<FieldEdit> Edits, IReadOnlyList<ImportIssue> Issues, string? Comment)
{
    public bool IsNew => Id is null;
    public bool HasError => Issues.Any(i => i.Level == ImportIssue.Error);
}

public sealed record PlannedRow(RowResult Result, int? ArtworkId, IReadOnlyList<FieldChange> Changes, IReadOnlyList<ImportIssue> Issues)
{
    public bool HasError => Issues.Any(i => i.Level == ImportIssue.Error);
    public bool IsNew => Result.IsNew;
}

public sealed record ImportPlan(IReadOnlyList<PlannedRow> Rows, bool TemplateVersionMismatch);
