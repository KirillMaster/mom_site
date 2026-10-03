using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using MomSite.Infrastructure.TelegramBot;
using Xunit;

namespace MomSite.Tests.TelegramBot;

[Collection("FunnelBotEnv")]
public class FunnelPollingDisabledTests
{
    [Fact]
    public async Task EmptyToken_ServiceExitsWithoutCallingApi()
    {
        var old = Environment.GetEnvironmentVariable("FUNNEL_BOT_TOKEN");
        Environment.SetEnvironmentVariable("FUNNEL_BOT_TOKEN", "");
        try
        {
            var api = new Mock<IBotApiClient>(MockBehavior.Strict);
            var cache = new MemoryCache(new MemoryCacheOptions());
            var svc = new FunnelPollingService(api.Object, cache, new LeadQuota(cache), new ChatSendGate(),
                Mock.Of<IServiceScopeFactory>(), NullLogger<FunnelPollingService>.Instance);

            await svc.StartAsync(default);
            await (svc.ExecuteTask ?? Task.CompletedTask);
            await svc.StopAsync(default);

            api.VerifyNoOtherCalls();
        }
        finally
        {
            Environment.SetEnvironmentVariable("FUNNEL_BOT_TOKEN", old);
        }
    }
}
