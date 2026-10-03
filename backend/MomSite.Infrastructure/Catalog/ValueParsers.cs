using System.Globalization;
using System.Text.RegularExpressions;
using MomSite.Core.Models;

namespace MomSite.Infrastructure.Catalog;

/// <summary>Чистые функции разбора значений ячеек по контракту файла v1.</summary>
public static partial class ValueParsers
{
    private static readonly Dictionary<string, ArtworkStatus> Statuses = new()
    {
        ["в наличии"] = ArtworkStatus.Available,
        ["продана"] = ArtworkStatus.Sold,
        ["частная коллекция"] = ArtworkStatus.PrivateCollection,
        ["недоступна"] = ArtworkStatus.Unavailable,
        ["не продаётся"] = ArtworkStatus.NotForSale,
        ["не продается"] = ArtworkStatus.NotForSale,
        ["не моя работа"] = ArtworkStatus.NotMine,
    };

    public static string Normalize(string? raw) =>
        WhitespaceRegex().Replace((raw ?? "").Replace(' ', ' '), " ").Trim();

    private static bool IsEmpty(string s) => s.Length == 0;
    private static bool IsDash(string s) => s is "-" or "—" or "–";

    public static Parsed<decimal> ParsePrice(string? raw)
    {
        var s = Normalize(raw);
        if (IsEmpty(s)) return Parsed<decimal>.Keep();
        if (IsDash(s) || s.Equals("по запросу", StringComparison.OrdinalIgnoreCase)) return Parsed<decimal>.Clear();
        var digits = PriceNoiseRegex().Replace(s, "").Replace(" ", "");
        if (digits.Contains(',') && !digits.Contains('.')) digits = digits.Replace(',', '.');
        if (decimal.TryParse(digits, NumberStyles.AllowDecimalPoint, CultureInfo.InvariantCulture, out var v) && v >= 0 && v < 1_000_000_000m)
            return Parsed<decimal>.Set(Math.Round(v, 2));
        return Parsed<decimal>.Warn($"Не удалось разобрать цену «{s}»");
    }

    public static Parsed<decimal> ParseSize(string? raw)
    {
        var s = Normalize(raw);
        if (IsEmpty(s)) return Parsed<decimal>.Keep();
        if (IsDash(s)) return Parsed<decimal>.Clear();
        var t = s.Replace(',', '.');
        t = SizeSuffixRegex().Replace(t, "").Trim();
        if (decimal.TryParse(t, NumberStyles.AllowDecimalPoint, CultureInfo.InvariantCulture, out var v))
        {
            var rounded = Math.Round(v, 1, MidpointRounding.AwayFromZero);
            if (ArtworkFieldRules.IsSizeValid(rounded)) return Parsed<decimal>.Set(rounded);
            return Parsed<decimal>.Warn($"Размер «{s}» вне диапазона {ArtworkFieldRules.SizeMin}–{ArtworkFieldRules.SizeMax} см");
        }
        return Parsed<decimal>.Warn($"Не удалось разобрать размер «{s}»");
    }

    public static Parsed<int> ParseYear(string? raw, DateTime now)
    {
        var s = Normalize(raw);
        if (IsEmpty(s)) return Parsed<int>.Keep();
        if (IsDash(s)) return Parsed<int>.Clear();
        var m = YearRegex().Match(s);
        if (!m.Success || !int.TryParse(m.Groups[1].Value, out var y))
            return Parsed<int>.Warn($"Не удалось разобрать год «{s}»");
        return ArtworkFieldRules.IsYearValid(y, now)
            ? Parsed<int>.Set(y)
            : Parsed<int>.Warn($"Год {y} вне диапазона {ArtworkFieldRules.YearMin}–{now.Year}");
    }

    public static Parsed<ArtworkStatus> ParseStatus(string? raw)
    {
        var s = Normalize(raw);
        if (IsEmpty(s)) return Parsed<ArtworkStatus>.Keep();
        if (IsDash(s)) return Parsed<ArtworkStatus>.Warn("Статус нельзя очистить");
        var key = s.ToLowerInvariant();
        return Statuses.TryGetValue(key, out var st)
            ? Parsed<ArtworkStatus>.Set(st)
            : Parsed<ArtworkStatus>.Warn($"Неизвестный статус «{s}»");
    }

    /// <param name="anyNonEmptyIsTrue">для «Фото: переснять?» — любое непустое значение, кроме явного «нет», это да</param>
    public static Parsed<bool> ParseFlag(string? raw, bool anyNonEmptyIsTrue = false)
    {
        var s = Normalize(raw).ToLowerInvariant();
        if (IsEmpty(s)) return Parsed<bool>.Keep();
        if (s is "да" or "+" or "1" or "true" or "yes") return Parsed<bool>.Set(true);
        if (s is "нет" or "-" or "—" or "0" or "false" or "no") return Parsed<bool>.Set(false);
        return anyNonEmptyIsTrue ? Parsed<bool>.Set(true) : Parsed<bool>.Warn($"Не удалось разобрать «{s}» (ожидается да/нет)");
    }

    public static Parsed<string> ParseText(string? raw, int maxLen, string column)
    {
        var s = (raw ?? "").Replace("\r\n", "\n").Trim();
        if (IsEmpty(s)) return Parsed<string>.Keep();
        if (s == "-") return Parsed<string>.Clear();
        return s.Length > maxLen
            ? Parsed<string>.Warn($"«{column}»: {s.Length} символов, допустимо не более {maxLen}; поле не изменено")
            : Parsed<string>.Set(s);
    }

    [GeneratedRegex(@"\s+")] private static partial Regex WhitespaceRegex();
    [GeneratedRegex(@"(₽|руб\.?|р\.?)", RegexOptions.IgnoreCase)] private static partial Regex PriceNoiseRegex();
    [GeneratedRegex(@"\s*см\.?$", RegexOptions.IgnoreCase)] private static partial Regex SizeSuffixRegex();
    [GeneratedRegex(@"^(\d{4})(?:\.0+)?\s*(?:г\.?|год\w*)?$", RegexOptions.IgnoreCase)] private static partial Regex YearRegex();
}
