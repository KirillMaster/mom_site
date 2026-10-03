using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Time.Testing;
using MomSite.Infrastructure.TelegramBot;
using Xunit;

namespace MomSite.Tests.TelegramBot;

public class LeadQuotaTests
{
    private readonly FakeTimeProvider _time = new();
    private readonly LeadQuota _quota;

    public LeadQuotaTests()
    {
        _quota = new LeadQuota(new MemoryCache(new MemoryCacheOptions()), _time);
    }

    [Fact]
    public void ThreeLeads_Allowed_FourthRejected()
    {
        for (var i = 0; i < LeadQuota.Limit; i++)
        {
            Assert.True(_quota.TryReserve(1));
        }

        Assert.True(_quota.IsExceeded(1));
        Assert.False(_quota.TryReserve(1));
    }

    [Fact]
    public void Quota_IsPerUser()
    {
        for (var i = 0; i < LeadQuota.Limit; i++) _quota.TryReserve(1);
        Assert.False(_quota.IsExceeded(2));
    }

    [Fact]
    public void Quota_FreesUpAfter24Hours()
    {
        for (var i = 0; i < LeadQuota.Limit; i++) _quota.TryReserve(1);
        _time.Advance(TimeSpan.FromHours(24) + TimeSpan.FromSeconds(1));
        Assert.False(_quota.IsExceeded(1));
        Assert.True(_quota.TryReserve(1));
    }

    [Fact]
    public void IsExceeded_HasNoSideEffects()
    {
        for (var i = 0; i < 10; i++) _quota.IsExceeded(1);
        Assert.False(_quota.IsExceeded(1));
    }
}

public class ChatSendGateTests
{
    [Fact]
    public async Task SecondMessageToSameChat_WaitsOneSecond()
    {
        var time = new FakeTimeProvider();
        var waits = new List<TimeSpan>();
        var gate = new ChatSendGate(time, (d, _) => { waits.Add(d); return Task.CompletedTask; });

        await gate.WaitAsync(7, default);
        await gate.WaitAsync(7, default);
        await gate.WaitAsync(8, default);

        Assert.Single(waits);
        Assert.Equal(TimeSpan.FromSeconds(1), waits[0]);
    }
}
