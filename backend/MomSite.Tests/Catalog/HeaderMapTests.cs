using MomSite.Infrastructure.Catalog;
using Xunit;

namespace MomSite.Tests.Catalog;

public class HeaderMapTests
{
    private static HeaderMap Map(params string?[] h) => HeaderMap.Build(h.Select((t, i) => (i + 1, t)));

    [Fact]
    public void Real_headers_are_all_recognised()
    {
        var m = Map(CatalogTestWorkbook.Headers);
        Assert.True(m.HasRequired);
        foreach (var c in new[] { CatalogColumn.Price, CatalogColumn.Status, CatalogColumn.Width, CatalogColumn.Height,
            CatalogColumn.Year, CatalogColumn.Support, CatalogColumn.Technique, CatalogColumn.ShortDescription,
            CatalogColumn.Description, CatalogColumn.Featured, CatalogColumn.Reshoot, CatalogColumn.Comment })
            Assert.True(m.Has(c), c.ToString());
        m.TryGet(CatalogColumn.Id, out var id);
        Assert.Equal(1, id);
        m.TryGet(CatalogColumn.Reshoot, out var rs);
        Assert.Equal(15, rs);
    }

    [Fact]
    public void Photo_column_and_duplicate_id_column_are_not_mapped_to_fields()
    {
        var m = Map("ID", "Фото", "Название", "Возможный дубль (ID)");
        Assert.Equal(new[] { CatalogColumn.Id, CatalogColumn.Title }, m.All.Select(k => k.Key).OrderBy(k => k).ToArray());
    }

    [Theory]
    [InlineData("  НАЗВАНИЕ ")]
    [InlineData("название")]
    public void Case_and_spaces_are_ignored(string header) => Assert.True(Map("id", header).HasRequired);

    [Fact]
    public void Yo_and_dashes_and_nbsp_are_normalised()
    {
        var m = Map("ID", "Название", "Короткое описание (1–2 предложения)", "Ёлка", "Основа");
        Assert.True(m.Has(CatalogColumn.ShortDescription));
        Assert.True(m.Has(CatalogColumn.Support));
    }

    [Fact]
    public void Missing_required_header_detected()
    {
        Assert.False(Map("Название", "Цена").HasRequired);
        Assert.False(Map("ID", "Цена").HasRequired);
    }

    [Fact]
    public void Column_order_and_extra_columns_do_not_matter()
    {
        var m = Map("Лишнее", "Название", null, "Цена, ₽", "ID");
        Assert.True(m.HasRequired);
        m.TryGet(CatalogColumn.Id, out var i);
        Assert.Equal(5, i);
        Assert.False(m.TryGet(CatalogColumn.Year, out _));
    }

    [Fact]
    public void Exhibition_headers_mapped()
    {
        var m = Map("ID", "Фото", "Подпись на сайте", "Оставить на сайте?", "Где и когда (выставка, год)");
        Assert.True(m.Has(CatalogColumn.ExhibitionKeep));
        Assert.True(m.Has(CatalogColumn.ExhibitionWhere));
    }

    [Fact]
    public void First_of_duplicate_headers_wins()
    {
        var m = Map("ID", "Название", "Название");
        m.TryGet(CatalogColumn.Title, out var t);
        Assert.Equal(2, t);
    }
}
