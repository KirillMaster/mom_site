using System.Text.RegularExpressions;

namespace MomSite.Core.Services;

public static class DescriptionCleaner
{
    private static readonly Regex GeneratedStart = new(
        @"^\s*(" +
        @"На\s+(предоставленн\w+|представленн\w+|данн\w+|этой|эту)\s+(изображени\w+|картин\w+|работ\w+)|" +
        @"На\s+картине\s+(изображ|мы\s+видим|представл)|" +
        @"Эта\s+(картина|работа)|Это\s+(произведение|картина|работа)|Данн\w+\s+(произведение|картина|работа)|" +
        @"Картина\s+(«[^»]*»\s+)?(—|-|выполнена|представляет|изображает)|" +
        @"Работа\s+(погружает|выполнена|представляет)|" +
        @"В\s+этой\s+(работе|картине)|В\s+центре\s+композиции|В\s+целом|" +
        @"Художник\s+(мастерски|использовал|передал|удачно|умело)|" +
        @"Особенность\s+работы|Цветовая\s+гамма|Палитра\s+(насыщен|тёпл|тепл)|Фоном\s+служит|" +
        @"Художественный\s+стиль\s*:" +
        @")",
        RegexOptions.IgnoreCase | RegexOptions.CultureInvariant | RegexOptions.Compiled);

    public static string? Clean(string? description)
    {
        if (string.IsNullOrWhiteSpace(description)) return description;

        var lines = description.Replace("\r\n", "\n").Split('\n');
        var kept = lines.Where(l => !GeneratedStart.IsMatch(l)).ToList();
        if (kept.Count == lines.Length) return description;

        var result = string.Join("\n", kept).Trim();
        return result.Length == 0 ? null : result;
    }
}
