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
    private static readonly TimeSpan SendTimeout = TimeSpan.FromSeconds(10);

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
        using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        cts.CancelAfter(SendTimeout);

        var text =
            $"Новое сообщение с сайта\n" +
            $"Имя: {message.Name}\n" +
            $"Email: {message.Email}\n" +
            $"Тема: {message.Subject}\n\n" +
            $"{message.Message}";

        var client = _httpClientFactory.CreateClient(nameof(TelegramNotifier));
        var token = BotToken;

        foreach (var chatId in ChatIds)
        {
            var url = $"https://api.telegram.org/bot{token}/sendMessage";
            var response = await client.PostAsJsonAsync(url, new { chat_id = chatId, text }, cts.Token);

            if (!response.IsSuccessStatusCode)
            {
                var body = await response.Content.ReadAsStringAsync(cts.Token);
                throw new InvalidOperationException(
                    $"Telegram sendMessage to chat {chatId} failed with {(int)response.StatusCode}: {body}");
            }
        }

        _logger.LogInformation("Contact message notification sent to Telegram chats {ChatIds}", string.Join(",", ChatIds));
    }
}
