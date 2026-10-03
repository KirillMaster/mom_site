using System.Text.RegularExpressions;

namespace MomSite.Infrastructure.Services;

public static class WatermarkPairing
{
    public static readonly TimeSpan Window = TimeSpan.FromSeconds(120);
    private const string CopyPrefix = "watermarked_";
    private static readonly Regex ArtworkName = new(@"(^|_)artworks/(?<name>[^/]+)$", RegexOptions.Compiled);

    public static bool IsCopy(string key) => Name(key) is { } n && HasCopyPrefix(n);

    public static bool IsOriginal(string key) => Name(key) is { } n && !HasCopyPrefix(n);

    private static bool HasCopyPrefix(string name) => name.StartsWith(CopyPrefix, StringComparison.OrdinalIgnoreCase);

    private static string? Name(string key)
    {
        var m = ArtworkName.Match(key);
        return m.Success ? m.Groups["name"].Value : null;
    }

    /// <summary>Returns copy key -> original key. Nearest pair by time wins; an original is used once.</summary>
    public static IReadOnlyDictionary<string, string> Match(IEnumerable<StorageObject> originals, IEnumerable<StorageObject> copies)
    {
        var origs = originals.ToList();
        var candidates = new List<(StorageObject Copy, StorageObject Orig, TimeSpan Diff)>();
        foreach (var copy in copies)
        {
            var ext = Path.GetExtension(copy.Key);
            foreach (var orig in origs)
            {
                if (!string.Equals(ext, Path.GetExtension(orig.Key), StringComparison.OrdinalIgnoreCase)) continue;
                var diff = copy.LastModified - orig.LastModified;
                if (diff < TimeSpan.Zero || diff > Window) continue;
                candidates.Add((copy, orig, diff));
            }
        }

        var result = new Dictionary<string, string>();
        var used = new HashSet<string>();
        foreach (var c in candidates.OrderBy(c => c.Diff).ThenBy(c => c.Orig.Key, StringComparer.Ordinal).ThenBy(c => c.Copy.Key, StringComparer.Ordinal))
        {
            if (result.ContainsKey(c.Copy.Key) || used.Contains(c.Orig.Key)) continue;
            result[c.Copy.Key] = c.Orig.Key;
            used.Add(c.Orig.Key);
        }
        return result;
    }
}
