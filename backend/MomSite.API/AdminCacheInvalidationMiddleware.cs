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

        try
        {
            var invalidator = context.RequestServices.GetRequiredService<ICacheInvalidator>();
            _ = Task.Run(async () =>
            {
                try
                {
                    await invalidator.InvalidateAsync();
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Cache invalidation failed");
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Cache invalidation could not be started");
        }
    }

    private static bool ShouldInvalidate(HttpContext context)
    {
        var request = context.Request;
        if (!(HttpMethods.IsPost(request.Method) || HttpMethods.IsPut(request.Method)
              || HttpMethods.IsPatch(request.Method) || HttpMethods.IsDelete(request.Method)))
            return false;

        var path = request.Path;
        if (!path.StartsWithSegments(AdminPrefix, StringComparison.OrdinalIgnoreCase)) return false;
        if (path.StartsWithSegments(LoginPath, StringComparison.OrdinalIgnoreCase)) return false;

        var status = context.Response.StatusCode;
        return status >= 200 && status < 300;
    }
}
