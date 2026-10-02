namespace MomSite.Core.Interfaces;

public interface ICacheInvalidator
{
    Task InvalidateAsync(CancellationToken cancellationToken = default);
}
