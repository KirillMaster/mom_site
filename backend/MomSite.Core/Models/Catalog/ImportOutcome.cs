namespace MomSite.Core.Models.Catalog;

public enum ImportOutcomeKind { Report, FileInvalid, Busy }

public record ImportOutcome(ImportOutcomeKind Kind, ImportReport? Report = null, FileError? Error = null)
{
    public static ImportOutcome Ok(ImportReport report) => new(ImportOutcomeKind.Report, report);
    public static ImportOutcome Invalid(FileError error) => new(ImportOutcomeKind.FileInvalid, Error: error);
    public static ImportOutcome Busy() => new(ImportOutcomeKind.Busy);
}

public enum RollbackOutcomeKind { RolledBack, NothingToRollback, Busy }

public record RollbackOutcome(RollbackOutcomeKind Kind, RollbackResult? Result = null)
{
    public static RollbackOutcome Ok(RollbackResult result) => new(RollbackOutcomeKind.RolledBack, result);
    public static RollbackOutcome Nothing() => new(RollbackOutcomeKind.NothingToRollback);
    public static RollbackOutcome Busy() => new(RollbackOutcomeKind.Busy);
}
