using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.DependencyInjection;
using MomSite.Core.Models;
using MomSite.Infrastructure.Data;
using Xunit;
using static MomSite.Tests.Catalog.CatalogTestWorkbook;

namespace MomSite.Tests.Catalog;

[Collection("AdminEnvIntegration")]
public class CatalogImportEndpointTests : IClassFixture<AdminMessagesWebApplicationFactory>
{
    private readonly AdminMessagesWebApplicationFactory _factory;

    public CatalogImportEndpointTests(AdminMessagesWebApplicationFactory factory) => _factory = factory;

    private async Task<HttpClient> AuthClient()
    {
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            db.Database.EnsureCreated();
            if (!db.Categories.Any()) { db.Categories.Add(new Category { Name = "Живопись" }); db.SaveChanges(); }
        }
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", await _factory.GetAdminTokenAsync(client));
        return client;
    }

    private static MultipartFormDataContent Form(byte[] bytes, string name = "c.xlsx")
    {
        var c = new MultipartFormDataContent();
        var f = new ByteArrayContent(bytes);
        f.Headers.ContentType = new MediaTypeHeaderValue("application/octet-stream");
        c.Add(f, "file", name);
        return c;
    }

    [Theory]
    [InlineData("/api/admin/catalog/import?dryRun=true")]
    [InlineData("/api/admin/catalog/import/rollback")]
    public async Task Without_token_returns_401(string url)
    {
        var r = await _factory.CreateClient().PostAsync(url, Form(new byte[] { 1 }));
        Assert.Equal(HttpStatusCode.Unauthorized, r.StatusCode);
    }

    [Fact]
    public async Task DryRun_returns_report_and_apply_returns_log_id_then_rollback_ok()
    {
        var client = await AuthClient();
        var bytes = Build(new[] { Row(("Название", "Эндпоинт-тест " + Guid.NewGuid().ToString("N")[..6])) }).ToArray();

        var dry = await client.PostAsync("/api/admin/catalog/import?dryRun=true", Form(bytes));
        Assert.Equal(HttpStatusCode.OK, dry.StatusCode);
        var dryJson = await dry.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(1, dryJson.GetProperty("summary").GetProperty("created").GetInt32());
        Assert.Equal(JsonValueKind.Null, dryJson.GetProperty("logId").ValueKind);

        var apply = await client.PostAsync("/api/admin/catalog/import?dryRun=false", Form(bytes));
        Assert.Equal(HttpStatusCode.OK, apply.StatusCode);
        Assert.True((await apply.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("logId").GetInt32() > 0);

        var rb = await client.PostAsync("/api/admin/catalog/import/rollback", null);
        Assert.Equal(HttpStatusCode.OK, rb.StatusCode);
        Assert.Equal(1, (await rb.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("deletedDrafts").GetInt32());

        var again = await client.PostAsync("/api/admin/catalog/import/rollback", null);
        Assert.Equal(HttpStatusCode.NotFound, again.StatusCode);
    }

    [Fact]
    public async Task Non_xlsx_returns_400_with_code()
    {
        var client = await AuthClient();
        var r = await client.PostAsync("/api/admin/catalog/import", Form(new byte[] { 1, 2, 3 }, "c.csv"));
        Assert.Equal(HttpStatusCode.BadRequest, r.StatusCode);
        Assert.Equal("not_xlsx", (await r.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("error").GetString());
    }

    [Fact]
    public async Task Missing_sheet_returns_400_with_code()
    {
        var client = await AuthClient();
        var bytes = Build(new[] { Row(("ID", 1)) }, catalogSheet: "Лист1").ToArray();
        var r = await client.PostAsync("/api/admin/catalog/import", Form(bytes));
        Assert.Equal(HttpStatusCode.BadRequest, r.StatusCode);
        Assert.Equal("sheet_missing", (await r.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("error").GetString());
    }
}
