using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using MomSite.Core.Models;
using MomSite.Core.Models.Catalog;
using MomSite.Infrastructure.Catalog;
using MomSite.Infrastructure.Data;
using Xunit;
using static MomSite.Tests.Catalog.CatalogTestWorkbook;

namespace MomSite.Tests.Catalog;

public sealed class CatalogImportServiceTests : IDisposable
{
    private readonly SqliteConnection _conn = new("DataSource=:memory:");
    private readonly ApplicationDbContext _db;
    private readonly CatalogImportService _svc;

    public CatalogImportServiceTests()
    {
        _conn.Open();
        _db = new ApplicationDbContext(new DbContextOptionsBuilder<ApplicationDbContext>().UseSqlite(_conn).Options);
        _db.Database.EnsureCreated();
        _db.Categories.Add(new Category { Name = "Вторая", DisplayOrder = 5 });
        _db.Categories.Add(new Category { Name = "Первая", DisplayOrder = 1 });
        _db.SaveChanges();
        _svc = new CatalogImportService(_db);
    }

    public void Dispose() { _db.Dispose(); _conn.Dispose(); }

    private Artwork Seed(string title = "Закат", decimal? price = 1000)
    {
        var a = new Artwork { Title = title, Price = price, ImagePath = "a.jpg", ThumbnailPath = "t.jpg", CategoryId = _db.Categories.First().Id };
        a.ApplyStatus(ArtworkStatus.Available);
        _db.Artworks.Add(a);
        _db.SaveChanges();
        _db.ChangeTracker.Clear();
        return a;
    }

    private Task<ImportOutcome> Import(MemoryStream s, bool dry = false) => _svc.ImportAsync(s, "c.xlsx", dry, "admin");

    [Fact]
    public async Task DryRun_reports_but_writes_nothing()
    {
        var a = Seed();
        var o = await Import(Build(new[] { Row(("ID", a.Id), ("Цена, ₽", 2000)) }), dry: true);
        Assert.Equal(1, o.Report!.Summary.Updated);
        Assert.Null(o.Report.LogId);
        Assert.Equal(1000, (await _db.Artworks.AsNoTracking().SingleAsync()).Price);
        Assert.Empty(_db.CatalogImportLogs);
    }

    [Fact]
    public async Task Apply_updates_and_logs_then_second_run_is_noop()
    {
        var a = Seed();
        var file = Build(new[] { Row(("ID", a.Id), ("Цена, ₽", 2000), ("Год", 2015)) }).ToArray();
        var o = await Import(new MemoryStream(file));
        Assert.NotNull(o.Report!.LogId);
        var saved = await _db.Artworks.AsNoTracking().SingleAsync();
        Assert.Equal((2000m, 2015), (saved.Price, saved.Year));
        var log = await _db.CatalogImportLogs.SingleAsync();
        Assert.Equal(2, log.Snapshot.Count);

        var again = await Import(new MemoryStream(file));
        Assert.Null(again.Report!.LogId);
        Assert.Equal(0, again.Report.Summary.Updated);
        Assert.Equal(1, await _db.CatalogImportLogs.CountAsync());
    }

    [Fact]
    public async Task New_row_creates_hidden_draft_in_first_category()
    {
        Seed();
        var o = await Import(Build(new[] { Row(("Название", "Новая"), ("Цена, ₽", 700)) }));
        Assert.Equal(1, o.Report!.Summary.Created);
        var d = await _db.Artworks.AsNoTracking().SingleAsync(x => x.Title == "Новая");
        Assert.False(d.IsPublished);
        Assert.Equal("", d.ImagePath);
        Assert.Equal("Первая", (await _db.Categories.FindAsync(d.CategoryId))!.Name);
    }

    [Fact]
    public async Task Status_not_mine_marks_artwork_not_for_sale()
    {
        var a = Seed();
        await Import(Build(new[] { Row(("ID", a.Id), ("Статус", "Не моя работа")) }));
        var saved = await _db.Artworks.AsNoTracking().SingleAsync();
        Assert.Equal(ArtworkStatus.NotMine, saved.Status);
        Assert.False(saved.IsForSale);
    }

    [Fact]
    public async Task Invalid_file_returns_error_kind()
    {
        var o = await _svc.ImportAsync(new MemoryStream(new byte[] { 1, 2, 3 }), "c.xlsx", false, "admin");
        Assert.Equal(ImportOutcomeKind.FileInvalid, o.Kind);
        Assert.Equal(FileError.NotXlsx, o.Error);
    }

    [Fact]
    public async Task Concurrent_import_gets_busy()
    {
        var gated = new GatedStream(Build(new[] { Row(("Название", "x")) }).ToArray());
        var first = Task.Run(() => _svc.ImportAsync(gated, "c.xlsx", true, "a"));
        gated.Entered.Wait(TimeSpan.FromSeconds(10));
        var second = await Import(Build(new[] { Row(("Название", "y")) }), dry: true);
        Assert.Equal(ImportOutcomeKind.Busy, second.Kind);
        Assert.Equal(RollbackOutcomeKind.Busy, (await _svc.RollbackLastAsync()).Kind);
        gated.Release.Set();
        Assert.Equal(ImportOutcomeKind.Report, (await first).Kind);
    }

    [Fact]
    public async Task Rollback_restores_values_and_deletes_drafts()
    {
        var a = Seed();
        await Import(Build(new[] { Row(("ID", a.Id), ("Цена, ₽", 5)), Row(("Название", "Черновик")) }));
        _db.ChangeTracker.Clear();
        var r = await _svc.RollbackLastAsync();
        Assert.Equal(RollbackOutcomeKind.RolledBack, r.Kind);
        Assert.Equal(1, r.Result!.DeletedDrafts);
        _db.ChangeTracker.Clear();
        Assert.Equal(1000, (await _db.Artworks.SingleAsync()).Price);
        Assert.Equal(RollbackOutcomeKind.NothingToRollback, (await _svc.RollbackLastAsync()).Kind);
    }

    [Fact]
    public async Task Rollback_skips_artwork_edited_after_import_and_keeps_drafts_with_photos()
    {
        var a = Seed();
        await Import(Build(new[] { Row(("ID", a.Id), ("Цена, ₽", 5)), Row(("Название", "Черновик")) }));
        _db.ChangeTracker.Clear();
        var edited = await _db.Artworks.SingleAsync(x => x.Id == a.Id);
        edited.Title = "Правка";
        edited.UpdatedAt = DateTime.UtcNow.AddMinutes(5);
        var draft = await _db.Artworks.SingleAsync(x => x.Title == "Черновик");
        draft.ImagePath = "uploaded.jpg";
        await _db.SaveChangesAsync();
        _db.ChangeTracker.Clear();

        var r = await _svc.RollbackLastAsync();
        Assert.Equal(new[] { a.Id }, r.Result!.EditedAfterImport);
        Assert.Equal(0, r.Result.DeletedDrafts);
        Assert.Equal(5, (await _db.Artworks.AsNoTracking().SingleAsync(x => x.Id == a.Id)).Price);
    }

    private sealed class GatedStream(byte[] data) : MemoryStream(data)
    {
        public ManualResetEventSlim Entered { get; } = new(false);
        public ManualResetEventSlim Release { get; } = new(false);

        public override Task CopyToAsync(Stream destination, int bufferSize, CancellationToken ct)
        {
            Entered.Set();
            Release.Wait(TimeSpan.FromSeconds(10));
            return base.CopyToAsync(destination, bufferSize, ct);
        }
    }
}
