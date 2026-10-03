using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using MomSite.Core.Interfaces;
using MomSite.Core.Models;
using MomSite.Infrastructure.Data;
using MomSite.Infrastructure.Services;

namespace MomSite.Tests.TelegramBot;

public class LeadServiceTests
{
    private static ApplicationDbContext NewDb() =>
        new(new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);

    private sealed class FailingDb : ApplicationDbContext
    {
        public FailingDb() : base(new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options) { }

        public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default) =>
            throw new DbUpdateException("db");
    }

    private static ContactMessage Lead() =>
        new() { Name = "A", Subject = "S", Message = "M", Phone = "+7 900 000-00-00" };

    private static Mock<IFeedbackNotifier> Notifier(bool enabled)
    {
        var m = new Mock<IFeedbackNotifier>();
        m.SetupGet(n => n.IsEnabled).Returns(enabled);
        return m;
    }

    [Fact]
    public async Task FailingNotifier_DoesNotLoseLead_AndOthersStillCalled()
    {
        using var db = NewDb();
        var bad = Notifier(true);
        bad.Setup(n => n.NotifyAsync(It.IsAny<ContactMessage>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("boom"));
        var good = Notifier(true);
        var svc = new LeadService(db, new[] { bad.Object, good.Object }, Mock.Of<ILogger<LeadService>>());

        var result = await svc.SubmitAsync(Lead());

        Assert.Equal(1, await db.ContactMessages.CountAsync());
        Assert.Equal(1, result.NotifiedChannels);
        good.Verify(n => n.NotifyAsync(It.IsAny<ContactMessage>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task DisabledNotifier_IsNotCalled()
    {
        using var db = NewDb();
        var on = Notifier(true);
        var off = Notifier(false);
        var svc = new LeadService(db, new[] { on.Object, off.Object }, Mock.Of<ILogger<LeadService>>());

        await svc.SubmitAsync(Lead());

        on.Verify(n => n.NotifyAsync(It.IsAny<ContactMessage>(), It.IsAny<CancellationToken>()), Times.Once);
        off.Verify(n => n.NotifyAsync(It.IsAny<ContactMessage>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task PersistFailure_Propagates_AndNotifierNotCalled()
    {
        using var db = new FailingDb();
        var n = Notifier(true);
        var svc = new LeadService(db, new[] { n.Object }, Mock.Of<ILogger<LeadService>>());

        await Assert.ThrowsAsync<DbUpdateException>(() => svc.SubmitAsync(Lead()));

        n.Verify(x => x.NotifyAsync(It.IsAny<ContactMessage>(), It.IsAny<CancellationToken>()), Times.Never);
    }
}
