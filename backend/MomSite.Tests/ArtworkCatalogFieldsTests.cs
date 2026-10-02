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

        [Theory, Trait("scenario", "US1-EC2")]
        [InlineData("1", "1")]
        [InlineData("1", "1000")]
        [InlineData("1000", "1000")]
        [InlineData("1000", "1")]
        public async Task US1_EC2_SizeAtBoundaries_Returns201(string widthValue, string heightValue)
        {
            var client = await _factory.CreateAuthorizedClientAsync();
            var cat = await SeedCategory();

            var id = await CreateArtwork(client, cat, ("WidthCm", widthValue), ("HeightCm", heightValue));

            var artwork = await Load(id);
            Assert.Equal(int.Parse(widthValue), artwork.WidthCm);
            Assert.Equal(int.Parse(heightValue), artwork.HeightCm);
        }

        [Theory, Trait("scenario", "US1-EC3")]
        [InlineData("HeightCm", "1001")]
        [InlineData("WidthCm", "-1")]
        [InlineData("WidthCm", "0")]
        public async Task US1_EC3_SizeOutOfRange_Returns400(string field, string value)
        {
            var client = await _factory.CreateAuthorizedClientAsync();
            var cat = await SeedCategory();
            var id = await CreateArtwork(client, cat);

            var res = await client.PutAsync($"/api/admin/artworks/{id}", Form(cat, (field, value)));

            Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);
            Assert.Contains(field, await res.Content.ReadAsStringAsync());
        }

        [Fact, Trait("scenario", "US1-EC4")]
        public async Task US1_EC4_YearAtMinBoundary1950_Accepts()
        {
            var client = await _factory.CreateAuthorizedClientAsync();
            var cat = await SeedCategory();
            var id = await CreateArtwork(client, cat);

            var res = await client.PutAsync($"/api/admin/artworks/{id}", Form(cat, ("Year", "1950")));

            Assert.Equal(HttpStatusCode.NoContent, res.StatusCode);
            var artwork = await Load(id);
            Assert.Equal(1950, artwork.Year);
        }

        [Fact, Trait("scenario", "US1-EC4")]
        public async Task US1_EC4_YearAtCurrentYear_Accepts()
        {
            var client = await _factory.CreateAuthorizedClientAsync();
            var cat = await SeedCategory();
            var id = await CreateArtwork(client, cat);
            var currentYear = DateTime.UtcNow.Year;

            var res = await client.PutAsync($"/api/admin/artworks/{id}", Form(cat, ("Year", currentYear.ToString())));

            Assert.Equal(HttpStatusCode.NoContent, res.StatusCode);
            var artwork = await Load(id);
            Assert.Equal(currentYear, artwork.Year);
        }

        [Fact, Trait("scenario", "US1-EC5")]
        public async Task US1_EC5_SupportAtExactly100Chars_Accepts()
        {
            var client = await _factory.CreateAuthorizedClientAsync();
            var cat = await SeedCategory();
            var id = await CreateArtwork(client, cat);
            var support = new string('х', 100);

            var res = await client.PutAsync($"/api/admin/artworks/{id}", Form(cat, ("Support", support)));

            Assert.Equal(HttpStatusCode.NoContent, res.StatusCode);
            var artwork = await Load(id);
            Assert.Equal(support, artwork.Support);
        }

        [Fact, Trait("scenario", "US1-EC6")]
        public async Task US1_EC6_SupportOver100Chars_Returns400()
        {
            var client = await _factory.CreateAuthorizedClientAsync();
            var cat = await SeedCategory();
            var id = await CreateArtwork(client, cat);

            var res = await client.PutAsync($"/api/admin/artworks/{id}", Form(cat, ("Support", new string('x', 101))));

            Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);
            Assert.Contains("Support", await res.Content.ReadAsStringAsync());
        }

        [Theory, Trait("scenario", "US1-EC7")]
        [InlineData("Sold")]
        [InlineData("NotForSale")]
        [InlineData("Unavailable")]
        [InlineData("NotMine")]
        [InlineData("PrivateCollection")]
        public async Task US1_EC7_AllStatusValues_Accepted(string statusValue)
        {
            var client = await _factory.CreateAuthorizedClientAsync();
            var cat = await SeedCategory();
            var id = await CreateArtwork(client, cat, ("Status", "Available"));

            var res = await client.PutAsync($"/api/admin/artworks/{id}", Form(cat, ("Status", statusValue)));

            Assert.Equal(HttpStatusCode.NoContent, res.StatusCode);
            var artwork = await Load(id);
            Assert.Equal(statusValue, artwork.Status.ToString());
        }

        [Fact, Trait("scenario", "US1-EC8")]
        public async Task US1_EC8_EmptySupportAndTechnique_Accepted()
        {
            var client = await _factory.CreateAuthorizedClientAsync();
            var cat = await SeedCategory();
            var id = await CreateArtwork(client, cat, ("Support", "холст"), ("Technique", "масло"));

            var res = await client.PutAsync($"/api/admin/artworks/{id}", Form(cat, ("Support", ""), ("Technique", "")));

            Assert.Equal(HttpStatusCode.NoContent, res.StatusCode);
            var artwork = await Load(id);
            Assert.True(string.IsNullOrEmpty(artwork.Support));
            Assert.True(string.IsNullOrEmpty(artwork.Technique));
        }

        [Fact, Trait("scenario", "US1-EC9")]
        public async Task US1_EC9_AllFieldsAtBoundaries_Accepted()
        {
            var client = await _factory.CreateAuthorizedClientAsync();
            var cat = await SeedCategory();
            var currentYear = DateTime.UtcNow.Year;

            var id = await CreateArtwork(client, cat,
                ("WidthCm", "1"), ("HeightCm", "1000"),
                ("Year", currentYear.ToString()), ("Support", new string('х', 100)),
                ("Technique", "масло"), ("Status", "Available"));

            var artwork = await Load(id);
            Assert.Equal(1, artwork.WidthCm);
            Assert.Equal(1000, artwork.HeightCm);
            Assert.Equal(currentYear, artwork.Year);
            Assert.Equal(new string('х', 100), artwork.Support);
            Assert.Equal("масло", artwork.Technique);
            Assert.Equal(ArtworkStatus.Available, artwork.Status);
        }
    }
}
