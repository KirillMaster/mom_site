using System.Net;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Migrations.Operations;
using MomSite.Core.Models;
using MomSite.Infrastructure.Data.Migrations;

namespace MomSite.Tests
{
    [Collection("AdminEnvIntegration")]
    public class ArtworkCatalogFieldsTests : IClassFixture<ArtworkImagesWebApplicationFactory>
    {
        private readonly ArtworkImagesWebApplicationFactory _factory;

        public ArtworkCatalogFieldsTests(ArtworkImagesWebApplicationFactory factory) => _factory = factory;

        private async Task<int> SeedCategory()
        {
            var cat = await _factory.WithDbAsync(async c =>
            {
                var x = new Category { Name = "Cat " + Guid.NewGuid().ToString("N") };
                c.Categories.Add(x);
                await c.SaveChangesAsync();
                return x;
            });
            return cat.Id;
        }

        private static MultipartFormDataContent Form(int categoryId, params (string k, string v)[] extra)
        {
            var form = new MultipartFormDataContent
            {
                { new StringContent("Закат"), "Title" },
                { new StringContent(categoryId.ToString()), "CategoryId" }
            };
            foreach (var (k, v) in extra) form.Add(new StringContent(v), k);
            return form;
        }

        private async Task<int> CreateArtwork(HttpClient client, int categoryId, params (string k, string v)[] extra)
        {
            var form = Form(categoryId, extra);
            var file = new ByteArrayContent(new byte[] { 1, 2, 3 });
            file.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("image/jpeg");
            form.Add(file, "Image", "a.jpg");
            var res = await client.PostAsync("/api/admin/artworks/create", form);
            Assert.Equal(HttpStatusCode.Created, res.StatusCode);
            return JsonDocument.Parse(await res.Content.ReadAsStringAsync()).RootElement.GetProperty("id").GetInt32();
        }

        private Task<Artwork> Load(int id) =>
            _factory.WithDbAsync(c => c.Artworks.AsNoTracking().FirstAsync(a => a.Id == id));

        [Theory, Trait("scenario", "US1-BE1")]
        [InlineData("HeightCm", "0")]
        [InlineData("WidthCm", "1001")]
        [InlineData("Year", "1800")]
        [InlineData("Year", "9999")]
        public async Task US1_BE1_Put_OutOfRange_Returns400WithFieldName_AndKeepsData(string field, string value)
        {
            var client = await _factory.CreateAuthorizedClientAsync();
            var cat = await SeedCategory();
            var id = await CreateArtwork(client, cat, ("WidthCm", "60"));

            var res = await client.PutAsync($"/api/admin/artworks/{id}", Form(cat, (field, value)));

            Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);
            Assert.Contains(field, await res.Content.ReadAsStringAsync());
            var after = await Load(id);
            Assert.Equal(60, after.WidthCm);
            Assert.Null(after.Year);
        }

        [Fact, Trait("scenario", "US1-BE2")]
        public async Task US1_BE2_LegacyArtwork_PublicCardHasDefaults()
        {
            var art = await _factory.WithDbAsync(c => ArtworkImageFixtures.SeedArtworkAsync(c, 0, "Legacy2"));

            var res = await _factory.CreateClient().GetAsync("/api/public/gallery");

            Assert.Equal(HttpStatusCode.OK, res.StatusCode);
            var list = JsonDocument.Parse(await res.Content.ReadAsStringAsync()).RootElement.GetProperty("artworks");
            var dto = list.EnumerateArray().First(a => a.GetProperty("id").GetInt32() == art.Id);
            Assert.Equal("Available", dto.GetProperty("status").GetString());
            foreach (var f in new[] { "widthCm", "heightCm", "year", "support", "technique" })
                Assert.Equal(JsonValueKind.Null, dto.GetProperty(f).ValueKind);
        }

        [Fact, Trait("scenario", "US1-BE2")]
        public void US1_BE2_Migration_BackfillsStatusFromIsForSale()
        {
            var ops = new AddArtworkCatalogFields().UpOperations;
            var sql = ops.OfType<SqlOperation>().Single().Sql;
            Assert.Equal("UPDATE \"Artworks\" SET \"Status\" = CASE WHEN \"IsForSale\" THEN 0 ELSE 4 END", sql);
            var columns = ops.OfType<AddColumnOperation>().Select(o => o.Name).OrderBy(x => x);
            Assert.Equal(new[] { "HeightCm", "Status", "Support", "Technique", "WidthCm", "Year" }, columns);
        }

        [Fact, Trait("scenario", "US1-BE3")]
        public async Task US1_BE3_IsForSale_FollowsStatus()
        {
            var client = await _factory.CreateAuthorizedClientAsync();
            var cat = await SeedCategory();
            var id = await CreateArtwork(client, cat, ("Status", "Available"));
            Assert.True((await Load(id)).IsForSale);

            var res = await client.PutAsync($"/api/admin/artworks/{id}", Form(cat, ("Status", "Sold")));

            Assert.Equal(HttpStatusCode.NoContent, res.StatusCode);
            var after = await Load(id);
            Assert.False(after.IsForSale);
            Assert.Equal(ArtworkStatus.Sold, after.Status);
        }

        [Fact, Trait("scenario", "US1-BE4")]
        public async Task US1_BE4_AdminAcceptsAndReturnsAllFields_AndClearedTechniqueIsEmpty()
        {
            var client = await _factory.CreateAuthorizedClientAsync();
            var cat = await SeedCategory();
            var id = await CreateArtwork(client, cat,
                ("Status", "PrivateCollection"), ("WidthCm", "60"), ("HeightCm", "80"),
                ("Year", "2024"), ("Support", "холст"), ("Technique", "масло"));

            var list = JsonDocument.Parse(await client.GetStringAsync("/api/admin/artworks")).RootElement;
            var dto = list.EnumerateArray().First(a => a.GetProperty("id").GetInt32() == id);
            Assert.Equal("PrivateCollection", dto.GetProperty("status").GetString());
            Assert.Equal(60, dto.GetProperty("widthCm").GetInt32());
            Assert.Equal(80, dto.GetProperty("heightCm").GetInt32());
            Assert.Equal(2024, dto.GetProperty("year").GetInt32());
            Assert.Equal("холст", dto.GetProperty("support").GetString());
            Assert.Equal("масло", dto.GetProperty("technique").GetString());

            await client.PutAsync($"/api/admin/artworks/{id}",
                Form(cat, ("Status", "PrivateCollection"), ("Technique", "")));

            var after = await Load(id);
            Assert.True(string.IsNullOrEmpty(after.Technique));
            Assert.Null(after.WidthCm);
        }

        [Fact, Trait("scenario", "US1-BE4")]
        public async Task US1_BE4_TechniqueOver100Chars_Returns400()
        {
            var client = await _factory.CreateAuthorizedClientAsync();
            var cat = await SeedCategory();
            var id = await CreateArtwork(client, cat);

            var res = await client.PutAsync($"/api/admin/artworks/{id}", Form(cat, ("Technique", new string('x', 101))));

            Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);
            Assert.Contains("Technique", await res.Content.ReadAsStringAsync());
        }
    }
}
