namespace MomSite.Infrastructure.Catalog;

/// <summary>Сопоставление заголовков строки 1 с колонками (регистр, ё/е, пробелы и тире не важны).</summary>
public sealed class HeaderMap
{
    private readonly Dictionary<CatalogColumn, int> _index = new();

    private static readonly (CatalogColumn Col, Func<string, bool> Match)[] Rules =
    {
        (CatalogColumn.Id, h => h == "id"),
        (CatalogColumn.Title, h => h == "название"),
        (CatalogColumn.Price, h => h.StartsWith("цена")),
        (CatalogColumn.Status, h => h == "статус"),
        (CatalogColumn.Width, h => h.StartsWith("ширина")),
        (CatalogColumn.Height, h => h.StartsWith("высота")),
        (CatalogColumn.Year, h => h == "год"),
        (CatalogColumn.Support, h => h == "основа"),
        (CatalogColumn.Technique, h => h == "техника"),
        (CatalogColumn.ShortDescription, h => h.StartsWith("короткое описание")),
        (CatalogColumn.Description, h => h.StartsWith("история")),
        (CatalogColumn.Featured, h => h.Contains("сильная работа")),
        (CatalogColumn.Reshoot, h => h.Contains("переснять")),
        (CatalogColumn.Comment, h => h == "комментарий"),
        (CatalogColumn.ExhibitionKeep, h => h.StartsWith("оставить на сайте")),
        (CatalogColumn.ExhibitionWhere, h => h.StartsWith("где и когда")),
    };

    public static string NormalizeHeader(string? raw)
    {
        var s = ValueParsers.Normalize(raw).ToLowerInvariant().Replace('ё', 'е');
        return s.Replace('–', '-').Replace('—', '-');
    }

    /// <param name="headers">индекс колонки (1-based) -> текст заголовка</param>
    public static HeaderMap Build(IEnumerable<(int Column, string? Text)> headers)
    {
        var map = new HeaderMap();
        foreach (var (col, text) in headers)
        {
            var h = NormalizeHeader(text);
            if (h.Length == 0) continue;
            foreach (var rule in Rules)
            {
                if (map._index.ContainsKey(rule.Col) || !rule.Match(h)) continue;
                map._index[rule.Col] = col;
                break;
            }
        }
        return map;
    }

    public bool Has(CatalogColumn c) => _index.ContainsKey(c);
    public bool TryGet(CatalogColumn c, out int column) => _index.TryGetValue(c, out column);
    public IEnumerable<KeyValuePair<CatalogColumn, int>> All => _index;
    public bool HasRequired => Has(CatalogColumn.Id) && Has(CatalogColumn.Title);
}
