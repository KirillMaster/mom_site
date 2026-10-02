
namespace MomSite.Tests
{
    public partial class ArtworkImagesEndpointsTests
    {
        [Fact, Trait("scenario", "US1-BE1")]
        public async Task US1_BE1_PostImages_Returns200WithAppendedImages()
        {
            var art = await Seed(1);
            var client = await _factory.CreateAuthorizedClientAsync();

            var response = await client.PostAsync($"/api/admin/artworks/{art.Id}/images", Files("1.jpg", "2.jpg", "3.jpg"));

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var images = (await Json(response)).GetProperty("images");
            Assert.Equal(4, images.GetArrayLength());
            Assert.Equal(new[] { 0, 1, 2, 3 }, images.EnumerateArray().Select(i => i.GetProperty("sortOrder").GetInt32()));
            var saved = await _factory.WithDbAsync(c => c.Artworks.AsNoTracking().FirstAsync(a => a.Id == art.Id));
            Assert.Equal(art.ImagePath, saved.ImagePath);
        }

        [Fact, Trait("scenario", "US1-BE2")]
        public async Task US1_BE2_PutOrder_Returns200AndPersists()
        {
            var art = await Seed(4);
            var ids = art.Images.Select(i => i.Id).ToList();
            var order = new[] { ids[3], ids[2], ids[1], ids[0] };
            var client = await _factory.CreateAuthorizedClientAsync();

            var response = await client.PutAsJsonAsync($"/api/admin/artworks/{art.Id}/images/order", new { imageIds = order });

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            Assert.Equal(order, (await Json(response)).GetProperty("images").EnumerateArray().Select(i => i.GetProperty("id").GetInt32()));
            var list = await Json(await client.GetAsync("/api/admin/artworks"));
            var mine = list.EnumerateArray().First(a => a.GetProperty("id").GetInt32() == art.Id);
            Assert.Equal(order, mine.GetProperty("images").EnumerateArray().Select(i => i.GetProperty("id").GetInt32()));
        }

        [Fact, Trait("scenario", "US1-BE3")]
        public async Task US1_BE3_PutOrder_PublicGalleryUsesNewCover()
        {
            var art = await Seed(3, "Обложка");
            var ids = art.Images.Select(i => i.Id).ToList();
            var client = await _factory.CreateAuthorizedClientAsync();

            await client.PutAsJsonAsync($"/api/admin/artworks/{art.Id}/images/order", new { imageIds = new[] { ids[2], ids[0], ids[1] } });

            var gallery = await Json(await _factory.CreateClient().GetAsync("/api/public/gallery"));
            var mine = gallery.GetProperty("artworks").EnumerateArray().First(a => a.GetProperty("id").GetInt32() == art.Id);
            Assert.Equal(art.Images[2].ImagePath, mine.GetProperty("imagePath").GetString());
            Assert.Equal(art.Images[2].ThumbnailPath, mine.GetProperty("thumbnailPath").GetString());
        }

        [Fact, Trait("scenario", "US1-BE4")]
        public async Task US1_BE4_DeleteImage_Returns200WithNormalizedOrder()
        {
            var art = await Seed(4);
            var client = await _factory.CreateAuthorizedClientAsync();

            var response = await client.DeleteAsync($"/api/admin/artworks/{art.Id}/images/{art.Images[1].Id}");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var images = (await Json(response)).GetProperty("images");
            Assert.Equal(new[] { 0, 1, 2 }, images.EnumerateArray().Select(i => i.GetProperty("sortOrder").GetInt32()));
            Assert.Contains(art.Images[1].ImagePath, _factory.DeletedFiles);
        }

        [Fact, Trait("scenario", "US1-BE5")]
        public async Task US1_BE5_PostImages_OverLimit_Returns400WithMessage()
        {
            var art = await Seed(10);
            var client = await _factory.CreateAuthorizedClientAsync();

            var response = await client.PostAsync($"/api/admin/artworks/{art.Id}/images", Files("x.jpg"));

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            Assert.Contains("10", (await Json(response)).GetProperty("message").GetString());
        }

        [Fact, Trait("scenario", "US1-EC3")]
        public async Task US1_EC3_DeleteLastImage_Returns400()
        {
            var art = await Seed(1);
            var client = await _factory.CreateAuthorizedClientAsync();

            var response = await client.DeleteAsync($"/api/admin/artworks/{art.Id}/images/{art.Images[0].Id}");

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            Assert.Equal("У работы должно быть хотя бы одно фото", (await Json(response)).GetProperty("message").GetString());
        }

        [Fact, Trait("scenario", "US1-EC4")]
        public async Task US1_EC4_PostEmptyRequest_Returns400()
        {
            var art = await Seed(2);
            var client = await _factory.CreateAuthorizedClientAsync();

            var response = await client.PostAsync($"/api/admin/artworks/{art.Id}/images", new MultipartFormDataContent());

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            var count = await _factory.WithDbAsync(c => c.ArtworkImages.CountAsync(i => i.ArtworkId == art.Id));
            Assert.Equal(2, count);
        }

        [Fact, Trait("scenario", "US1-EC5")]
        public async Task US1_EC5_PutOrder_ForeignId_Returns400()
        {
            var a = await Seed(3, "A5");
            var b = await Seed(2, "B5");
            var client = await _factory.CreateAuthorizedClientAsync();

            var response = await client.PutAsJsonAsync($"/api/admin/artworks/{a.Id}/images/order",
                new { imageIds = new[] { a.Images[0].Id, a.Images[1].Id, b.Images[0].Id } });

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }
    }
}
