namespace MomSite.Infrastructure.TelegramBot;

/// <summary>Subset of the Telegram Bot API used by the funnel bot.</summary>
public interface IBotApiClient
{
    Task<BotApiResult<IReadOnlyList<BotUpdate>>> GetUpdatesAsync(long offset, CancellationToken ct);

    Task<BotApiResult<bool>> SendMessageAsync(long chatId, Reply reply, CancellationToken ct);

    Task<BotApiResult<bool>> SendPhotoAsync(long chatId, string photoUrl, string caption, Keyboard? keyboard, CancellationToken ct);

    Task<BotApiResult<bool>> AnswerCallbackQueryAsync(string callbackQueryId, CancellationToken ct);
}
