namespace MomSite.Core.Interfaces;

/// <summary>
/// Per-key (typically client IP) request rate limiting for the public
/// contact form endpoint. Implementations must be safe to call from
/// multiple concurrent requests.
/// </summary>
public interface IContactRateLimiter
{
    /// <summary>
    /// Attempts to consume one permit for <paramref name="clientKey"/>.
    /// Returns true when the request is allowed to proceed, false when the
    /// caller has exceeded the configured limit for the current window.
    /// </summary>
    bool TryAcquire(string clientKey);
}
