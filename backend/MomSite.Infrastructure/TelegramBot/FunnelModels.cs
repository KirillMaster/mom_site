using MomSite.Core.Models;

namespace MomSite.Infrastructure.TelegramBot;

public enum FunnelStep { Goal, Detail, Theme, Budget, Contact, Name, Done }

public enum FunnelGoal { Buy, Interior, Commission, Masterclass, Other }

public sealed record ArtworkInfo(int Id, string Title, string ThumbnailPath);

public enum PayloadKind { None, Artwork, Masterclass, Interior, Campaign }

public sealed record StartPayload(PayloadKind Kind, int? ArtworkId, string? Raw);

public sealed record FunnelState(
    FunnelStep Step,
    IReadOnlyList<FunnelStep> History,
    FunnelGoal? Goal = null,
    string? Detail = null,
    string? Theme = null,
    string? Budget = null,
    string? Phone = null,
    string? Name = null,
    StartPayload? Payload = null,
    ArtworkInfo? Artwork = null);

public sealed record FunnelContext(BotUser User, ArtworkInfo? Artwork = null, bool QuotaExceeded = false);

/// <summary>One button. Data is callback_data (inline) or null for reply-keyboard buttons.</summary>
public sealed record Button(string Text, string? Data = null, bool RequestContact = false, string? Url = null);

public enum KeyboardKind { Inline, Reply, Remove }

public sealed record Keyboard(KeyboardKind Kind, IReadOnlyList<IReadOnlyList<Button>> Rows)
{
    public static Keyboard Remove { get; } = new(KeyboardKind.Remove, Array.Empty<IReadOnlyList<Button>>());
}

public sealed record Reply(string Text, string? PhotoUrl = null, Keyboard? Keyboard = null);

public abstract record BotInput;

public sealed record StartInput(string? Payload) : BotInput;

public sealed record CancelInput : BotInput;

public sealed record CallbackInput(string Data) : BotInput;

public sealed record TextInput(string Text) : BotInput;

public sealed record ContactInput(string Phone) : BotInput;

public sealed record UnsupportedInput : BotInput;

/// <summary>State is null after a reset or a finished lead.</summary>
public sealed record FunnelResult(FunnelState? State, IReadOnlyList<Reply> Replies, ContactMessage? Lead = null);
