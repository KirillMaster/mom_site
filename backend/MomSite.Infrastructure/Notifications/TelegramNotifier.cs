using System.Net.Http;
using System.Net.Http.Json;
using Microsoft.Extensions.Http;
using Microsoft.Extensions.Logging;
using MomSite.Core.Interfaces;
using MomSite.Core.Models;

namespace MomSite.Infrastructure.Notifications;

/// <summary>
/// Sends a new-contact-message notification via the Telegram Bot API
/// (sendMessage). Enabled only when TELEGRAM_BOT_TOKEN and
/// TELEGRAM_CHAT_IDS (comma-separated) are configured. A failure (invalid
/// token/chat id, network error, non-OK response) throws and is left for
/// the caller to catch and log.
/// </summary>
public class TelegramNotifier : IFeedbackNotifier
{
    // Telegram is reachable from the VPS only intermittently (some connects
    // hang), so each chat gets several short attempts instead of one long one.
    public const int MaxAttempts = 4;
    private static readonly TimeSpan AttemptTimeout = TimeSpan.FromSeconds(6);

    public TimeSpan RetryDelay { get; init; } = TimeSpan.FromSeconds(1);

    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<TelegramNotifier> _logger;

    public TelegramNotifier(IHttpClientFactory httpClientFactory, ILogger<TelegramNotifier> logger)
    {
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    private static string? BotToken => Environment.GetEnvironmentVariable("TELEGRAM_BOT_TOKEN");

    private static IReadOnlyList<string> ChatIds =>
        (Environment.GetEnvironmentVariable("TELEGRAM_CHAT_IDS") ?? string.Empty)
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

    public bool IsEnabled => !string.IsNullOrWhiteSpace(BotToken) && ChatIds.Count > 0;

    public async Task NotifyAsync(ContactMessage message, CancellationToken cancellationToken = default)
    {
        await SendToAllChatsAsync(BuildText(message), cancellationToken);
        _logger.LogInformation("Contact message notification sent to Telegram chats {ChatIds}", string.Join(",", ChatIds));
    }

    public async Task NotifyAsync(Review review, CancellationToken cancellationToken = default)
    {
        await SendToAllChatsAsync(BuildReviewText(review), cancellationToken);
        _logger.LogInformation("New review notification sent to Telegram chats {ChatIds}", string.Join(",", ChatIds));
    }

    private async Task SendToAllChatsAsync(string text, CancellationToken cancellationToken)
    {
        var client = _httpClientFactory.CreateClient(nameof(TelegramNotifier));
        var url = $"https://api.telegram.org/bot{BotToken}/sendMessage";

        await Task.WhenAll(ChatIds.Select(chatId =>
            SendWithRetryAsync(client, url, new { chat_id = chatId, text }, chatId, cancellationToken)));
    }

    private async Task SendWithRetryAsync(HttpClient client, string url, object payload, string chatId, CancellationToken cancellationToken)
    {
        for (var attempt = 1; ; attempt++)
        {
            using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            cts.CancelAfter(AttemptTimeout);

            try
            {
                using var response = await client.PostAsJsonAsync(url, payload, cts.Token);
                if (response.IsSuccessStatusCode)
                {
                    return;
                }

                var status = (int)response.StatusCode;
                if ((status < 500 && status != 429) || attempt >= MaxAttempts)
                {
                    var body = await response.Content.ReadAsStringAsync(cancellationToken);
                    throw new InvalidOperationException(
                        $"Telegram sendMessage to chat {chatId} failed with {status}: {body}");
                }
            }
            catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException
                                       && !cancellationToken.IsCancellationRequested
                                       && attempt < MaxAttempts)
            {
                _logger.LogWarning("Telegram sendMessage to chat {ChatId} attempt {Attempt} failed: {Error}",
                    chatId, attempt, ex.GetType().Name);
            }

            await Task.Delay(RetryDelay, cancellationToken);
        }
    }

    /// <summary>
    /// Builds the notification body for a newly submitted (still
    /// unpublished) review, so the owner can moderate it.
    /// </summary>
    public static string BuildReviewText(Review review)
    {
        var lines = new List<string>
        {
            "Новый отзыв на сайте (ожидает модерации)",
            $"Автор: {review.AuthorName}",
            $"Оценка: {review.Rating}/5",
        };

        if (!string.IsNullOrWhiteSpace(review.AuthorCity))
        {
            lines.Add($"Город: {review.AuthorCity}");
        }

        lines.Add(string.Empty);
        lines.Add(review.Text);

        return string.Join("\n", lines);
    }

    /// <summary>
    /// Builds the notification body. The campaign that brought the visitor is
    /// part of it because the owner acts on a lead differently depending on
    /// where it came from, and the site's whole point is selling paintings.
    /// </summary>
    public static string BuildText(ContactMessage message)
    {
        if (LeadSource.IsBotLead(message))
        {
            return BuildBotText(message);
        }

        var lines = new List<string>
        {
            "Новое сообщение с сайта",
            $"Имя: {message.Name}",
            $"Email: {LeadSource.Dash(message.Email)}",
            $"Телефон/мессенджер: {LeadSource.Dash(message.Phone)}",
            $"Тема: {message.Subject}",
        };

        lines.Add($"Источник: {LeadSource.Describe(message)}");

        lines.Add(string.Empty);
        lines.Add(message.Message);

        return string.Join("\n", lines);
    }

    private static string BuildBotText(ContactMessage message)
    {
        var lines = new List<string>
        {
            "Новая заявка из Telegram-бота",
            $"Имя: {message.Name}",
        };

        if (!string.IsNullOrWhiteSpace(message.Email))
        {
            lines.Add($"Email: {message.Email}");
        }

        if (!string.IsNullOrWhiteSpace(message.Phone))
        {
            lines.Add($"Телефон: {message.Phone}");
        }

        var tg = LeadSource.TelegramContact(message);
        if (tg is not null)
        {
            lines.Add($"Telegram: {tg}");
        }

        lines.Add($"Тема: {message.Subject}");
        lines.Add($"Источник: {LeadSource.Describe(message)}");
        lines.Add(string.Empty);
        lines.Add(message.Message);

        return string.Join("\n", lines);
    }
}
