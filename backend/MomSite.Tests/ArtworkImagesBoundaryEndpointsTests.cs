using System.Net;
using System.Text.Json;
using MomSite.Core.Models;
using static MomSite.Tests.ArtworkImageFixtures;

namespace MomSite.Tests
{
    public partial class ArtworkImagesEndpointsTests
    {
        [Fact, Trait("scenario", "US1-BE5")]
        public async Task US1_BE5_PostImages_9Plus1_Returns200()
        {
            var art = await Seed(9);
            var client = await _factory.CreateAuthorizedClientAsync();

            var response = await client.PostAsync($"/api/admin/artworks/{art.Id}/images", Files("new.jpg"));

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var images = (await Json(response)).GetProperty("images");
            Assert.Equal(10, images.GetArrayLength());
            Assert.Equal(new[] { 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 }, images.EnumerateArray().Select(i => i.GetProperty("sortOrder").GetInt32()));
        }

        [Fact, Trait("scenario", "US1-BE5")]
        public async Task US1_BE5_PostImages_9Plus2_Returns400()
        {
            var art = await Seed(9);
            var client = await _factory.CreateAuthorizedClientAsync();

            var response = await client.PostAsync($"/api/admin/artworks/{art.Id}/images", Files("1.jpg", "2.jpg"));

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            Assert.Contains("10", (await Json(response)).GetProperty("message").GetString());
        }

        [Fact, Trait("scenario", "US1-EC5")]
        public async Task US1_EC5_PutOrder_EmptyList_Returns400()
        {
            var art = await Seed(3);
            var client = await _factory.CreateAuthorizedClientAsync();

            var response = await client.PutAsJsonAsync($"/api/admin/artworks/{art.Id}/images/order",
                new { imageIds = new List<int>() });

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            Assert.False(string.IsNullOrWhiteSpace((await Json(response)).GetProperty("message").GetString()));
        }

        [Fact, Trait("scenario", "US1-BE2")]
        public async Task US1_BE2_PutOrder_SingleImage_Returns200()
        {
            var art = await Seed(1);
            var id = art.Images[0].Id;
            var client = await _factory.CreateAuthorizedClientAsync();

            var response = await client.PutAsJsonAsync($"/api/admin/artworks/{art.Id}/images/order",
                new { imageIds = new[] { id } });

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var images = (await Json(response)).GetProperty("images");
            Assert.Single(images.EnumerateArray());
        }

        [Fact, Trait("scenario", "US1-BE2")]
        public async Task US1_BE2_PutOrder_TwoImagesReversed_Returns200AndPersists()
        {
            var art = await Seed(2);
            var ids = art.Images.Select(i => i.Id).ToList();
            var reversed = new[] { ids[1], ids[0] };
            var client = await _factory.CreateAuthorizedClientAsync();

            var response = await client.PutAsJsonAsync($"/api/admin/artworks/{art.Id}/images/order",
                new { imageIds = reversed });

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            Assert.Equal(reversed, (await Json(response)).GetProperty("images").EnumerateArray().Select(i => i.GetProperty("id").GetInt32()));
        }

        [Fact, Trait("scenario", "US1-BE4")]
        public async Task US1_BE4_Delete_LastOfTwo_Returns200()
        {
            var art = await Seed(2);
            var client = await _factory.CreateAuthorizedClientAsync();

            var response = await client.DeleteAsync($"/api/admin/artworks/{art.Id}/images/{art.Images[1].Id}");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var images = (await Json(response)).GetProperty("images");
            Assert.Single(images.EnumerateArray());
        }

        [Fact, Trait("scenario", "US1-BE4")]
        public async Task US1_BE4_Delete_FirstOfTwo_Returns200AndSecondBecomeCover()
        {
            var art = await Seed(2);
            var secondId = art.Images[1].Id;
            var secondPath = art.Images[1].ImagePath;
            var client = await _factory.CreateAuthorizedClientAsync();

            var response = await client.DeleteAsync($"/api/admin/artworks/{art.Id}/images/{art.Images[0].Id}");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var images = (await Json(response)).GetProperty("images");
            Assert.Single(images.EnumerateArray());
            Assert.Equal(secondId, images[0].GetProperty("id").GetInt32());
            Assert.Equal(secondPath, images[0].GetProperty("imagePath").GetString());

            var saved = await _factory.WithDbAsync(c => c.Artworks.FindAsync(art.Id).AsTask());
            Assert.Equal(secondPath, saved.ImagePath);
        }

        [Fact, Trait("scenario", "US1-BE1")]
        public async Task US1_BE1_PostImages_SortOrderSequential()
        {
            var art = await Seed(3);
            var client = await _factory.CreateAuthorizedClientAsync();

            var response = await client.PostAsync($"/api/admin/artworks/{art.Id}/images", Files("1.jpg", "2.jpg"));

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var images = (await Json(response)).GetProperty("images");
            var orders = images.EnumerateArray().Select(i => i.GetProperty("sortOrder").GetInt32()).ToArray();
            Assert.Equal(new[] { 0, 1, 2, 3, 4 }, orders);
        }

        [Fact, Trait("scenario", "US1-BE3")]
        public async Task US1_BE3_PutOrder_CoverImagePathAndThumbnailSynced()
        {
            var art = await Seed(3);
            var ids = art.Images.Select(i => i.Id).ToList();
            var secondImagePath = art.Images[1].ImagePath;
            var secondImageThumb = art.Images[1].ThumbnailPath;
            var client = await _factory.CreateAuthorizedClientAsync();

            await client.PutAsJsonAsync($"/api/admin/artworks/{art.Id}/images/order",
                new { imageIds = new[] { ids[1], ids[0], ids[2] } });

            var artworks = await Json(await client.GetAsync("/api/admin/artworks"));
            var updated = artworks.EnumerateArray().First(a => a.GetProperty("id").GetInt32() == art.Id);
            Assert.Equal(secondImagePath, updated.GetProperty("imagePath").GetString());
            Assert.Equal(secondImageThumb, updated.GetProperty("thumbnailPath").GetString());
        }
    }
}
