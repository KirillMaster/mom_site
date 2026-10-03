namespace MomSite.Infrastructure.TelegramBot;

/// <summary>Maps a raw Telegram update to a funnel input. Returns null for updates the bot ignores.</summary>
public static class BotInputMapper
{
    public sealed record Mapped(long ChatId, BotUser User, BotInput Input, string? CallbackId = null);

    public static Mapped? Map(BotUpdate update)
    {
        if (update.CallbackQuery is { From: { } cbUser, Message.Chat: { Type: "private" } cbChat } cb)
        {
            return string.IsNullOrEmpty(cb.Data)
                ? null
                : new Mapped(cbChat.Id, cbUser, new CallbackInput(cb.Data), cb.Id);
        }

        if (update.Message is not { Chat: { Type: "private" } chat, From: { } user } msg)
        {
            return null;
        }

        return new Mapped(chat.Id, user, ToInput(msg));
    }

    private static BotInput ToInput(BotMessage msg)
    {
        if (!string.IsNullOrWhiteSpace(msg.Contact?.PhoneNumber))
        {
            return new ContactInput(msg.Contact!.PhoneNumber!);
        }

        var text = msg.Text?.Trim();
        if (string.IsNullOrEmpty(text))
        {
            return new UnsupportedInput();
        }

        var command = text.Split(' ', 2, StringSplitOptions.RemoveEmptyEntries);
        var name = command[0].Split('@')[0];
        return name switch
        {
            "/start" => new StartInput(command.Length > 1 ? command[1].Trim() : null),
            "/cancel" => new CancelInput(),
            _ => new TextInput(text),
        };
    }
}
