using ClosedXML.Excel;
using MomSite.Core.Models.Catalog;
using MomSite.Infrastructure.Catalog;
using Xunit;
using static MomSite.Tests.Catalog.CatalogTestWorkbook;

namespace MomSite.Tests.Catalog;

public class WorkbookReaderTests
{
    private static ReadResult Read(Stream s, string name = "catalog.xlsx") => WorkbookReader.Read(s, name);

    [Fact]
    public void Reads_rows_with_int_float_and_string_cells()
    {
        var ms = Build(new[] { Row(("ID", 5), ("Название", "Закат"), ("Цена, ₽", 12500), ("Ширина, см", 110.5), ("Год", 2019), ("Статус", "В наличии")) });
        var r = Read(ms);
        Assert.Null(r.Error);
        var row = Assert.Single(r.Workbook!.Catalog);
        Assert.Equal("5", row.Cell(CatalogColumn.Id));
        Assert.Equal("Закат", row.Cell(CatalogColumn.Title));
        Assert.Equal("12500", row.Cell(CatalogColumn.Price));
        Assert.Equal("110.5", row.Cell(CatalogColumn.Width));
        Assert.Equal("2019", row.Cell(CatalogColumn.Year));
        Assert.Equal(2, row.Row);
    }

    [Fact]
    public void Template_version_present_is_not_a_mismatch()
    {
        Assert.False(Read(Build(new[] { Row(("ID", 1)) })).Workbook!.TemplateVersionMismatch);
        Assert.True(Read(Build(new[] { Row(("ID", 1)) }, withFormat: false)).Workbook!.TemplateVersionMismatch);
    }

    [Fact]
    public void Exhibition_sheet_is_read()
    {
        var ms = Build(new[] { Row(("ID", 1)) }, exhibitions: new[] { Row(("ID", 1), ("Оставить на сайте?", "нет")) });
        var wb = Read(ms).Workbook!;
        Assert.Equal("нет", Assert.Single(wb.Exhibitions).Cell(CatalogColumn.ExhibitionKeep));
    }

    [Fact]
    public void Formula_cells_do_not_break_reading()
    {
        using var wb = new XLWorkbook();
        var ws = wb.AddWorksheet("Каталог");
        ws.Cell(1, 1).Value = "ID"; ws.Cell(1, 2).Value = "Название"; ws.Cell(1, 3).Value = "Фото";
        ws.Cell(2, 1).Value = 1; ws.Cell(2, 2).Value = "А"; ws.Cell(2, 3).FormulaA1 = "IMAGE(\"http://x\")";
        var ms = new MemoryStream(); wb.SaveAs(ms); ms.Position = 0;
        var res = Read(ms);
        Assert.Null(res.Error);
        Assert.DoesNotContain(CatalogColumn.Price, res.Workbook!.Catalog[0].Cells.Keys);
    }

    [Theory]
    [InlineData("catalog.xls")]
    [InlineData("catalog.csv")]
    [InlineData("catalog")]
    public void Wrong_extension_is_not_xlsx(string name) =>
        Assert.Equal(FileError.NotXlsx, Read(Build(new[] { Row(("ID", 1)) }), name).Error);

    [Fact]
    public void Non_zip_content_is_not_xlsx() =>
        Assert.Equal(FileError.NotXlsx, Read(new MemoryStream(System.Text.Encoding.UTF8.GetBytes("ID;Name\n1;x"))).Error);

    [Fact]
    public void Empty_stream_is_not_xlsx() => Assert.Equal(FileError.NotXlsx, Read(new MemoryStream()).Error);

    [Fact]
    public void Zip_signature_but_garbage_is_unreadable()
    {
        var bytes = new byte[] { 0x50, 0x4B, 0x03, 0x04, 1, 2, 3, 4, 5, 6, 7, 8 };
        Assert.Equal(FileError.FileUnreadable, Read(new MemoryStream(bytes)).Error);
    }

    [Fact]
    public void Truncated_xlsx_is_unreadable()
    {
        var full = Build(new[] { Row(("ID", 1)) }).ToArray();
        Assert.Equal(FileError.FileUnreadable, Read(new MemoryStream(full[..(full.Length / 2)])).Error);
    }

    [Fact]
    public void Missing_catalog_sheet() =>
        Assert.Equal(FileError.SheetMissing, Read(Build(new[] { Row(("ID", 1)) }, catalogSheet: "Лист1")).Error);

    [Fact]
    public void Missing_required_header() =>
        Assert.Equal(FileError.RequiredHeaderMissing, Read(Build(new[] { Row(("ID", 1)) }, headers: new[] { "ID", "Цена, ₽" })).Error);

    [Fact]
    public void Too_many_rows()
    {
        var rows = Enumerable.Range(1, WorkbookReader.MaxRows + 1).Select(i => Row(("Название", "w" + i)));
        Assert.Equal(FileError.TooManyRows, Read(Build(rows)).Error);
    }

    [Fact]
    public void Exactly_max_rows_is_ok()
    {
        var rows = Enumerable.Range(1, WorkbookReader.MaxRows).Select(i => Row(("Название", "w" + i)));
        Assert.Null(Read(Build(rows)).Error);
    }

    [Fact]
    public void Sheet_name_and_header_case_are_not_important()
    {
        var ms = Build(new[] { Row(("ID", 1)) }, catalogSheet: "каталог", headers: new[] { "id", "НАЗВАНИЕ" });
        Assert.Null(Read(ms).Error);
    }

    [Fact(Skip = "Нет фикстуры экспорта из Google Sheets; добавить файл и проверить заголовки/типы после появления")]
    public void Google_sheets_export_is_read() { }
}
