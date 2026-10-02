using MomSite.Core.Models.Catalog;
using MomSite.Infrastructure.Catalog;
using Xunit;

namespace MomSite.Tests.Catalog;

public class RowValidatorTests
{
    private static readonly DateTime Now = new(2026, 10, 3);

    private static RawRow Raw(int row, params (CatalogColumn, string)[] cells) =>
        new(SheetNames.Catalog, row, cells.ToDictionary(c => c.Item1, c => c.Item2));

    private static List<RowResult> V(params RawRow[] rows) => RowValidator.Validate(rows, Now);

    [Fact]
    public void Blank_rows_are_skipped_silently()
    {
        Assert.Empty(V(Raw(2, (CatalogColumn.Id, ""), (CatalogColumn.Title, " ")), Raw(3, (CatalogColumn.Comment, "просто комментарий"))));
    }

    [Fact]
    public void Empty_cell_means_keep_and_dash_means_clear()
    {
        var r = V(Raw(2, (CatalogColumn.Id, "5"), (CatalogColumn.Price, ""), (CatalogColumn.Year, "-"), (CatalogColumn.Support, "холст")))[0];
        Assert.DoesNotContain(r.Edits, e => e.Field == "Price");
        Assert.Contains(r.Edits, e => e.Field == "Year" && e.Value == null);
        Assert.Contains(r.Edits, e => e.Field == "Support" && e.Value == "холст");
        Assert.Empty(r.Issues);
    }

    [Fact]
    public void Bad_value_is_a_warning_and_field_is_untouched()
    {
        var r = V(Raw(2, (CatalogColumn.Id, "5"), (CatalogColumn.Price, "дорого"), (CatalogColumn.Year, "1800"), (CatalogColumn.Status, "??")))[0];
        Assert.Empty(r.Edits);
        Assert.Equal(3, r.Issues.Count(i => i.Level == ImportIssue.Warning));
        Assert.False(r.HasError);
    }

    [Theory]
    [InlineData("abc")]
    [InlineData("0")]
    [InlineData("-3")]
    [InlineData("2.5")]
    public void Bad_id_is_error(string id) => Assert.True(V(Raw(2, (CatalogColumn.Id, id), (CatalogColumn.Title, "x")))[0].HasError);

    [Theory]
    [InlineData("12", 12)]
    [InlineData("12.0", 12)]
    public void Id_accepts_numeric_text(string id, int exp) => Assert.Equal(exp, V(Raw(2, (CatalogColumn.Id, id), (CatalogColumn.Price, "1")))[0].Id);

    [Fact]
    public void New_row_requires_title()
    {
        var r = V(Raw(2, (CatalogColumn.Price, "100")))[0];
        Assert.True(r.IsNew);
        Assert.True(r.HasError);
        Assert.False(V(Raw(3, (CatalogColumn.Title, "Новая")))[0].HasError);
    }

    [Fact]
    public void Duplicate_id_in_sheet_is_error_for_second_row()
    {
        var r = V(Raw(2, (CatalogColumn.Id, "5"), (CatalogColumn.Price, "1")), Raw(3, (CatalogColumn.Id, "5"), (CatalogColumn.Price, "2")));
        Assert.False(r[0].HasError);
        Assert.True(r[1].HasError);
    }

    [Fact]
    public void Title_and_status_cannot_be_cleared()
    {
        var r = V(Raw(2, (CatalogColumn.Id, "5"), (CatalogColumn.Title, "-"), (CatalogColumn.Status, "-")))[0];
        Assert.Empty(r.Edits);
        Assert.Equal(2, r.Issues.Count);
    }

    [Fact]
    public void Flags_and_comment()
    {
        var r = V(Raw(2, (CatalogColumn.Id, "5"), (CatalogColumn.Featured, "да"), (CatalogColumn.Reshoot, "темновато"), (CatalogColumn.Comment, " проверить ")))[0];
        Assert.Contains(r.Edits, e => e.Field == "IsFeatured" && e.Value == "true");
        Assert.Contains(r.Edits, e => e.Field == "NeedsReshoot" && e.Value == "true");
        Assert.Equal("проверить", r.Comment);
    }

    [Fact]
    public void Exhibition_row_hides_on_no_and_sets_description()
    {
        var raw = new RawRow(SheetNames.Exhibitions, 2, new Dictionary<CatalogColumn, string>
        {
            [CatalogColumn.Id] = "7", [CatalogColumn.ExhibitionKeep] = "нет", [CatalogColumn.ExhibitionWhere] = "Москва, 2019"
        });
        var r = V(raw)[0];
        Assert.Contains(r.Edits, e => e.Field == "IsPublished" && e.Value == "false");
        Assert.Contains(r.Edits, e => e.Field == "Description" && e.Value == "Москва, 2019");
    }

    [Fact]
    public void Exhibition_row_without_id_is_error_and_yes_changes_nothing()
    {
        var no = new RawRow(SheetNames.Exhibitions, 2, new Dictionary<CatalogColumn, string> { [CatalogColumn.ExhibitionKeep] = "нет" });
        Assert.True(V(no)[0].HasError);
        var yes = new RawRow(SheetNames.Exhibitions, 3, new Dictionary<CatalogColumn, string> { [CatalogColumn.Id] = "7", [CatalogColumn.ExhibitionKeep] = "да" });
        Assert.Empty(V(yes)[0].Edits);
    }
}
