using System.Net;
using System.Net.Http.Headers;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using MomSite.API;
using MomSite.Core.Interfaces;
using MomSite.Infrastructure.Services;

namespace MomSite.Tests
{
    internal sealed class RecordingInvalidator : ICacheInvalidator
    {
        private int _calls;
        public int Calls => _calls;
        public bool Throw { get; init; }
        public Task InvalidateAsync(CancellationToken cancellationToken = default)
        {
            Interlocked.Increment(ref _calls);
            if (Throw) throw new HttpRequestException("frontend down");
            return Task.CompletedTask;
        }
    }

    internal sealed class StubHandler : HttpMessageHandler
    {
        private readonly Func<HttpRequestMessage, CancellationToken, Task<HttpResponseMessage>> _fn;
        public HttpRequestMessage? Last;
        public int Calls;
        public StubHandler(Func<HttpRequestMessage, CancellationToken, Task<HttpResponseMessage>> fn) => _fn = fn;
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken ct)
        {
            Calls++;
            Last = request;
            return _fn(request, ct);
        }
    }

    internal sealed class ListLogger<T> : ILogger<T>
    {
        public List<(LogLevel Level, string Message)> Entries { get; } = new();
        public IDisposable? BeginScope<TState>(TState state) where TState : notnull => null;
        public bool IsEnabled(LogLevel logLevel) => true;
        public void Log<TState>(LogLevel logLevel, EventId eventId, TState state, Exception? exception, Func<TState, Exception?, string> formatter)
            => Entries.Add((logLevel, formatter(state, exception)));
    }

    public class AdminCacheInvalidationMiddlewareTests
    {
        private static async Task<int> RunAsync(string method, string path, int status, RecordingInvalidator inv)
        {
            var services = new ServiceCollection().AddSingleton<ICacheInvalidator>(inv).BuildServiceProvider();
            var ctx = new DefaultHttpContext { RequestServices = services };
            ctx.Request.Method = method;
            ctx.Request.Path = path;
            var mw = new AdminCacheInvalidationMiddleware(
                c => { c.Response.StatusCode = status; return Task.CompletedTask; },
                NullLogger<AdminCacheInvalidationMiddleware>.Instance);
            await mw.InvokeAsync(ctx);
            await Task.Delay(100);
            return inv.Calls;
        }

        [Theory]
        [Trait("Scenario", "US2-BE1")]
        [InlineData("POST", "/api/admin/categories", 200)]
        [InlineData("PUT", "/api/admin/videos/3", 200)]
        [InlineData("PATCH", "/api/admin/reviews/1/publish", 204)]
        [InlineData("DELETE", "/api/admin/videos/3", 204)]
        [InlineData("POST", "/api/admin/artworks/create", 201)]
        public async Task SuccessfulMutation_InvokesInvalidator(string method, string path, int status)
        {
            Assert.Equal(1, await RunAsync(method, path, status, new RecordingInvalidator()));
        }

        [Theory]
        [Trait("Scenario", "US2-BE2")]
        [InlineData("GET", "/api/admin/messages", 200)]
        [InlineData("POST", "/api/admin/categories", 400)]
        [InlineData("PUT", "/api/admin/videos/3", 404)]
        [InlineData("DELETE", "/api/admin/videos/3", 500)]
        [InlineData("POST", "/api/admin/categories", 401)]
        [InlineData("POST", "/api/admin/login", 200)]
        [InlineData("POST", "/api/public/contact-message", 200)]
        public async Task NonQualifyingRequests_DoNotInvokeInvalidator(string method, string path, int status)
        {
            Assert.Equal(0, await RunAsync(method, path, status, new RecordingInvalidator()));
        }

        [Fact]
        [Trait("Scenario", "US2-AS6")]
        public async Task ThrowingInvalidator_DoesNotBreakRequest()
        {
            var inv = new RecordingInvalidator { Throw = true };
            Assert.Equal(1, await RunAsync("POST", "/api/admin/categories", 200, inv));
        }
    }

    public class FrontendCacheInvalidatorTests
    {
        private static IConfiguration Config(string? url, string? secret) =>
            new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Frontend:RevalidateUrl"] = url,
                ["Frontend:RevalidateSecret"] = secret
            }).Build();

        private static FrontendCacheInvalidator Make(StubHandler h, IConfiguration c, ListLogger<FrontendCacheInvalidator> log, TimeSpan? timeout = null)
            => new(new HttpClient(h), c, log, timeout ?? TimeSpan.FromSeconds(5));

        [Fact]
        [Trait("Scenario", "US2-BE1")]
        public async Task PostsToConfiguredUrlWithSecretHeader()
        {
            var h = new StubHandler((_, _) => Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)));
            await Make(h, Config("http://frontend:3000/internal/revalidate", "s3cret"), new()).InvalidateAsync();

            Assert.Equal(1, h.Calls);
            Assert.Equal(HttpMethod.Post, h.Last!.Method);
            Assert.Equal("http://frontend:3000/internal/revalidate", h.Last.RequestUri!.ToString());
            Assert.Equal("s3cret", h.Last.Headers.GetValues("X-Revalidate-Secret").Single());
        }

        [Theory]
        [Trait("Scenario", "US2-AS6")]
        [InlineData(null, "s")]
        [InlineData("http://x/y", null)]
        [InlineData("", "")]
        public async Task MissingConfig_IsNoOpAndLogged(string? url, string? secret)
        {
            var h = new StubHandler((_, _) => Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)));
            var log = new ListLogger<FrontendCacheInvalidator>();
            await Make(h, Config(url, secret), log).InvalidateAsync();

            Assert.Equal(0, h.Calls);
            Assert.NotEmpty(log.Entries);
        }

        [Fact]
        [Trait("Scenario", "US2-AS6")]
        public async Task NetworkError_IsLoggedNotThrown()
        {
            var h = new StubHandler((_, _) => throw new HttpRequestException("refused"));
            var log = new ListLogger<FrontendCacheInvalidator>();
            await Make(h, Config("http://x/y", "s"), log).InvalidateAsync();

            Assert.Contains(log.Entries, e => e.Level == LogLevel.Warning);
        }

        [Fact]
        [Trait("Scenario", "US2-AS6")]
        public async Task Non2xx_IsLoggedNotThrown()
        {
            var h = new StubHandler((_, _) => Task.FromResult(new HttpResponseMessage(HttpStatusCode.Unauthorized)));
            var log = new ListLogger<FrontendCacheInvalidator>();
            await Make(h, Config("http://x/y", "s"), log).InvalidateAsync();

            Assert.Contains(log.Entries, e => e.Level == LogLevel.Warning && e.Message.Contains("401"));
        }

        [Fact]
        [Trait("Scenario", "US2-AS6")]
        public async Task Timeout_IsLoggedNotThrown()
        {
            var h = new StubHandler(async (_, ct) =>
            {
                await Task.Delay(Timeout.Infinite, ct);
                return new HttpResponseMessage();
            });
            var log = new ListLogger<FrontendCacheInvalidator>();
            await Make(h, Config("http://x/y", "s"), log, TimeSpan.FromMilliseconds(100)).InvalidateAsync();

            Assert.Contains(log.Entries, e => e.Level == LogLevel.Warning);
        }
    }

    [Collection("AdminEnvIntegration")]
    public class AdminCacheInvalidationIntegrationTests : IClassFixture<AdminMessagesWebApplicationFactory>
    {
        private readonly AdminMessagesWebApplicationFactory _factory;
        public AdminCacheInvalidationIntegrationTests(AdminMessagesWebApplicationFactory factory) => _factory = factory;

        private HttpClient Client(RecordingInvalidator inv) =>
            _factory.WithWebHostBuilder(b => b.ConfigureServices(s =>
            {
                foreach (var d in s.Where(d => d.ServiceType == typeof(ICacheInvalidator)).ToList()) s.Remove(d);
                s.AddSingleton<ICacheInvalidator>(inv);
            })).CreateClient();

        [Fact]
        [Trait("Scenario", "US2-AS6")]
        public async Task AdminWrite_Succeeds_EvenWhenInvalidatorThrows()
        {
            await _factory.SeedMessageAsync();
            var inv = new RecordingInvalidator { Throw = true };
            var client = Client(inv);
            var token = await _factory.GetAdminTokenAsync(client);
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

            var response = await client.PatchAsync("/api/admin/messages/1/archive", null);
            await Task.Delay(200);

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            Assert.Equal(1, inv.Calls);
        }

        [Fact]
        [Trait("Scenario", "US2-BE2")]
        public async Task Login_DoesNotInvokeInvalidator()
        {
            var inv = new RecordingInvalidator();
            var client = Client(inv);
            await _factory.GetAdminTokenAsync(client);
            await Task.Delay(200);

            Assert.Equal(0, inv.Calls);
        }
    }
}
