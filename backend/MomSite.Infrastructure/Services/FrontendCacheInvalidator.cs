using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using MomSite.Core.Interfaces;

namespace MomSite.Infrastructure.Services;

/// <summary>
/// Asks the Next.js frontend to drop its SSR cache. Never throws: failures
/// are only logged so admin writes are not affected.
/// </summary>
public class FrontendCacheInvalidator : ICacheInvalidator
{
    public const string SecretHeader = "X-Revalidate-Secret";
    private static readonly TimeSpan DefaultTimeout = TimeSpan.FromSeconds(5);

    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<FrontendCacheInvalidator> _logger;
    private readonly TimeSpan _timeout;

    [ActivatorUtilitiesConstructor]
    public FrontendCacheInvalidator(
        HttpClient httpClient,
        IConfiguration configuration,
        ILogger<FrontendCacheInvalidator> logger)
        : this(httpClient, configuration, logger, DefaultTimeout)
    {
    }

    public FrontendCacheInvalidator(
        HttpClient httpClient,
        IConfiguration configuration,
        ILogger<FrontendCacheInvalidator> logger,
        TimeSpan timeout)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _logger = logger;
        _timeout = timeout;
    }

    public async Task InvalidateAsync(CancellationToken cancellationToken = default)
    {
        var url = _configuration["Frontend:RevalidateUrl"];
        var secret = _configuration["Frontend:RevalidateSecret"];
        if (string.IsNullOrWhiteSpace(url) || string.IsNullOrWhiteSpace(secret))
        {
            _logger.LogInformation("Frontend cache invalidation skipped: Frontend:RevalidateUrl/RevalidateSecret not configured");
            return;
        }

        try
        {
            using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            cts.CancelAfter(_timeout);
            using var request = new HttpRequestMessage(HttpMethod.Post, url);
            request.Headers.TryAddWithoutValidation(SecretHeader, secret);
            using var response = await _httpClient.SendAsync(request, cts.Token);
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Frontend cache invalidation failed with status {StatusCode}", (int)response.StatusCode);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Frontend cache invalidation failed");
        }
    }
}
