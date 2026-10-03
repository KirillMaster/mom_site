using Microsoft.Extensions.Caching.Memory;

namespace MomSite.Infrastructure.TelegramBot;

public interface ILeadQuota
{
    /// <summary>True when the user has already used up the daily allowance (no side effects).</summary>
    bool IsExceeded(long userId);

    /// <summary>Records one lead; false (and nothing recorded) when the allowance is used up.</summary>
    bool TryReserve(long userId);
}

/// <summary>Sliding 24 h window, at most <see cref="Limit"/> leads per Telegram user.</summary>
public sealed class LeadQuota : ILeadQuota
{
    public const int Limit = 3;
    private static readonly TimeSpan Window = TimeSpan.FromHours(24);

    private readonly IMemoryCache _cache;
    private readonly TimeProvider _time;
    private readonly object _gate = new();

    public LeadQuota(IMemoryCache cache, TimeProvider? time = null)
    {
        _cache = cache;
        _time = time ?? TimeProvider.System;
    }

    public bool IsExceeded(long userId)
    {
        lock (_gate)
        {
            return Recent(userId).Count >= Limit;
        }
    }

    public bool TryReserve(long userId)
    {
        lock (_gate)
        {
            var recent = Recent(userId);
            if (recent.Count >= Limit)
            {
                return false;
            }

            recent.Add(_time.GetUtcNow());
            _cache.Set(Key(userId), recent, Window);
            return true;
        }
    }

    private static string Key(long userId) => $"quota:{userId}";

    private List<DateTimeOffset> Recent(long userId)
    {
        var cutoff = _time.GetUtcNow() - Window;
        var all = _cache.TryGetValue(Key(userId), out List<DateTimeOffset>? list) && list is not null
            ? list
            : new List<DateTimeOffset>();
        return all.Where(t => t > cutoff).ToList();
    }
}
