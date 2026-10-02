using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using MomSite.Core.Models;
using MomSite.Infrastructure.Data;
using MomSite.Infrastructure.Data.Migrations;
using static MomSite.Tests.ArtworkImageFixtures;

namespace MomSite.Tests
{
    [Collection("AdminEnvIntegration")]
    public class ArtworkImagesEndpointsTests : IClassFixture<ArtworkImagesWebApplicationFactory>
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

        [Fact, Trait("scenario", "US2-BE1")]
        public async Task US2_BE1_PublicAndAdminDtos_ContainOrderedImages()
        {
            var art = await Seed(3, "Dto");
            var legacy = await Seed(0, "Legacy");
            var admin = await _factory.CreateAuthorizedClientAsync();
            var anon = _factory.CreateClient();

            var gallery = (await Json(await anon.GetAsync("/api/public/gallery"))).GetProperty("artworks");
            var home = (await Json(await anon.GetAsync("/api/public/home"))).GetProperty("artworks");
            var adminList = await Json(await admin.GetAsync("/api/admin/artworks"));

            foreach (var list in new[] { gallery, home, adminList })
            {
                var dto = list.EnumerateArray().First(a => a.GetProperty("id").GetInt32() == art.Id);
                var images = dto.GetProperty("images").EnumerateArray().ToList();
                Assert.Equal(art.Images.Select(i => i.Id), images.Select(i => i.GetProperty("id").GetInt32()));
                Assert.Equal(new[] { 0, 1, 2 }, images.Select(i => i.GetProperty("sortOrder").GetInt32()));
                Assert.Equal(dto.GetProperty("imagePath").GetString(), images[0].GetProperty("imagePath").GetString());
                Assert.Equal(art.Images[0].ThumbnailPath, images[0].GetProperty("thumbnailPath").GetString());
            }

            foreach (var list in new[] { gallery, adminList })
            {
                var dto = list.EnumerateArray().First(a => a.GetProperty("id").GetInt32() == legacy.Id);
                var images = dto.GetProperty("images").EnumerateArray().ToList();
                Assert.Single(images);
                Assert.Equal(legacy.ImagePath, images[0].GetProperty("imagePath").GetString());
                Assert.Equal(legacy.ThumbnailPath, images[0].GetProperty("thumbnailPath").GetString());
            }
        }

        [Fact, Trait("scenario", "US1-EC6")]
        public async Task US1_EC6_DeleteArtwork_RemovesImagesAndFiles()
        {
            var art = await Seed(3, "Del");
            var client = await _factory.CreateAuthorizedClientAsync();

            var response = await client.DeleteAsync($"/api/admin/artworks/{art.Id}");

            Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
            Assert.Equal(0, await _factory.WithDbAsync(c => c.ArtworkImages.CountAsync(i => i.ArtworkId == art.Id)));
            foreach (var i in art.Images)
            {
                Assert.Contains(i.ImagePath, _factory.DeletedFiles);
                Assert.Contains(i.ThumbnailPath, _factory.DeletedFiles);
            }
        }

        [Fact, Trait("scenario", "US1-EC7")]
        public async Task US1_EC7_CreateAndUpdate_KeepCoverImageInSync()
        {
            var category = await _factory.WithDbAsync(async c =>
            {
                var cat = new Category { Name = "EC7 " + Guid.NewGuid().ToString("N") };
                c.Categories.Add(cat);
                await c.SaveChangesAsync();
                return cat;
            });
            var client = await _factory.CreateAuthorizedClientAsync();

            var create = new MultipartFormDataContent
            {
                { new StringContent("Новая"), "Title" },
                { new StringContent(category.Id.ToString()), "CategoryId" }
            };
            var file = new ByteArrayContent(new byte[] { 1, 2, 3 });
            file.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("image/jpeg");
            create.Add(file, "Image", "first.jpg");
            var created = await client.PostAsync("/api/admin/artworks/create", create);
            Assert.Equal(HttpStatusCode.Created, created.StatusCode);
            var id = (await Json(created)).GetProperty("id").GetInt32();

            var after = await _factory.WithDbAsync(c => c.Artworks.Include(a => a.Images).AsNoTracking().FirstAsync(a => a.Id == id));
            Assert.Single(after.Images);
            Assert.Equal(0, after.Images[0].SortOrder);
            Assert.Equal(after.ImagePath, after.Images[0].ImagePath);
            Assert.Equal(after.ThumbnailPath, after.Images[0].ThumbnailPath);

            var update = new MultipartFormDataContent
            {
                { new StringContent("Новая"), "Title" },
                { new StringContent(category.Id.ToString()), "CategoryId" }
            };
            var file2 = new ByteArrayContent(new byte[] { 1, 2, 3 });
            file2.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("image/jpeg");
            update.Add(file2, "Image", "second.jpg");
            Assert.Equal(HttpStatusCode.NoContent, (await client.PutAsync($"/api/admin/artworks/{id}", update)).StatusCode);

            var updated = await _factory.WithDbAsync(c => c.Artworks.Include(a => a.Images).AsNoTracking().FirstAsync(a => a.Id == id));
            Assert.Single(updated.Images);
            Assert.Contains("second.jpg", updated.Images[0].ImagePath);
            Assert.Equal(updated.ImagePath, updated.Images[0].ImagePath);
            Assert.Contains(after.ImagePath, _factory.DeletedFiles);
        }

        [Fact, Trait("scenario", "US1-EC1")]
        public async Task US1_EC1_Migration_CopiesExistingPhotoAsCoverWithSortOrder0()
        {
            var sql = new AddArtworkImages().UpOperations
                .OfType<Microsoft.EntityFrameworkCore.Migrations.Operations.SqlOperation>()
                .Single().Sql;
            Assert.Contains("INSERT INTO \"ArtworkImages\"", sql);
            Assert.Contains("FROM \"Artworks\"", sql);

            var legacy = await Seed(0, "Mig");
            await _factory.WithDbAsync(async c =>
            {
                await c.Database.ExecuteSqlRawAsync(sql.Replace("NOW()", "CURRENT_TIMESTAMP"));
                return 0;
            });

            var images = await _factory.WithDbAsync(c => c.ArtworkImages.Where(i => i.ArtworkId == legacy.Id).ToListAsync());
            Assert.Single(images);
            Assert.Equal(0, images[0].SortOrder);
            Assert.Equal(legacy.ImagePath, images[0].ImagePath);
            Assert.Equal(legacy.ThumbnailPath, images[0].ThumbnailPath);

            var gallery = (await Json(await _factory.CreateClient().GetAsync("/api/public/gallery"))).GetProperty("artworks");
            var dto = gallery.EnumerateArray().First(a => a.GetProperty("id").GetInt32() == legacy.Id);
            Assert.Equal(legacy.ImagePath, dto.GetProperty("imagePath").GetString());
            Assert.Equal(legacy.ImagePath, dto.GetProperty("images")[0].GetProperty("imagePath").GetString());
        }
    }
}
