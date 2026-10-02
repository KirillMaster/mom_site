using System.Text.Json;
using MomSite.Core.Models;
using static MomSite.Tests.ArtworkImageFixtures;

namespace MomSite.Tests
{
    [Collection("AdminEnvIntegration")]
    public partial class ArtworkImagesEndpointsTests : IClassFixture<ArtworkImagesWebApplicationFactory>
    {
        private readonly ArtworkImagesWebApplicationFactory _factory;

        public ArtworkImagesEndpointsTests(ArtworkImagesWebApplicationFactory factory)
        {
            _factory = factory;
        }

        private Task<Artwork> Seed(int count, string title = "Сирень") =>
            _factory.WithDbAsync(ctx => SeedArtworkAsync(ctx, count, title));

        private static MultipartFormDataContent Files(params string[] names)
        {
            var content = new MultipartFormDataContent();
            foreach (var n in names)
            {
                var part = new ByteArrayContent(new byte[] { 1, 2, 3 });
                part.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("image/jpeg");
                content.Add(part, "Images", n);
            }
            return content;
        }

        private static async Task<JsonElement> Json(HttpResponseMessage r) =>
            JsonDocument.Parse(await r.Content.ReadAsStringAsync()).RootElement;
    }
}
