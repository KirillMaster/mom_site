using System.Linq;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using MomSite.Core.Models;
using MomSite.Infrastructure.Data;
using Xunit;

namespace MomSite.Tests
{
    // Slice 3 — private CRUD / moderation for reviews. Exercises the real
    // JWT auth pipeline (same as AdminMessagesAuthorizationIntegrationTests)
    // through an in-process WebApplicationFactory backed by Sqlite.
    public class AdminReviewsControllerTests : IClassFixture<AdminReviewsWebApplicationFactory>
    {
        private readonly AdminReviewsWebApplicationFactory _factory;

        public AdminReviewsControllerTests(AdminReviewsWebApplicationFactory factory)
        {
            _factory = factory;
        }

        [Fact]
        [Trait("Scenario", "S3-AS1")]
        public async Task GetReviews_WithoutToken_Returns401()
        {
            var client = _factory.CreateClient();

            var response = await client.GetAsync("/api/admin/reviews");

            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        [Fact]
        [Trait("Scenario", "S3-AS2")]
        public async Task GetReviews_AsAdmin_ReturnsPublishedAndUnpublished()
        {
            await _factory.ResetDatabaseAsync();
            var published = await _factory.SeedReviewAsync("A", isPublished: true);
            var unpublished = await _factory.SeedReviewAsync("B", isPublished: false);

            var client = await _factory.CreateAuthorizedClientAsync();
            var response = await client.GetAsync("/api/admin/reviews");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var reviews = await response.Content.ReadFromJsonAsync<List<ReviewDto>>();
            Assert.Contains(reviews!, r => r.Id == published.Id);
            Assert.Contains(reviews!, r => r.Id == unpublished.Id);
        }

        [Fact]
        [Trait("Scenario", "S3-AS3")]
        public async Task PublishReview_SetsIsPublishedAndPublishedAt()
        {
            await _factory.ResetDatabaseAsync();
            var review = await _factory.SeedReviewAsync("B", isPublished: false);

            var client = await _factory.CreateAuthorizedClientAsync();
            var response = await client.PatchAsync($"/api/admin/reviews/{review.Id}/publish", content: null);

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var dto = await response.Content.ReadFromJsonAsync<ReviewDto>();
            Assert.True(dto!.IsPublished);
            Assert.NotNull(dto.PublishedAt);

            var stored = await _factory.GetReviewAsync(review.Id);
            Assert.True(stored!.IsPublished);
            Assert.NotNull(stored.PublishedAt);
        }

        [Fact]
        [Trait("Scenario", "S3-AS4")]
        public async Task UnpublishReview_ClearsIsPublishedButKeepsText()
        {
            await _factory.ResetDatabaseAsync();
            var review = await _factory.SeedReviewAsync("A", isPublished: true, text: "хороший отзыв");

            var client = await _factory.CreateAuthorizedClientAsync();
            var response = await client.PatchAsync($"/api/admin/reviews/{review.Id}/unpublish", content: null);

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var dto = await response.Content.ReadFromJsonAsync<ReviewDto>();
            Assert.False(dto!.IsPublished);
            Assert.Equal("хороший отзыв", dto.Text);

            var stored = await _factory.GetReviewAsync(review.Id);
            Assert.False(stored!.IsPublished);
            Assert.Equal("хороший отзыв", stored.Text);
        }

        [Fact]
        [Trait("Scenario", "S3-AS5")]
        public async Task UpdateReview_ChangesText()
        {
            await _factory.ResetDatabaseAsync();
            var review = await _factory.SeedReviewAsync("A", text: "старый текст");

            var client = await _factory.CreateAuthorizedClientAsync();
            var response = await client.PutAsJsonAsync($"/api/admin/reviews/{review.Id}", new { Text = "новый текст" });

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var dto = await response.Content.ReadFromJsonAsync<ReviewDto>();
            Assert.Equal("новый текст", dto!.Text);

            var stored = await _factory.GetReviewAsync(review.Id);
            Assert.Equal("новый текст", stored!.Text);
        }

        [Fact]
        [Trait("Scenario", "S3-AS6")]
        public async Task DeleteReview_RemovesFromDatabaseAndAdminList()
        {
            await _factory.ResetDatabaseAsync();
            var review = await _factory.SeedReviewAsync("C");

            var client = await _factory.CreateAuthorizedClientAsync();
            var deleteResponse = await client.DeleteAsync($"/api/admin/reviews/{review.Id}");
            Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);

            var listResponse = await client.GetAsync("/api/admin/reviews");
            var reviews = await listResponse.Content.ReadFromJsonAsync<List<ReviewDto>>();
            Assert.DoesNotContain(reviews!, r => r.Id == review.Id);

            Assert.Null(await _factory.GetReviewAsync(review.Id));
        }

        [Fact]
        [Trait("Scenario", "S3-AS5")]
        public async Task UpdateReview_UnknownId_Returns404()
        {
            var client = await _factory.CreateAuthorizedClientAsync();

            var response = await client.PutAsJsonAsync("/api/admin/reviews/999999", new { Text = "x" });

            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        [Fact]
        [Trait("Scenario", "S3-AS2")]
        public async Task CreateReview_InvalidInput_Returns400()
        {
            var client = await _factory.CreateAuthorizedClientAsync();

            var response = await client.PostAsJsonAsync("/api/admin/reviews", new { AuthorName = "", Text = "", Rating = 0 });

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }

        private sealed class ReviewDto
        {
            public int Id { get; set; }
            public string AuthorName { get; set; } = string.Empty;
            public string Text { get; set; } = string.Empty;
            public bool IsPublished { get; set; }
            public DateTime? PublishedAt { get; set; }
        }
    }

    public class AdminReviewsWebApplicationFactory : WebApplicationFactory<Program>
    {
        private const string TestJwtSecret = "reviews-integration-test-jwt-signing-secret-32b";
        private const string TestAdminPassword = "reviews-integration-test-admin-password";

        private readonly SqliteConnection _connection = new("DataSource=:memory:");

        public AdminReviewsWebApplicationFactory()
        {
            _connection.Open();
            Environment.SetEnvironmentVariable("JWT__Secret", TestJwtSecret);
            Environment.SetEnvironmentVariable("AdminPassword", TestAdminPassword);

            using var scope = Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            context.Database.EnsureCreated();
        }

        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.UseEnvironment("Testing");

            builder.ConfigureServices(services =>
            {
                var descriptorsToRemove = services
                    .Where(d => d.ServiceType == typeof(ApplicationDbContext)
                             || (d.ServiceType.IsGenericType
                                 && d.ServiceType.GetGenericArguments().Contains(typeof(ApplicationDbContext))))
                    .ToList();

                foreach (var descriptor in descriptorsToRemove)
                {
                    services.Remove(descriptor);
                }

                services.AddDbContext<ApplicationDbContext>(options =>
                {
                    options.UseSqlite(_connection);
                });
            });
        }

        public async Task<HttpClient> CreateAuthorizedClientAsync()
        {
            var client = CreateClient();
            var response = await client.PostAsJsonAsync("/api/admin/login", new { Username = "admin", Password = TestAdminPassword });
            response.EnsureSuccessStatusCode();
            var payload = await response.Content.ReadFromJsonAsync<LoginResponse>();
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", payload!.Token);
            return client;
        }

        public async Task ResetDatabaseAsync()
        {
            using var scope = Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            context.Reviews.RemoveRange(context.Reviews);
            await context.SaveChangesAsync();
        }

        public async Task<Review> SeedReviewAsync(string authorName, bool isPublished = false, string text = "текст отзыва")
        {
            using var scope = Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var review = new Review
            {
                AuthorName = authorName,
                Text = text,
                Rating = 5,
                CreatedAt = DateTime.UtcNow,
                IsPublished = isPublished,
                PublishedAt = isPublished ? DateTime.UtcNow : null
            };
            context.Reviews.Add(review);
            await context.SaveChangesAsync();
            return review;
        }

        public async Task<Review?> GetReviewAsync(int id)
        {
            using var scope = Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            return await context.Reviews.FindAsync(id);
        }

        protected override void Dispose(bool disposing)
        {
            base.Dispose(disposing);
            if (disposing)
            {
                _connection.Dispose();
                Environment.SetEnvironmentVariable("JWT__Secret", null);
                Environment.SetEnvironmentVariable("AdminPassword", null);
            }
        }

        private sealed class LoginResponse
        {
            public string Token { get; set; } = string.Empty;
        }
    }
}
