using System.Net;
using System.Text.Json;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using MomSite.Core.Interfaces;
using MomSite.Infrastructure.Blog;
using Xunit;

namespace MomSite.Tests.Blog;

public class IndexNowClientTests
{
    private static readonly IReadOnlyCollection<string> Urls = IndexNowClient.BlogUrls("osen", "news");

    private sealed class StubHandler : HttpMessageHandler
    {
        private readonly Func<HttpRequestMessage, HttpResponseMessage> _respond;
        public List<(HttpRequestMessage Request, string Body)> Calls { get; } = new();

        public StubHandler(Func<HttpRequestMessage, HttpResponseMessage> respond) => _respond = respond;

        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            var body = request.Content == null ? "" : await request.Content.ReadAsStringAsync(cancellationToken);
            Calls.Add((request, body));
            return _respond(request);
        }
    }

    private static IndexNowClient Client(StubHandler handler, string? key)
    {
        var factory = new Mock<IHttpClientFactory>();
        factory.Setup(f => f.CreateClient(IndexNowClient.HttpClientName)).Returns(() => new HttpClient(handler));
        return new IndexNowClient(factory.Object, NullLogger<IndexNowClient>.Instance, () => key);
    }

    [Fact]
    public async Task Without_a_key_nothing_is_sent()
    {
        var handler = new StubHandler(_ => new HttpResponseMessage(HttpStatusCode.OK));

        var outcome = await Client(handler, null).NotifyAsync(Urls);

        Assert.Equal(IndexNowOutcome.DisabledNoKey, outcome);
        Assert.Empty(handler.Calls);
    }

    [Fact]
    public async Task A_failing_service_is_reported_without_throwing()
    {
        var handler = new StubHandler(_ => new HttpResponseMessage(HttpStatusCode.InternalServerError));

        var outcome = await Client(handler, "abc123").NotifyAsync(Urls);

        Assert.Equal(IndexNowOutcome.Failed, outcome);
    }

    [Fact]
    public async Task A_network_error_is_reported_without_throwing()
    {
        var handler = new StubHandler(_ => throw new HttpRequestException("down"));

        var outcome = await Client(handler, "abc123").NotifyAsync(Urls);

        Assert.Equal(IndexNowOutcome.Failed, outcome);
    }

    [Fact]
    public async Task Sends_the_post_its_category_and_the_blog_to_yandex()
    {
        var handler = new StubHandler(_ => new HttpResponseMessage(HttpStatusCode.Accepted));

        var outcome = await Client(handler, "abc123").NotifyAsync(Urls);

        Assert.Equal(IndexNowOutcome.Sent, outcome);
        var (request, body) = Assert.Single(handler.Calls);
        Assert.Equal(HttpMethod.Post, request.Method);
        Assert.Equal("https://yandex.com/indexnow", request.RequestUri!.ToString());
        using var json = JsonDocument.Parse(body);
        var root = json.RootElement;
        Assert.Equal("angelamoiseenko.ru", root.GetProperty("host").GetString());
        Assert.Equal("abc123", root.GetProperty("key").GetString());
        Assert.Equal("https://angelamoiseenko.ru/indexnow-key.txt", root.GetProperty("keyLocation").GetString());
        Assert.Equal(
            new[] { "https://angelamoiseenko.ru/blog/osen", "https://angelamoiseenko.ru/blog/category/news", "https://angelamoiseenko.ru/blog" },
            root.GetProperty("urlList").EnumerateArray().Select(u => u.GetString()).ToArray());
    }
}
