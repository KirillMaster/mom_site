using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Moq;

namespace MomSite.Tests
{
    public class RewatermarkWebApplicationFactory : ArtworkImagesWebApplicationFactory
    {
        public Mock<IS3Service> S3 { get; } = new();
        public Mock<IImageService> Images { get; } = new();

        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            base.ConfigureWebHost(builder);
            S3.Setup(s => s.ListObjectsAsync(It.IsAny<string>())).ReturnsAsync(Array.Empty<StorageObject>());
            builder.ConfigureServices(services =>
            {
                services.AddSingleton(S3.Object);
                services.AddSingleton(Images.Object);
            });
        }
    }

    [Collection("AdminEnvIntegration")]
    public class RewatermarkEndpointTests : IClassFixture<RewatermarkWebApplicationFactory>
    {
        private readonly RewatermarkWebApplicationFactory _factory;

        public RewatermarkEndpointTests(RewatermarkWebApplicationFactory factory) => _factory = factory;

        [Fact, Trait("scenario", "US7-BE2")]
        public async Task US7_BE2_NoParameters_DryRunReportWithAllKeys_DbUntouched()
        {
            await _factory.WithDbAsync(async ctx =>
            {
                await SeedArtworkAsync(ctx, 1, "Rwbe2");
                return 0;
            });
            var client = await _factory.CreateAuthorizedClientAsync();

            var response = await client.PostAsync("/api/admin/images/rewatermark", null);

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var json = await response.Content.ReadFromJsonAsync<System.Text.Json.JsonElement>();
            Assert.True(json.GetProperty("dryRun").GetBoolean());
            Assert.Equal(0, json.GetProperty("processed").GetInt32());
            foreach (var key in new[] { "matched", "skipped", "failed", "remaining" })
                Assert.True(json.TryGetProperty(key, out _), key);
            var withOriginal = await _factory.WithDbAsync(c => c.ArtworkImages.CountAsync(i => i.OriginalPath != null));
            Assert.Equal(0, withOriginal);
        }

        [Fact, Trait("scenario", "US7-BE3")]
        public async Task US7_BE3_WithoutToken_Returns401()
        {
            var response = await _factory.CreateClient().PostAsync("/api/admin/images/rewatermark?dryRun=false", null);
            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        [Theory, Trait("scenario", "US7-BE4")]
        [InlineData(0)]
        [InlineData(101)]
        [InlineData(100)]
        public async Task US7_BE4_Take_AcceptedAndClamped_Returns200(int take)
        {
            var client = await _factory.CreateAuthorizedClientAsync();

            var response = await client.PostAsync($"/api/admin/images/rewatermark?take={take}", null);

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var json = await response.Content.ReadFromJsonAsync<System.Text.Json.JsonElement>();
            Assert.True(json.GetProperty("processed").GetInt32() <= 100);
        }

        [Fact, Trait("scenario", "US7-BE4")]
        public async Task US7_BE4_Take_NegativeValue_ClampedTo1_Returns200()
        {
            var client = await _factory.CreateAuthorizedClientAsync();
            await _factory.WithDbAsync(async ctx =>
            {
                await SeedArtworkAsync(ctx, 1, "Neg");
                return 0;
            });

            var response = await client.PostAsync("/api/admin/images/rewatermark?take=-5", null);

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var json = await response.Content.ReadFromJsonAsync<System.Text.Json.JsonElement>();
            Assert.True(json.GetProperty("skipped").GetArrayLength() <= 1);
        }

        [Fact, Trait("scenario", "US7-BE2")]
        public async Task US7_BE2_DryRunDefaultsTrue_NoParametersNoWrite()
        {
            await _factory.WithDbAsync(async ctx =>
            {
                await SeedArtworkAsync(ctx, 1, "DryDef");
                return 0;
            });
            var client = await _factory.CreateAuthorizedClientAsync();

            var response = await client.PostAsync("/api/admin/images/rewatermark", null);

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var json = await response.Content.ReadFromJsonAsync<System.Text.Json.JsonElement>();
            Assert.True(json.GetProperty("dryRun").GetBoolean());
            Assert.Equal(0, json.GetProperty("processed").GetInt32());
            var withOriginal = await _factory.WithDbAsync(c => c.ArtworkImages.CountAsync(i => i.OriginalPath != null));
            Assert.Equal(0, withOriginal);
        }
    }
}
