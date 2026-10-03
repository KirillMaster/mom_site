using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using MomSite.Core.Interfaces;
using MomSite.Core.Models;
using MomSite.Infrastructure.Data;
using MomSite.Infrastructure.Services;
using MomSite.Infrastructure.TelegramBot;
using Xunit;

namespace MomSite.Tests.TelegramBot;

public class FunnelEndToEndTests
{
    private sealed class FakeApi : IBotApiClient
    {
        public List<Reply> Sent { get; } = new();

        public Task<BotApiResult<IReadOnlyList<BotUpdate>>> GetUpdatesAsync(long offset, CancellationToken ct) =>
            Task.FromResult(BotApiResult<IReadOnlyList<BotUpdate>>.Success(Array.Empty<BotUpdate>()));

        public Task<BotApiResult<bool>> SendMessageAsync(long chatId, Reply reply, CancellationToken ct)
        {
            Sent.Add(reply);
            return Task.FromResult(BotApiResult<bool>.Success(true));
        }

        public Task<BotApiResult<bool>> SendPhotoAsync(long chatId, string photoUrl, string caption, Keyboard? keyboard, CancellationToken ct)
        {
            Sent.Add(new Reply(caption, photoUrl, keyboard));
            return Task.FromResult(BotApiResult<bool>.Success(true));
        }

        public Task<BotApiResult<bool>> AnswerCallbackQueryAsync(string callbackQueryId, CancellationToken ct) =>
            Task.FromResult(BotApiResult<bool>.Success(true));
    }

    private sealed class Rig
    {
        public FakeApi Api { get; } = new();
        public Mock<IFeedbackNotifier> Notifier { get; } = new();
        public ServiceProvider Provider { get; }
        public FunnelPollingService Service { get; }

        public Rig(bool failDb = false)
        {
            Notifier.SetupGet(n => n.IsEnabled).Returns(true);
            var dbName = Guid.NewGuid().ToString();
            var services = new ServiceCollection();
            services.AddDbContext<ApplicationDbContext>(o => o.UseInMemoryDatabase(dbName));
            services.AddSingleton(Notifier.Object);
            services.AddScoped<ILeadService>(sp => failDb
                ? new ThrowingLeadService()
                : new LeadService(sp.GetRequiredService<ApplicationDbContext>(),
                    sp.GetServices<IFeedbackNotifier>(), NullLogger<LeadService>.Instance));
            Provider = services.BuildServiceProvider();
            var cache = new MemoryCache(new MemoryOptions());
            Service = new FunnelPollingService(Api, cache, new LeadQuota(cache), new ChatSendGate(delay: (_, _) => Task.CompletedTask),
                Provider.GetRequiredService<IServiceScopeFactory>(), NullLogger<FunnelPollingService>.Instance);
        }

        public int LeadCount()
        {
            using var scope = Provider.CreateScope();
            return scope.ServiceProvider.GetRequiredService<ApplicationDbContext>().ContactMessages.Count();
        }

        public Task Msg(string text) => Service.ProcessAsync(Update(text, null), default);

        public Task Click(string data) => Service.ProcessAsync(Update(null, data), default);

        public Task Phone() => Service.ProcessAsync(new BotUpdate
        {
            UpdateId = 1,
            Message = new BotMessage
            {
                Chat = new BotChat { Id = 5, Type = "private" },
                From = new BotUser { Id = 5, Username = "anna", FirstName = "Anna" },
                Contact = new BotContact { PhoneNumber = "+79990001122" },
            },
        }, default);

        private static BotUpdate Update(string? text, string? data) => new()
        {
            UpdateId = 1,
            Message = data is null
                ? new BotMessage { Chat = new BotChat { Id = 5, Type = "private" }, From = new BotUser { Id = 5, Username = "anna", FirstName = "Anna" }, Text = text }
                : null,
            CallbackQuery = data is null ? null : new BotCallbackQuery
            {
                Id = "cb",
                Data = data,
                From = new BotUser { Id = 5, Username = "anna", FirstName = "Anna" },
                Message = new BotMessage { Chat = new BotChat { Id = 5, Type = "private" } },
            },
        };
    }

    private sealed class MemoryOptions : MemoryCacheOptions { }

    private sealed class ThrowingLeadService : ILeadService
    {
        public Task<LeadSubmitResult> SubmitAsync(ContactMessage message, CancellationToken ct = default) =>
            throw new DbUpdateException("db down");
    }

    private static async Task FullDialog(Rig rig)
    {
        await rig.Msg("/start");
        await rig.Click("g:buy");
        await rig.Click("b:1");
        await rig.Phone();
        await rig.Click("nok");
    }

    [Fact]
    public async Task FullDialog_SavesLead_AndNotifies()
    {
        var rig = new Rig();
        await FullDialog(rig);

        Assert.Equal(1, rig.LeadCount());
        rig.Notifier.Verify(n => n.NotifyAsync(It.Is<ContactMessage>(m => m.Phone == "+79990001122" && m.UtmSource == "telegram_bot"),
            It.IsAny<CancellationToken>()), Times.Once);
        Assert.Contains(rig.Api.Sent, r => r.Text == FunnelTexts.Thanks);
    }

    [Fact]
    public async Task NotifierFailure_StillSavesLead_AndThanksUser()
    {
        var rig = new Rig();
        rig.Notifier.Setup(n => n.NotifyAsync(It.IsAny<ContactMessage>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("smtp"));

        await FullDialog(rig);

        Assert.Equal(1, rig.LeadCount());
        Assert.Contains(rig.Api.Sent, r => r.Text == FunnelTexts.Thanks);
    }

    [Fact]
    public async Task DbFailure_AnswersTryLater_AndKeepsDialog()
    {
        var rig = new Rig(failDb: true);
        await FullDialog(rig);

        Assert.Equal(FunnelTexts.SaveFailed, rig.Api.Sent[^1].Text);
        Assert.DoesNotContain(rig.Api.Sent, r => r.Text == FunnelTexts.Thanks);
    }

    [Fact]
    public async Task FourthLeadInADay_IsRefused()
    {
        var rig = new Rig();
        for (var i = 0; i < 3; i++)
        {
            await FullDialog(rig);
        }

        await FullDialog(rig);

        Assert.Equal(3, rig.LeadCount());
        Assert.Equal(FunnelTexts.QuotaExceeded, rig.Api.Sent[^1].Text);
    }

    [Fact]
    public async Task GroupChat_IsIgnored()
    {
        var rig = new Rig();
        await rig.Service.ProcessAsync(new BotUpdate
        {
            UpdateId = 2,
            Message = new BotMessage { Chat = new BotChat { Id = 9, Type = "group" }, From = new BotUser { Id = 9 }, Text = "/start" },
        }, default);

        Assert.Empty(rig.Api.Sent);
    }
}
