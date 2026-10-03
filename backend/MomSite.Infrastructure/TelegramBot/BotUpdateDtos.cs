using System.Text.Json.Serialization;

namespace MomSite.Infrastructure.TelegramBot;

public sealed record BotChat
{
    [JsonPropertyName("id")] public long Id { get; init; }
    [JsonPropertyName("type")] public string Type { get; init; } = string.Empty;
}

public sealed record BotUser
{
    [JsonPropertyName("id")] public long Id { get; init; }
    [JsonPropertyName("username")] public string? Username { get; init; }
    [JsonPropertyName("first_name")] public string? FirstName { get; init; }
}

public sealed record BotContact
{
    [JsonPropertyName("phone_number")] public string? PhoneNumber { get; init; }
}

public sealed record BotMessage
{
    [JsonPropertyName("chat")] public BotChat? Chat { get; init; }
    [JsonPropertyName("from")] public BotUser? From { get; init; }
    [JsonPropertyName("text")] public string? Text { get; init; }
    [JsonPropertyName("contact")] public BotContact? Contact { get; init; }
}

public sealed record BotCallbackQuery
{
    [JsonPropertyName("id")] public string Id { get; init; } = string.Empty;
    [JsonPropertyName("from")] public BotUser? From { get; init; }
    [JsonPropertyName("data")] public string? Data { get; init; }
    [JsonPropertyName("message")] public BotMessage? Message { get; init; }
}

public sealed record BotUpdate
{
    [JsonPropertyName("update_id")] public long UpdateId { get; init; }
    [JsonPropertyName("message")] public BotMessage? Message { get; init; }
    [JsonPropertyName("callback_query")] public BotCallbackQuery? CallbackQuery { get; init; }
}

/// <summary>Outcome of a Bot API call. Errors are values, never exceptions.</summary>
public sealed record BotApiResult<T>(bool Ok, T? Value, int ErrorCode = 0, int RetryAfterSeconds = 0)
{
    public static BotApiResult<T> Success(T value) => new(true, value);

    public static BotApiResult<T> Failure(int errorCode, int retryAfter = 0) =>
        new(false, default, errorCode, retryAfter);
}
