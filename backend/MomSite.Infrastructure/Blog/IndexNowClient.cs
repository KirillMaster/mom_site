using System.Net.Http.Json;
using Microsoft.Extensions.Logging;
using MomSite.Core.Interfaces;

namespace MomSite.Infrastructure.Blog;

/// <summary>
/// IndexNow: POST списка адресов в Яндекс. Без INDEXNOW_KEY — ничего не делает.
/// Сбой сервиса только логируется: публикация статьи от него не зависит.
/// </summary>
public class IndexNowClient : IIndexNowClient
{
    public const string HttpClientName = "IndexNow";
    public const string SiteUrl = "https://angelamoiseenko.ru";
    private const string Endpoint = "https://yandex.com/indexnow";
    private static readonly TimeSpan SendTimeout = TimeSpan.FromSeconds(10);

    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<IndexNowClient> _logger;
    private readonly Func<string?> _key;

    public IndexNowClient(IHttpClientFactory httpClientFactory, ILogger<IndexNowClient> logger)
        : this(httpClientFactory, logger, () => Environment.GetEnvironmentVariable("INDEXNOW_KEY")) { }

    public IndexNowClient(IHttpClientFactory httpClientFactory, ILogger<IndexNowClient> logger, Func<string?> key)
    {
        _httpClientFactory = httpClientFactory;
        _logger = logger;
        _key = key;
    }

    public async Task<IndexNowOutcome> NotifyAsync(IReadOnlyCollection<string> urls, CancellationToken cancellationToken = default)
    {
        var key = _key();
        if (string.IsNullOrWhiteSpace(key) || urls.Count == 0) return IndexNowOutcome.DisabledNoKey;

        try
        {
            using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            cts.CancelAfter(SendTimeout);
            var response = await _httpClientFactory.CreateClient(HttpClientName).PostAsJsonAsync(Endpoint, new
            {
                host = new Uri(SiteUrl).Host,
                key,
                keyLocation = $"{SiteUrl}/indexnow-key.txt",
                urlList = urls
            }, cts.Token);
            if (response.IsSuccessStatusCode) return IndexNowOutcome.Sent;
            _logger.LogWarning("IndexNow returned {Status} for {Urls}", (int)response.StatusCode, string.Join(", ", urls));
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "IndexNow request failed for {Urls}", string.Join(", ", urls));
        }
        return IndexNowOutcome.Failed;
    }

    public static IReadOnlyCollection<string> BlogUrls(string postSlug, string categorySlug) => new[]
    {
        $"{SiteUrl}/blog/{postSlug}",
        $"{SiteUrl}/blog/category/{categorySlug}",
        $"{SiteUrl}/blog"
    };
}
