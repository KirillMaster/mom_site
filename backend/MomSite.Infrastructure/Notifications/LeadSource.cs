using MomSite.Core.Models;

namespace MomSite.Infrastructure.Notifications;

/// <summary>
/// Describes where a lead came from. Both notification channels say it, because
/// the owner answers a visitor from a paid campaign differently from one who
/// typed the address by hand.
/// </summary>
public static class LeadSource
{
    public static string Describe(ContactMessage message)
    {
        var parts = new[] { message.UtmSource, message.UtmMedium, message.UtmCampaign }
            .Where(part => !string.IsNullOrWhiteSpace(part))
            .ToArray();

        return parts.Length > 0 ? string.Join(" / ", parts) : "прямой заход";
    }
}
