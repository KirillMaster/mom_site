using System.Text.RegularExpressions;

namespace MomSite.Infrastructure.Blog;

/// <summary>Адрес статьи: латиница, цифры, дефис. Транслитерацию делает фронт (slugifyTitle).</summary>
public static partial class BlogSlug
{
    public const int MaxLength = 120;

    [GeneratedRegex("^[a-z0-9]+(-[a-z0-9]+)*$")]
    private static partial Regex Pattern();

    public static bool IsValid(string? slug) =>
        !string.IsNullOrEmpty(slug) && slug.Length <= MaxLength && Pattern().IsMatch(slug);

    public static async Task<string> MakeUniqueAsync(string slug, Func<string, Task<bool>> isTaken)
    {
        if (!await isTaken(slug)) return slug;
        for (var n = 2; ; n++)
        {
            var suffix = $"-{n}";
            var candidate = (slug.Length + suffix.Length > MaxLength ? slug[..(MaxLength - suffix.Length)] : slug) + suffix;
            if (!await isTaken(candidate)) return candidate;
        }
    }
}
