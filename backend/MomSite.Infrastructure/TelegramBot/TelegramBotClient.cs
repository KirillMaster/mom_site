using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Nodes;
using Microsoft.Extensions.Logging;

namespace MomSite.Infrastructure.TelegramBot;

/// <summary>
/// Thin Bot API client. The token lives only in the request URL and is never
/// logged: logs carry the method name and error code only.
/// </summary>
public sealed class TelegramBotClient : IBotApiClient
{
    public const string HttpClientName = "FunnelBot";
    private const int PollTimeoutSeconds = 50;

    private readonly IHttpClientFactory _factory;
    private readonly ILogger<TelegramBotClient> _logger;

    public TelegramBotClient(IHttpClientFactory factory, ILogger<TelegramBotClient> logger)
    {
        _factory = factory;
        _logger = logger;
    }

    public static string? Token => Environment.GetEnvironmentVariable("FUNNEL_BOT_TOKEN");

    public async Task<BotApiResult<IReadOnlyList<BotUpdate>>> GetUpdatesAsync(long offset, CancellationToken ct)
    {
        var body = new
        {
            offset,
            timeout = PollTimeoutSeconds,
            allowed_updates = new[] { "message", "callback_query" },
        };
        var result = await CallAsync("getUpdates", body, ct);
        if (!result.Ok)
        {
            return BotApiResult<IReadOnlyList<BotUpdate>>.Failure(result.ErrorCode, result.RetryAfterSeconds);
        }

        var updates = result.Value?.Deserialize<List<BotUpdate>>() ?? new List<BotUpdate>();
        return BotApiResult<IReadOnlyList<BotUpdate>>.Success(updates);
    }

    public async Task<BotApiResult<bool>> SendMessageAsync(long chatId, Reply reply, CancellationToken ct)
    {
        var payload = new JsonObject { ["chat_id"] = chatId, ["text"] = reply.Text };
        AddMarkup(payload, reply.Keyboard);
        return await CallBoolAsync("sendMessage", payload, ct);
    }

    public async Task<BotApiResult<bool>> SendPhotoAsync(
        long chatId, string photoUrl, string caption, Keyboard? keyboard, CancellationToken ct)
    {
        var payload = new JsonObject { ["chat_id"] = chatId, ["photo"] = photoUrl, ["caption"] = caption };
        AddMarkup(payload, keyboard);
        return await CallBoolAsync("sendPhoto", payload, ct);
    }

    public Task<BotApiResult<bool>> AnswerCallbackQueryAsync(string callbackQueryId, CancellationToken ct) =>
        CallBoolAsync("answerCallbackQuery", new JsonObject { ["callback_query_id"] = callbackQueryId }, ct);

    private async Task<BotApiResult<bool>> CallBoolAsync(string method, object body, CancellationToken ct)
    {
        var result = await CallAsync(method, body, ct);
        return result.Ok ? BotApiResult<bool>.Success(true) : BotApiResult<bool>.Failure(result.ErrorCode, result.RetryAfterSeconds);
    }

    private async Task<BotApiResult<JsonElement?>> CallAsync(string method, object body, CancellationToken ct)
    {
        var token = Token;
        if (string.IsNullOrWhiteSpace(token))
        {
            return BotApiResult<JsonElement?>.Failure(0);
        }

        try
        {
            var client = _factory.CreateClient(HttpClientName);
            using var response = await client.PostAsJsonAsync($"https://api.telegram.org/bot{token}/{method}", body, ct);
            var json = await response.Content.ReadFromJsonAsync<JsonElement>(cancellationToken: ct);
            if (response.IsSuccessStatusCode && json.TryGetProperty("result", out var value))
            {
                return BotApiResult<JsonElement?>.Success(value.Clone());
            }

            var retry = json.TryGetProperty("parameters", out var p) && p.TryGetProperty("retry_after", out var r)
                ? r.GetInt32() : 0;
            _logger.LogWarning("Bot API {Method} failed with {ErrorCode}", method, (int)response.StatusCode);
            return BotApiResult<JsonElement?>.Failure((int)response.StatusCode, retry);
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception ex)
        {
            // Type only: the message of HttpRequestException can contain the request URL with the token.
            _logger.LogWarning("Bot API {Method} network error ({ErrorType})", method, ex.GetType().Name);
            return BotApiResult<JsonElement?>.Failure(-1);
        }
    }

    private static void AddMarkup(JsonObject payload, Keyboard? keyboard)
    {
        if (keyboard is null)
        {
            return;
        }

        if (keyboard.Kind == KeyboardKind.Remove)
        {
            payload["reply_markup"] = new JsonObject { ["remove_keyboard"] = true };
            return;
        }

        var rows = new JsonArray();
        foreach (var row in keyboard.Rows)
        {
            var buttons = new JsonArray();
            foreach (var b in row)
            {
                var node = new JsonObject { ["text"] = b.Text };
                if (b.Data is not null) node["callback_data"] = b.Data;
                if (b.Url is not null) node["url"] = b.Url;
                if (b.RequestContact) node["request_contact"] = true;
                buttons.Add(node);
            }

            rows.Add(buttons);
        }

        payload["reply_markup"] = keyboard.Kind == KeyboardKind.Inline
            ? new JsonObject { ["inline_keyboard"] = rows }
            : new JsonObject { ["keyboard"] = rows, ["resize_keyboard"] = true, ["one_time_keyboard"] = true };
    }
}
