using MomSite.Core.Models;
using MomSite.Infrastructure.Notifications;

namespace MomSite.Infrastructure.TelegramBot;

/// <summary>Turns a finished funnel into the ContactMessage that ILeadService stores and sends.</summary>
public static class FunnelLeadBuilder
{
    public static string ArtworkUrl(ArtworkInfo a) => $"{FunnelTexts.SiteUrl}/gallery/artwork-{a.Id}";

    public static ContactMessage Build(FunnelState s, BotUser user)
    {
        var goal = s.Goal ?? FunnelGoal.Other;
        var lines = new List<string>();
        Add(lines, goal == FunnelGoal.Masterclass ? "Формат" : "Размер", s.Detail);
        Add(lines, goal == FunnelGoal.Other ? "Вопрос" : "Тема", s.Theme);
        Add(lines, "Бюджет", s.Budget);
        if (s.Artwork is not null)
        {
            lines.Add($"Работа: {s.Artwork.Title} {ArtworkUrl(s.Artwork)}");
        }

        return Create(s.Name, user, s.Phone, FunnelTexts.GoalLabel(goal), lines, s.Payload?.Raw);
    }

    /// <summary>A lead from free text sent outside any scenario.</summary>
    public static ContactMessage FromFreeText(string text, BotUser user, string? campaign = null) =>
        Create(null, user, null, FunnelTexts.GoalLabel(FunnelGoal.Other), new List<string> { "Вопрос: " + text }, campaign);

    private static ContactMessage Create(
        string? name, BotUser user, string? phone, string goal, List<string> lines, string? campaign) => new()
    {
        Name = Trim(string.IsNullOrWhiteSpace(name) ? user.FirstName ?? "Клиент из Telegram" : name, 200),
        Email = null,
        Phone = Trim(phone, 100),
        TelegramUsername = Trim(user.Username, 64),
        TelegramUserId = user.Id,
        Subject = Trim("Telegram-бот: " + goal, 200)!,
        Message = Trim(string.Join("\n", lines), 5000)!,
        UtmSource = LeadSource.BotSource,
        UtmCampaign = Trim(campaign, 100),
    };

    private static void Add(List<string> lines, string label, string? value)
    {
        if (!string.IsNullOrWhiteSpace(value))
        {
            lines.Add($"{label}: {value}");
        }
    }

    private static string? Trim(string? value, int max) =>
        value is null ? null : value.Length <= max ? value : value[..max];
}
