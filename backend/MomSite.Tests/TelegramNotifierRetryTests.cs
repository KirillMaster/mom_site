using System.Net;
using System.Net.Http;
using Microsoft.Extensions.Logging.Abstractions;
using MomSite.Core.Models;
using MomSite.Infrastructure.Notifications;
using Xunit;

namespace MomSite.Tests;

[Collection("AdminEnvIntegration")]
public class TelegramNotifierRetryTests : IDisposable
{
    private readonly string? _token = Environment.GetEnvironmentVariable("TELEGRAM_BOT_TOKEN");
    private readonly string? _chats = Environment.GetEnvironmentVariable("TELEGRAM_CHAT_IDS");

    public TelegramNotifierRetryTests()
    {
        Environment.SetEnvironmentVariable("TELEGRAM_BOT_TOKEN", "test-token");
        Environment.SetEnvironmentVariable("TELEGRAM_CHAT_IDS", "1");
    }

    public void Dispose()
    {
        Environment.SetEnvironmentVariable("TELEGRAM_BOT_TOKEN", _token);
        Environment.SetEnvironmentVariable("TELEGRAM_CHAT_IDS", _chats);
    }

    private static ContactMessage Message() => new() { Id = 1, Name = "Анна", Subject = "Заказ", Message = "Хочу картину" };

    private static TelegramNotifier Notifier(StubHandler handler) =>
        new(new StubFactory(handler), NullLogger<TelegramNotifier>.Instance) { RetryDelay = TimeSpan.Zero };

    [Fact]
    public async Task Transient_network_errors_are_retried_until_delivered()
    {
        var handler = new StubHandler(
            _ => throw new HttpRequestException("reset"),
            _ => throw new TaskCanceledException("timeout"),
            _ => new HttpResponseMessage(HttpStatusCode.OK));

        await Notifier(handler).NotifyAsync(Message());

        Assert.Equal(3, handler.Calls);
    }

    [Fact]
    public async Task Server_errors_are_retried()
    {
        var handler = new StubHandler(
            _ => new HttpResponseMessage(HttpStatusCode.BadGateway),
            _ => new HttpResponseMessage(HttpStatusCode.OK));

        await Notifier(handler).NotifyAsync(Message());

        Assert.Equal(2, handler.Calls);
    }

    [Fact]
    public async Task Every_configured_chat_receives_the_message()
    {
        Environment.SetEnvironmentVariable("TELEGRAM_CHAT_IDS", "1,2");
        var handler = new StubHandler(_ => new HttpResponseMessage(HttpStatusCode.OK));

        await Notifier(handler).NotifyAsync(Message());

        Assert.Equal(2, handler.Calls);
    }

    [Fact]
    public async Task Client_errors_are_not_retried()
    {
        var handler = new StubHandler(_ => new HttpResponseMessage(HttpStatusCode.BadRequest) { Content = new StringContent("chat not found") });

        await Assert.ThrowsAsync<InvalidOperationException>(() => Notifier(handler).NotifyAsync(Message()));

        Assert.Equal(1, handler.Calls);
    }

    [Fact]
    public async Task Gives_up_after_max_attempts()
    {
        var handler = new StubHandler(_ => throw new HttpRequestException("down"));

        await Assert.ThrowsAsync<HttpRequestException>(() => Notifier(handler).NotifyAsync(Message()));

        Assert.Equal(TelegramNotifier.MaxAttempts, handler.Calls);
    }

    private sealed class StubHandler : HttpMessageHandler
    {
        private readonly Func<HttpRequestMessage, HttpResponseMessage>[] _responses;

        public StubHandler(params Func<HttpRequestMessage, HttpResponseMessage>[] responses) => _responses = responses;

        public int Calls { get; private set; }

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            var respond = _responses[Math.Min(Calls, _responses.Length - 1)];
            Calls++;
            return Task.FromResult(respond(request));
        }
    }

    private sealed class StubFactory : IHttpClientFactory
    {
        private readonly HttpMessageHandler _handler;

        public StubFactory(HttpMessageHandler handler) => _handler = handler;

        public HttpClient CreateClient(string name) => new(_handler, disposeHandler: false);
    }
}
