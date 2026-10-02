using System.ComponentModel.DataAnnotations;
using MomSite.Core.Models.Catalog;

namespace MomSite.Core.Models;

public class CatalogImportLog
{
    public int Id { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [MaxLength(200)]
    public string UserName { get; set; } = string.Empty;

    [MaxLength(300)]
    public string FileName { get; set; } = string.Empty;

    [MaxLength(64)]
    public string FileSha256 { get; set; } = string.Empty;

    public ImportSummary Summary { get; set; } = new();
    public List<SnapshotEntry> Snapshot { get; set; } = new();
    public List<int> CreatedIds { get; set; } = new();
    public DateTime? RolledBackAt { get; set; }
}
