
namespace MomSite.Tests
{
    public partial class ArtworkImagesEndpointsTests
    {
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
