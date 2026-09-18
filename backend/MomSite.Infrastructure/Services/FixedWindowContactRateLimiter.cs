using System.Collections.Concurrent;
using MomSite.Core.Interfaces;

namespace MomSite.Infrastructure.Services;

/// <summary>
/// Configuration for <see cref="FixedWindowContactRateLimiter"/>. Bound from
/// the "ContactRateLimit" configuration section.
/// </summary>
public class ContactRateLimiterOptions
{
    /// <summary>Maximum number of requests allowed per client key per window.</summary>
    public int PermitLimit { get; set; } = 5;

    /// <summary>Length of the fixed window, in minutes.</summary>
    public int WindowMinutes { get; set; } = 10;
}

/// <summary>
/// Per-client fixed-window rate limiter analogous to ASP.NET Core's
/// FixedWindowLimiter, implemented directly against an injected
/// <see cref="TimeProvider"/> so tests can advance the clock deterministically
/// instead of waiting out the real window (see @S3-AS4).
/// </summary>
public class FixedWindowContactRateLimiter : IContactRateLimiter
{
    private sealed class WindowState
    {
        public DateTimeOffset WindowStart;
        public int Count;
    }

    private readonly ContactRateLimiterOptions _options;
    private readonly TimeProvider _timeProvider;
    private readonly ConcurrentDictionary<string, WindowState> _windows = new();

    public FixedWindowContactRateLimiter(ContactRateLimiterOptions options, TimeProvider timeProvider)
    {
        _options = options;
        _timeProvider = timeProvider;
    }

    public bool TryAcquire(string clientKey)
    {
        var now = _timeProvider.GetUtcNow();
        var window = TimeSpan.FromMinutes(_options.WindowMinutes);
        var state = _windows.GetOrAdd(clientKey, _ => new WindowState { WindowStart = now, Count = 0 });

        lock (state)
        {
            if (now - state.WindowStart >= window)
            {
                state.WindowStart = now;
                state.Count = 0;
            }

            if (state.Count >= _options.PermitLimit)
            {
                return false;
            }

            state.Count++;
            return true;
        }
    }
}
