using MomSite.Core.Models;

namespace MomSite.Core.Interfaces;

/// <summary>
/// A notification channel (email, Telegram, ...) for newly received contact messages.
/// Implementations must be self-contained about whether they are configured
/// (<see cref="IsEnabled"/>) and must never let a channel failure propagate
/// as an exception that would surface as a 500 to the API caller.
/// </summary>
public interface IFeedbackNotifier
{
    /// <summary>
    /// True when this channel has the environment configuration it needs to
    /// attempt a send. When false, callers must not invoke <see cref="NotifyAsync"/>.
    /// </summary>
    bool IsEnabled { get; }

    /// <summary>
    /// Attempts to deliver a notification about <paramref name="message"/>.
    /// May throw on failure; callers are responsible for catching, logging,
    /// and not failing the request because of it.
    /// </summary>
    Task NotifyAsync(ContactMessage message, CancellationToken cancellationToken = default);

    /// <summary>
    /// Attempts to deliver a notification about a newly submitted, still
    /// unpublished <paramref name="review"/>. Same failure contract as
    /// <see cref="NotifyAsync(ContactMessage, CancellationToken)"/>. Channels
    /// that don't carry review notifications keep the default no-op: a review
    /// is not a lead that can be lost, and throwing here would put an error in
    /// the log for every single review just because e-mail doesn't relay them.
    /// </summary>
    Task NotifyAsync(Review review, CancellationToken cancellationToken = default) =>
        Task.CompletedTask;
}
