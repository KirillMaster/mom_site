using MomSite.Core.Models.Catalog;

namespace MomSite.Core.Interfaces;

public interface ICatalogImportService
{
    Task<ImportOutcome> ImportAsync(Stream file, string fileName, bool dryRun, string userName, CancellationToken ct = default);

    Task<RollbackOutcome> RollbackLastAsync(CancellationToken ct = default);
}
