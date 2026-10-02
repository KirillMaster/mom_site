
namespace MomSite.Tests
{
    public partial class ArtworkImagesEndpointsTests
    {
        public static IEnumerable<object[]> ProtectedOps()
        {
            yield return new object[] { "POST" };
            yield return new object[] { "DELETE" };
            yield return new object[] { "PUT" };
        }

        [Theory, Trait("scenario", "US1-BE6")]
        [MemberData(nameof(ProtectedOps))]
        public async Task US1_BE6_ImageOperations_WithoutToken_Return401(string method)
        {
            var art = await Seed(2, "Auth" + method);
            var url = method switch
            {
                "POST" => $"/api/admin/artworks/{art.Id}/images",
                "DELETE" => $"/api/admin/artworks/{art.Id}/images/{art.Images[0].Id}",
                _ => $"/api/admin/artworks/{art.Id}/images/order"
            };
            var request = new HttpRequestMessage(new HttpMethod(method), url);
            if (method == "POST") request.Content = Files("1.jpg");
            if (method == "PUT") request.Content = JsonContent.Create(new { imageIds = new[] { art.Images[1].Id, art.Images[0].Id } });

            var response = await _factory.CreateClient().SendAsync(request);

            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
            var count = await _factory.WithDbAsync(c => c.ArtworkImages.CountAsync(i => i.ArtworkId == art.Id));
            Assert.Equal(2, count);
        }

        [Fact, Trait("scenario", "US1-BE7")]
        public async Task US1_BE7_UnknownArtworkOrForeignImage_Return404()
        {
            var a = await Seed(2, "A7");
            var b = await Seed(2, "B7");
            var client = await _factory.CreateAuthorizedClientAsync();

            Assert.Equal(HttpStatusCode.NotFound, (await client.PostAsync("/api/admin/artworks/99999/images", Files("1.jpg"))).StatusCode);
            Assert.Equal(HttpStatusCode.NotFound,
                (await client.PutAsJsonAsync("/api/admin/artworks/99999/images/order", new { imageIds = new[] { 1 } })).StatusCode);
            Assert.Equal(HttpStatusCode.NotFound,
                (await client.DeleteAsync($"/api/admin/artworks/{a.Id}/images/{b.Images[0].Id}")).StatusCode);
            Assert.Equal(2, await _factory.WithDbAsync(c => c.ArtworkImages.CountAsync(i => i.ArtworkId == b.Id)));
        }
    }
}
