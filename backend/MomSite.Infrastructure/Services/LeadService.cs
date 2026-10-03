using Microsoft.Extensions.Logging;
using MomSite.Core.Interfaces;
using MomSite.Core.Models;
using MomSite.Infrastructure.Data;

namespace MomSite.Infrastructure.Services;

public class LeadService : ILeadService
{
    private readonly ApplicationDbContext _context;
    private readonly IEnumerable<IFeedbackNotifier> _notifiers;
    private readonly ILogger<LeadService> _logger;

    public LeadService(
        ApplicationDbContext context,
        IEnumerable<IFeedbackNotifier> notifiers,
        ILogger<LeadService> logger)
    {
        _context = context;
        _notifiers = notifiers;
        _logger = logger;
    }

    public async Task<LeadSubmitResult> SubmitAsync(ContactMessage message, CancellationToken ct = default)
    {
        _context.ContactMessages.Add(message);
        await _context.SaveChangesAsync(ct);

        var notified = 0;
        foreach (var notifier in _notifiers)
        {
            if (!notifier.IsEnabled)
            {
                continue;
            }

            try
            {
                await notifier.NotifyAsync(message, ct);
                notified++;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Notifier {Notifier} failed to deliver contact message {Id}",
                    notifier.GetType().Name, message.Id);
            }
        }

        return new LeadSubmitResult(message.Id, notified);
    }
}
