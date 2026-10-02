namespace MomSite.Core.Interfaces;

public enum IndexNowOutcome
{
    Sent,
    DisabledNoKey,
    Failed
}

/// <summary>Сообщает поисковикам (Яндекс через IndexNow) об изменённых адресах. Никогда не бросает исключений.</summary>
public interface IIndexNowClient
{
    Task<IndexNowOutcome> NotifyAsync(IReadOnlyCollection<string> urls, CancellationToken cancellationToken = default);
}
