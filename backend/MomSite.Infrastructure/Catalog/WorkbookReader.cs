using System.Globalization;
using ClosedXML.Excel;
using MomSite.Core.Models.Catalog;

namespace MomSite.Infrastructure.Catalog;

public sealed record ReadResult(ParsedWorkbook? Workbook, FileError? Error);

/// <summary>Читает xlsx в «сырые» строки. Не знает про БД и правила значений.</summary>
public static class WorkbookReader
{
    public const int MaxRows = 2000;
    private static readonly byte[] ZipSignature = { 0x50, 0x4B, 0x03, 0x04 };

    public static ReadResult Read(Stream file, string fileName)
    {
        if (!fileName.EndsWith(".xlsx", StringComparison.OrdinalIgnoreCase)) return Fail(FileError.NotXlsx);
        var head = new byte[4];
        var n = file.Read(head, 0, 4);
        if (n < 4 || !head.SequenceEqual(ZipSignature)) return Fail(FileError.NotXlsx);
        file.Seek(0, SeekOrigin.Begin);

        try
        {
            using var wb = new XLWorkbook(file);
            return ReadWorkbook(wb);
        }
        catch (Exception)
        {
            return Fail(FileError.FileUnreadable);
        }
    }

    private static ReadResult ReadWorkbook(XLWorkbook wb)
    {
        var catalog = FindSheet(wb, SheetNames.Catalog);
        if (catalog is null) return Fail(FileError.SheetMissing);
        var map = BuildMap(catalog);
        if (!map.HasRequired) return Fail(FileError.RequiredHeaderMissing);
        if (DataRowCount(catalog) > MaxRows) return Fail(FileError.TooManyRows);

        var catalogRows = ReadRows(catalog, map, SheetNames.Catalog);
        var exhibitions = FindSheet(wb, SheetNames.Exhibitions);
        var exhRows = new List<RawRow>();
        if (exhibitions is not null)
        {
            var exhMap = BuildMap(exhibitions);
            if (exhMap.Has(CatalogColumn.Id))
            {
                if (DataRowCount(exhibitions) > MaxRows) return Fail(FileError.TooManyRows);
                exhRows = ReadRows(exhibitions, exhMap, SheetNames.Exhibitions);
            }
        }
        return new ReadResult(new ParsedWorkbook(catalogRows, exhRows, !HasExpectedFormat(wb)), null);
    }

    private static ReadResult Fail(FileError e) => new(null, e);

    private static IXLWorksheet? FindSheet(XLWorkbook wb, string name) =>
        wb.Worksheets.FirstOrDefault(w => HeaderMap.NormalizeHeader(w.Name) == HeaderMap.NormalizeHeader(name));

    private static HeaderMap BuildMap(IXLWorksheet ws)
    {
        var last = ws.LastColumnUsed()?.ColumnNumber() ?? 0;
        return HeaderMap.Build(Enumerable.Range(1, last).Select(c => (c, (string?)CellText(ws.Cell(1, c)))));
    }

    private static int DataRowCount(IXLWorksheet ws) => Math.Max(0, (ws.LastRowUsed()?.RowNumber() ?? 1) - 1);

    private static List<RawRow> ReadRows(IXLWorksheet ws, HeaderMap map, string sheet)
    {
        var rows = new List<RawRow>();
        var last = ws.LastRowUsed()?.RowNumber() ?? 1;
        for (var r = 2; r <= last; r++)
        {
            var cells = new Dictionary<CatalogColumn, string>();
            foreach (var (col, idx) in map.All) cells[col] = CellText(ws.Cell(r, idx));
            rows.Add(new RawRow(sheet, r, cells));
        }
        return rows;
    }

    private static bool HasExpectedFormat(XLWorkbook wb)
    {
        var ws = FindSheet(wb, SheetNames.Howto);
        if (ws is null) return false;
        var last = ws.LastRowUsed()?.RowNumber() ?? 0;
        for (var r = 1; r <= last; r++)
        {
            var t = ValueParsers.Normalize(CellText(ws.Cell(r, 1))).ToLowerInvariant();
            if (t.StartsWith("format:")) return t.StartsWith(SheetNames.ExpectedFormat);
        }
        return false;
    }

    public static string CellText(IXLCell cell)
    {
        var v = cell.HasFormula ? cell.CachedValue : cell.Value;
        if (v.IsBlank) return "";
        if (v.IsText) return v.GetText();
        if (v.IsNumber) return NumberText(v.GetNumber());
        if (v.IsBoolean) return v.GetBoolean() ? "true" : "false";
        if (v.IsDateTime) return v.GetDateTime().ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
        return "";
    }

    private static string NumberText(double d) =>
        d == Math.Floor(d) && Math.Abs(d) < 1e15
            ? ((long)d).ToString(CultureInfo.InvariantCulture)
            : d.ToString("R", CultureInfo.InvariantCulture);
}
