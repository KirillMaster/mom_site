using MomSite.Core.Models;

namespace MomSite.Infrastructure.Notifications;

/// <summary>
/// Describes where a lead came from. Both notification channels say it, because
/// the owner answers a visitor from a paid campaign differently from one who
/// typed the address by hand.
/// </summary>
public static class LeadSource
{
    public static string Dash(string? value) => string.IsNullOrWhiteSpace(value) ? "—" : value;

    public const string BotSource = "telegram_bot";

    public static bool IsBotLead(ContactMessage message) => message.UtmSource == BotSource;

    /// <summary>"@username", else a tg://user link by id, else null.</summary>
    public static string? TelegramContact(ContactMessage message)
    {
        if (!string.IsNullOrWhiteSpace(message.TelegramUsername))
        {
            return "@" + message.TelegramUsername.TrimStart('@');
        }

        return message.TelegramUserId is long id ? $"tg://user?id={id}" : null;
    }

    public static string Describe(ContactMessage message)
    {
        var parts = new[] { message.UtmSource, message.UtmMedium, message.UtmCampaign }
            .Where(part => !string.IsNullOrWhiteSpace(part))
            .ToArray();

        return parts.Length > 0 ? string.Join(" / ", parts) : "прямой заход";
    }
}
