using Microsoft.Extensions.DependencyInjection;

namespace MomSite.Infrastructure.TelegramBot;

public static class FunnelBotRegistration
{
    /// <summary>Registers the public funnel bot. It stays idle unless FUNNEL_BOT_TOKEN is set.</summary>
    public static IServiceCollection AddFunnelBot(this IServiceCollection services)
    {
        services.AddMemoryCache();
        services.AddHttpClient(TelegramBotClient.HttpClientName, c => c.Timeout = TimeSpan.FromSeconds(60));
        services.AddSingleton<IBotApiClient, TelegramBotClient>();
        services.AddSingleton<ILeadQuota>(sp =>
            new LeadQuota(sp.GetRequiredService<Microsoft.Extensions.Caching.Memory.IMemoryCache>()));
        services.AddSingleton<ChatSendGate>(_ => new ChatSendGate());
        services.AddHostedService<FunnelPollingService>();
        return services;
    }
}
