using MomSite.Core.Interfaces;

namespace MomSite.API;

/// <summary>
/// After a successful mutating /api/admin request (except login), triggers
/// frontend cache invalidation fire-and-forget.
/// </summary>
public class AdminCacheInvalidationMiddleware
{
    private const string AdminPrefix = "/api/admin";
    private const string LoginPath = "/api/admin/login";

    private readonly RequestDelegate _next;
    private readonly ILogger<AdminCacheInvalidationMiddleware> _logger;

    public AdminCacheInvalidationMiddleware(RequestDelegate next, ILogger<AdminCacheInvalidationMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        await _next(context);

        if (!ShouldInvalidate(context)) return;

        TryStartInvalidation(context);
    }

    private void TryStartInvalidation(HttpContext context)
    {
        try
        {
            var invalidator = context.RequestServices.GetRequiredService<ICacheInvalidator>();
            _ = Task.Run(() => InvalidateSafelyAsync(invalidator));
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Cache invalidation could not be started");
        }
    }

    private async Task InvalidateSafelyAsync(ICacheInvalidator invalidator)
    {
        try
        {
            await invalidator.InvalidateAsync();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Cache invalidation failed");
        }
    }

    private static bool ShouldInvalidate(HttpContext context)
    {
        var request = context.Request;
        return IsMutating(request.Method)
            && IsInvalidatingAdminPath(request.Path)
            && IsSuccess(context.Response.StatusCode);
    }

    private static bool IsMutating(string method) =>
        HttpMethods.IsPost(method) || HttpMethods.IsPut(method)
        || HttpMethods.IsPatch(method) || HttpMethods.IsDelete(method);

    private static bool IsInvalidatingAdminPath(PathString path) =>
        path.StartsWithSegments(AdminPrefix, StringComparison.OrdinalIgnoreCase)
        && !path.StartsWithSegments(LoginPath, StringComparison.OrdinalIgnoreCase);

    private static bool IsSuccess(int status) => status >= 200 && status < 300;
}
