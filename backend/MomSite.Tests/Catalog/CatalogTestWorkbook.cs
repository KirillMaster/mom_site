using ClosedXML.Excel;

namespace MomSite.Tests.Catalog;

internal static class CatalogTestWorkbook
{
    public static readonly string[] Headers =
    {
        "ID", "Раздел на сайте", "Фото", "Название", "Цена, ₽", "Статус", "Ширина, см", "Высота, см", "Год",
        "Основа", "Техника", "Короткое описание (1–2 предложения)", "История, выставки, интересные факты",
        "⭐ Сильная работа", "Фото: переснять?", "Комментарий", "Возможный дубль (ID)", "Ссылка на сайте"
    };

    public static (string Col, object? Val)[] Row(params (string Col, object? Val)[] cells) => cells;

    public static MemoryStream Build(
        IEnumerable<(string Col, object? Val)[]> rows,
        bool withFormat = true,
        IEnumerable<(string Col, object? Val)[]>? exhibitions = null,
        string catalogSheet = "Каталог",
        string[]? headers = null)
    {
        using var wb = new XLWorkbook();
        Fill(wb.AddWorksheet(catalogSheet), headers ?? Headers, rows);
        if (exhibitions != null)
            Fill(wb.AddWorksheet("Фото с выставок"),
                new[] { "ID", "Фото", "Подпись на сайте", "Оставить на сайте?", "Где и когда (выставка, год)", "Ссылка" }, exhibitions);
        var howto = wb.AddWorksheet("Как заполнять");
        howto.Cell(1, 1).Value = "Инструкция";
        if (withFormat) howto.Cell(20, 1).Value = "format: v1 (не удаляй эту строку)";
        var ms = new MemoryStream();
        wb.SaveAs(ms);
        ms.Position = 0;
        return ms;
    }

    private static void Fill(IXLWorksheet ws, string[] headers, IEnumerable<(string Col, object? Val)[]> rows)
    {
        for (var c = 0; c < headers.Length; c++) ws.Cell(1, c + 1).Value = headers[c];
        var r = 2;
        foreach (var row in rows)
        {
            foreach (var (col, val) in row)
            {
                var idx = Array.IndexOf(headers, col);
                if (idx < 0 || val is null) continue;
                ws.Cell(r, idx + 1).Value = XLCellValue.FromObject(val);
            }
            r++;
        }
    }
}
