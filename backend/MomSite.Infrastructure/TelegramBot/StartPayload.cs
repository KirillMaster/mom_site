using System.Text.RegularExpressions;

namespace MomSite.Infrastructure.TelegramBot;

public static class StartPayloadParser
{
    private static readonly Regex Allowed = new("^[A-Za-z0-9_-]{1,64}$", RegexOptions.Compiled);
    private static readonly Regex ArtworkId = new("^art_([0-9]{1,10})$", RegexOptions.Compiled);

    /// <summary>Never throws: anything invalid becomes PayloadKind.None.</summary>
    public static StartPayload Parse(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw) || !Allowed.IsMatch(raw))
        {
            return new StartPayload(PayloadKind.None, null, null);
        }

        var m = ArtworkId.Match(raw);
        if (m.Success && int.TryParse(m.Groups[1].Value, out var id) && id > 0)
        {
            return new StartPayload(PayloadKind.Artwork, id, raw);
        }

        return raw switch
        {
            "mk" => new StartPayload(PayloadKind.Masterclass, null, raw),
            "interior" => new StartPayload(PayloadKind.Interior, null, raw),
            _ => new StartPayload(PayloadKind.Campaign, null, raw),
        };
    }
}
