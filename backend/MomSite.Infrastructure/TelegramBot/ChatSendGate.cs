using System.Collections.Concurrent;

namespace MomSite.Infrastructure.TelegramBot;

/// <summary>Spaces outgoing messages to one chat at least <see cref="Interval"/> apart.</summary>
public sealed class ChatSendGate
{
    public static readonly TimeSpan Interval = TimeSpan.FromSeconds(1);

    private readonly TimeProvider _time;
    private readonly Func<TimeSpan, CancellationToken, Task> _delay;
    private readonly ConcurrentDictionary<long, DateTimeOffset> _next = new();

    public ChatSendGate(TimeProvider? time = null, Func<TimeSpan, CancellationToken, Task>? delay = null)
    {
        _time = time ?? TimeProvider.System;
        _delay = delay ?? Task.Delay;
    }

    public async Task WaitAsync(long chatId, CancellationToken ct)
    {
        TimeSpan wait;
        lock (_next)
        {
            var now = _time.GetUtcNow();
            var slot = _next.TryGetValue(chatId, out var planned) && planned > now ? planned : now;
            _next[chatId] = slot + Interval;
            wait = slot - now;
        }

        if (wait > TimeSpan.Zero)
        {
            await _delay(wait, ct);
        }
    }
}
