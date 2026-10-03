using System.Net;
using System.Text;
using Microsoft.Extensions.Logging;
using MomSite.Infrastructure.TelegramBot;
using Xunit;

namespace MomSite.Tests.TelegramBot;

[CollectionDefinition("FunnelBotEnv", DisableParallelization = true)]
public class FunnelBotEnvCollection { }

[Collection("FunnelBotEnv")]
public class TelegramBotClientTests : IDisposable
{
    private const string FakeToken = "123456:SECRET-TOKEN";
    private readonly string? _old = Environment.GetEnvironmentVariable("FUNNEL_BOT_TOKEN");

    public TelegramBotClientTests() => Environment.SetEnvironmentVariable("FUNNEL_BOT_TOKEN", FakeToken);

    public void Dispose() => Environment.SetEnvironmentVariable("FUNNEL_BOT_TOKEN", _old);

    private sealed class Handler : HttpMessageHandler
    {
        private readonly Func<HttpRequestMessage, HttpResponseMessage> _respond;

        public Handler(Func<HttpRequestMessage, HttpResponseMessage> respond) => _respond = respond;

        public List<(string Url, string Body)> Calls { get; } = new();

        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage r, CancellationToken ct)
        {
            var body = r.Content is null ? "" : await r.Content.ReadAsStringAsync(ct);
            Calls.Add((r.RequestUri!.ToString(), body));
            return _respond(r);
        }
    }

    private sealed class Factory : IHttpClientFactory
    {
        private readonly HttpMessageHandler _handler;

        public Factory(HttpMessageHandler handler) => _handler = handler;

        public HttpClient CreateClient(string name) => new(_handler, false);
    }

    private sealed class ListLogger : ILogger<TelegramBotClient>
    {
        public List<string> Lines { get; } = new();

        public IDisposable? BeginScope<TState>(TState state) where TState : notnull => null;

        public bool IsEnabled(LogLevel logLevel) => true;

        public void Log<TState>(LogLevel logLevel, EventId eventId, TState state, Exception? exception,
            Func<TState, Exception?, string> formatter) => Lines.Add(formatter(state, exception) + exception);
    }

    private static HttpResponseMessage Json(HttpStatusCode code, string json) =>
        new(code) { Content = new StringContent(json, Encoding.UTF8, "application/json") };

    [Fact]
    public async Task GetUpdates_ParsesUpdates()
    {
        var h = new Handler(_ => Json(HttpStatusCode.OK,
            "{\"ok\":true,\"result\":[{\"update_id\":5,\"message\":{\"chat\":{\"id\":1,\"type\":\"private\"},\"from\":{\"id\":1},\"text\":\"hi\"}}]}"));
        var client = new TelegramBotClient(new Factory(h), new ListLogger());

        var result = await client.GetUpdatesAsync(5, default);

        Assert.True(result.Ok);
        Assert.Equal(5, result.Value![0].UpdateId);
        Assert.Contains("getUpdates", h.Calls[0].Url);
        Assert.Contains("\"offset\":5", h.Calls[0].Body);
    }

    [Fact]
    public async Task SendMessage_RequestContactButton_IsSerialized()
    {
        var h = new Handler(_ => Json(HttpStatusCode.OK, "{\"ok\":true,\"result\":{}}"));
        var client = new TelegramBotClient(new Factory(h), new ListLogger());
        var kb = new Keyboard(KeyboardKind.Reply, new[] { new[] { new Button("Phone", RequestContact: true) } });

        var result = await client.SendMessageAsync(1, new Reply("hi", Keyboard: kb), default);

        Assert.True(result.Ok);
        Assert.Contains("\"request_contact\":true", h.Calls[0].Body);
    }

    [Fact]
    public async Task TooManyRequests_ReturnsRetryAfter()
    {
        var h = new Handler(_ => Json((HttpStatusCode)429,
            "{\"ok\":false,\"error_code\":429,\"parameters\":{\"retry_after\":7}}"));
        var client = new TelegramBotClient(new Factory(h), new ListLogger());

        var result = await client.SendMessageAsync(1, new Reply("x"), default);

        Assert.False(result.Ok);
        Assert.Equal(429, result.ErrorCode);
        Assert.Equal(7, result.RetryAfterSeconds);
    }

    [Fact]
    public async Task NetworkError_IsReturnedAsFailure_AndTokenIsNotLogged()
    {
        var h = new Handler(r => throw new HttpRequestException("failed " + r.RequestUri));
        var log = new ListLogger();
        var client = new TelegramBotClient(new Factory(h), log);

        var result = await client.GetUpdatesAsync(0, default);

        Assert.False(result.Ok);
        Assert.NotEmpty(log.Lines);
        Assert.DoesNotContain(log.Lines, l => l.Contains("SECRET-TOKEN"));
    }

    [Fact]
    public async Task EmptyToken_MakesNoHttpCalls()
    {
        Environment.SetEnvironmentVariable("FUNNEL_BOT_TOKEN", "");
        var h = new Handler(_ => Json(HttpStatusCode.OK, "{}"));
        var client = new TelegramBotClient(new Factory(h), new ListLogger());

        var result = await client.SendMessageAsync(1, new Reply("x"), default);

        Assert.False(result.Ok);
        Assert.Empty(h.Calls);
    }
}
