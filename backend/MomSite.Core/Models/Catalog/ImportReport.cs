namespace MomSite.Core.Models.Catalog;

public record ImportSummary(
    int Updated = 0, int Created = 0, int Skipped = 0, int Warnings = 0, int Errors = 0,
    bool TemplateVersionMismatch = false);

public record FieldChange(string Field, string? Old, string? New);

public record ImportIssue(string Level, string Column, string Message)
{
    public const string Error = "error";
    public const string Warning = "warning";
}

public record RowReport(
    int Row, string Sheet, int? Id, string Title,
    IReadOnlyList<FieldChange> Changes, IReadOnlyList<ImportIssue> Issues, string? Comment);

public record ImportReport(ImportSummary Summary, IReadOnlyList<RowReport> Rows, int? LogId = null);

public enum FileError
{
    NotXlsx,
    FileUnreadable,
    SheetMissing,
    RequiredHeaderMissing,
    TooManyRows
}

public record SnapshotEntry(int ArtworkId, string Field, string? OldValue);

public record RollbackResult(int RestoredFields, int DeletedDrafts, IReadOnlyList<int> EditedAfterImport);
