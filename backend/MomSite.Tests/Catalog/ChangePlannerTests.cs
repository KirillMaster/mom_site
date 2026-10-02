using MomSite.Core.Models;
using MomSite.Core.Models.Catalog;
using MomSite.Infrastructure.Catalog;
using Xunit;

namespace MomSite.Tests.Catalog;

public class ChangePlannerTests
{
    private static readonly DateTime Now = new(2026, 10, 3);

    private static RawRow Raw(int row, params (CatalogColumn, string)[] cells) =>
        new(SheetNames.Catalog, row, cells.ToDictionary(c => c.Item1, c => c.Item2));

    private static Artwork Art(int id = 1, string title = "Закат") => new()
    {
        Id = id, Title = title, Price = 1000, Year = 2010, ImagePath = "a.jpg", ThumbnailPath = "t.jpg"
    };

    private static ImportPlan Plan(IEnumerable<RawRow> rows, params Artwork[] existing) =>
        ChangePlanner.Plan(RowValidator.Validate(rows, Now), existing.ToDictionary(a => a.Id),
            existing.Select(a => a.Title), true, false);

    [Fact]
    public void Only_changed_fields_are_reported()
    {
        var plan = Plan(new[] { Raw(2, (CatalogColumn.Id, "1"), (CatalogColumn.Price, "1000"), (CatalogColumn.Year, "2011")) }, Art());
        var ch = Assert.Single(plan.Rows[0].Changes);
        Assert.Equal(("Year", "2010", "2011"), (ch.Field, ch.Old, ch.New));
    }

    [Fact]
    public void Same_values_give_no_changes_and_skipped_summary()
    {
        var plan = Plan(new[] { Raw(2, (CatalogColumn.Id, "1"), (CatalogColumn.Price, "1 000 ₽"), (CatalogColumn.Title, "Закат")) }, Art());
        var report = ChangePlanner.ToReport(plan);
        Assert.Equal(0, report.Summary.Updated);
        Assert.Equal(1, report.Summary.Skipped);
        Assert.Empty(report.Rows);
    }

    [Fact]
    public void Unknown_id_is_error_row()
    {
        var plan = Plan(new[] { Raw(2, (CatalogColumn.Id, "99"), (CatalogColumn.Price, "5")) }, Art());
        Assert.True(plan.Rows[0].HasError);
        var s = ChangePlanner.ToReport(plan).Summary;
        Assert.Equal((0, 1, 1), (s.Updated, s.Errors, s.Skipped));
    }

    [Fact]
    public void Dash_clears_price()
    {
        var plan = Plan(new[] { Raw(2, (CatalogColumn.Id, "1"), (CatalogColumn.Price, "-")) }, Art());
        var ch = Assert.Single(plan.Rows[0].Changes);
        Assert.Equal(("Price", "1000", (string?)null), (ch.Field, ch.Old, ch.New));
    }

    [Fact]
    public void New_row_is_created_as_draft_with_warnings()
    {
        var plan = Plan(new[] { Raw(2, (CatalogColumn.Title, "Новая"), (CatalogColumn.Price, "500")) }, Art());
        var row = plan.Rows[0];
        Assert.True(row.IsNew);
        Assert.Contains(row.Changes, c => c.Field == "Title" && c.New == "Новая");
        Assert.Contains(row.Issues, i => i.Message.Contains("без фото"));
        Assert.Equal(1, ChangePlanner.ToReport(plan).Summary.Created);
    }

    [Fact]
    public void New_row_with_existing_title_warns_about_duplicate()
    {
        var plan = Plan(new[] { Raw(2, (CatalogColumn.Title, " закат ")) }, Art());
        Assert.Contains(plan.Rows[0].Issues, i => i.Message.Contains("уже есть"));
    }

    [Fact]
    public void Second_new_row_with_same_title_in_file_warns()
    {
        var plan = Plan(new[] { Raw(2, (CatalogColumn.Title, "Х")), Raw(3, (CatalogColumn.Title, "Х")) });
        Assert.DoesNotContain(plan.Rows[0].Issues, i => i.Message.Contains("уже есть"));
        Assert.Contains(plan.Rows[1].Issues, i => i.Message.Contains("уже есть"));
    }

    [Fact]
    public void New_row_without_category_is_error()
    {
        var plan = ChangePlanner.Plan(RowValidator.Validate(new[] { Raw(2, (CatalogColumn.Title, "Х")) }, Now),
            new Dictionary<int, Artwork>(), Array.Empty<string>(), false, false);
        Assert.True(plan.Rows[0].HasError);
    }

    [Fact]
    public void Two_rows_for_same_artwork_diff_against_planned_state()
    {
        var ex = new RawRow(SheetNames.Exhibitions, 2, new Dictionary<CatalogColumn, string>
        {
            [CatalogColumn.Id] = "1", [CatalogColumn.ExhibitionWhere] = "Выставка"
        });
        var cat = Raw(2, (CatalogColumn.Id, "1"), (CatalogColumn.Description, "Выставка"));
        var plan = ChangePlanner.Plan(RowValidator.Validate(new[] { cat, ex }, Now),
            new Dictionary<int, Artwork> { [1] = Art() }, new[] { "Закат" }, true, false);
        Assert.Single(plan.Rows[0].Changes);
        Assert.Empty(plan.Rows[1].Changes);
    }

    [Fact]
    public void Status_change_is_reported_by_name_and_template_flag_flows_to_summary()
    {
        var results = RowValidator.Validate(new[] { Raw(2, (CatalogColumn.Id, "1"), (CatalogColumn.Status, "Продана")) }, Now);
        var plan = ChangePlanner.Plan(results, new Dictionary<int, Artwork> { [1] = Art() }, new[] { "Закат" }, true, true);
        Assert.Equal("Sold", plan.Rows[0].Changes[0].New);
        Assert.True(ChangePlanner.ToReport(plan).Summary.TemplateVersionMismatch);
    }

    [Fact]
    public void ArtworkFields_roundtrip_restores_every_field()
    {
        var a = Art();
        a.Support = "холст"; a.IsFeatured = true; a.WidthCm = 10.5m;
        var before = ArtworkFields.Snapshot(a);
        ArtworkFields.Set(a, "Status", "Sold");
        ArtworkFields.Set(a, "Price", null);
        ArtworkFields.Set(a, "WidthCm", "99.5");
        Assert.False(a.IsForSale);
        foreach (var kv in before) ArtworkFields.Set(a, kv.Key, kv.Value);
        Assert.Equal(before, ArtworkFields.Snapshot(a));
        Assert.True(a.IsForSale);
    }
}
