using MomSite.Core.Models;

namespace MomSite.Core.Interfaces;

public sealed record LeadSubmitResult(int Id, int NotifiedChannels);

/// <summary>
/// Single delivery path for leads (site form and Telegram bot): persist first,
/// then notify every enabled channel. Persistence errors propagate; notifier
/// errors are logged and never lose the lead.
/// </summary>
public interface ILeadService
{
    Task<LeadSubmitResult> SubmitAsync(ContactMessage message, CancellationToken ct = default);
}
