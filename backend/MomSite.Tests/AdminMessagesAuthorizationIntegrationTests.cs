using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using MomSite.Core.Models;
using MomSite.Infrastructure.Data;
using Xunit;

namespace MomSite.Tests
{
    // @S2-AS1: real end-to-end proof that the messages admin section is
    // protected by the actual JWT authentication pipeline configured in
    // Program.cs — not just by reflecting over [Authorize] attributes.
    // A misconfigured JWT scheme (wrong key, missing middleware order,
    // AllowAnonymous left on by mistake, etc.) would make this test fail,
    // where the reflection-only test cannot detect it.
    public class AdminMessagesAuthorizationIntegrationTests
        : IClassFixture<AdminMessagesWebApplicationFactory>
    {
        private readonly AdminMessagesWebApplicationFactory _factory;

        public AdminMessagesAuthorizationIntegrationTests(AdminMessagesWebApplicationFactory factory)
        {
            _factory = factory;
        }

        public static IEnumerable<object[]> ProtectedMessageRequests()
        {
            yield return new object[] { HttpMethod.Get, "/api/admin/messages" };
            yield return new object[] { HttpMethod.Get, "/api/admin/messages/unread-count" };
            yield return new object[] { HttpMethod.Get, "/api/admin/messages/1" };
            yield return new object[] { new HttpMethod("PATCH"), "/api/admin/messages/1/archive" };
        }

        [Theory]
        [Trait("Scenario", "S2-AS1")]
        [MemberData(nameof(ProtectedMessageRequests))]
        public async Task MessageEndpoint_WithoutToken_Returns401(HttpMethod method, string url)
        {
            var client = _factory.CreateClient();

            var response = await client.SendAsync(new HttpRequestMessage(method, url));

            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        [Theory]
        [Trait("Scenario", "S2-AS1")]
        [InlineData("GET", "/api/admin/messages", 200)]
        [InlineData("GET", "/api/admin/messages/unread-count", 200)]
        [InlineData("GET", "/api/admin/messages/1", 200)]
        [InlineData("PATCH", "/api/admin/messages/1/archive", 200)]
        public async Task MessageEndpoint_WithValidToken_ReturnsSuccess(string methodStr, string url, int expectedStatusCode)
        {
            await _factory.SeedMessageAsync();
            var client = _factory.CreateClient();
            var token = await _factory.GetAdminTokenAsync(client);
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

            var method = methodStr == "PATCH" ? new HttpMethod("PATCH") : new HttpMethod(methodStr);
            var response = await client.SendAsync(new HttpRequestMessage(method, url));

            Assert.Equal((HttpStatusCode)expectedStatusCode, response.StatusCode);
        }

        [Theory]
        [Trait("Scenario", "S2-AS1")]
        [MemberData(nameof(ProtectedMessageRequests))]
        public async Task MessageEndpoint_WithEmptyBearerToken_Returns401(HttpMethod method, string url)
        {
            var client = _factory.CreateClient();
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", "");

            var response = await client.SendAsync(new HttpRequestMessage(method, url));

            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        [Theory]
        [Trait("Scenario", "S2-AS1")]
        [MemberData(nameof(ProtectedMessageRequests))]
        public async Task MessageEndpoint_WithMalformedToken_Returns401(HttpMethod method, string url)
        {
            var client = _factory.CreateClient();
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", "not.a.valid.jwt");

            var response = await client.SendAsync(new HttpRequestMessage(method, url));

            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        [Theory]
        [Trait("Scenario", "S2-AS1")]
        [MemberData(nameof(ProtectedMessageRequests))]
        public async Task MessageEndpoint_WithWronglySignedToken_Returns401(HttpMethod method, string url)
        {
            var client = _factory.CreateClient();
            var wrongKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes("wrong-secret-key-wrong-secret-ke"));
            var wrongToken = _factory.GenerateTokenWithKey(wrongKey);
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", wrongToken);

            var response = await client.SendAsync(new HttpRequestMessage(method, url));

            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        [Theory]
        [Trait("Scenario", "S2-AS1")]
        [MemberData(nameof(ProtectedMessageRequests))]
        public async Task MessageEndpoint_WithWrongIssuer_Returns401(HttpMethod method, string url)
        {
            var client = _factory.CreateClient();
            var token = _factory.GenerateTokenWithCustomIssuer("wrong-issuer");
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

            var response = await client.SendAsync(new HttpRequestMessage(method, url));

            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        [Theory]
        [Trait("Scenario", "S2-AS1")]
        [MemberData(nameof(ProtectedMessageRequests))]
        public async Task MessageEndpoint_WithWrongAudience_Returns401(HttpMethod method, string url)
        {
            var client = _factory.CreateClient();
            var token = _factory.GenerateTokenWithCustomAudience("wrong-audience");
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

            var response = await client.SendAsync(new HttpRequestMessage(method, url));

            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        [Theory]
        [Trait("Scenario", "S2-AS1")]
        [MemberData(nameof(ProtectedMessageRequests))]
        public async Task MessageEndpoint_WithExpiredToken_Returns401(HttpMethod method, string url)
        {
            var client = _factory.CreateClient();
            var token = _factory.GenerateExpiredToken();
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

            var response = await client.SendAsync(new HttpRequestMessage(method, url));

            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }
    }

    public class AdminMessagesWebApplicationFactory : WebApplicationFactory<Program>
    {
        private const string TestJwtSecret = "integration-test-jwt-signing-secret-32bytes";
        private const string TestAdminPassword = "integration-test-admin-password";

        private readonly SqliteConnection _connection = new("DataSource=:memory:");

        public AdminMessagesWebApplicationFactory()
        {
            _connection.Open();

            // Program.cs reads JWT:Secret straight off builder.Configuration while
            // the app is being built, which happens BEFORE any ConfigureAppConfiguration
            // delegate registered here runs. The controller, by contrast, resolves
            // IConfiguration at request time. Overriding through ConfigureAppConfiguration
            // therefore desynchronises the two: the token gets signed with the override
            // and validated with appsettings' value, yielding a bogus 401. Environment
            // variables are picked up by the default configuration sources during the
            // build itself, so both sides see the same key.
            //
            // The override is needed at all because appsettings ships a 15-byte secret
            // ("test-secret-key") and HS256 requires at least 16 bytes / 128 bits.
            Environment.SetEnvironmentVariable("JWT__Secret", TestJwtSecret);
            Environment.SetEnvironmentVariable("AdminPassword", TestAdminPassword);
        }

        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.UseEnvironment("Testing");

            builder.ConfigureServices(services =>
            {
                // AddDbContext registers more than just DbContextOptions<T> (pool
                // configuration entries, IDbContextOptionsConfiguration<T>, etc.) —
                // all of it is still wired to Npgsql, so remove everything keyed to
                // ApplicationDbContext before re-registering it against Sqlite.
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

        public async Task<string> GetAdminTokenAsync(HttpClient client)
        {
            var response = await client.PostAsJsonAsync("/api/admin/login", new { Username = "admin", Password = TestAdminPassword });
            response.EnsureSuccessStatusCode();
            var payload = await response.Content.ReadFromJsonAsync<LoginResponse>();
            return payload!.Token;
        }

        public string GenerateTokenWithKey(SymmetricSecurityKey key)
        {
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
            var claims = new[]
            {
                new Claim(ClaimTypes.Name, "admin"),
                new Claim(ClaimTypes.Role, "Admin")
            };

            var token = new JwtSecurityToken(
                issuer: "mom-site",
                audience: "mom-site-client",
                claims: claims,
                expires: DateTime.UtcNow.AddHours(24),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        public string GenerateTokenWithCustomIssuer(string issuer)
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(TestJwtSecret));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
            var claims = new[]
            {
                new Claim(ClaimTypes.Name, "admin"),
                new Claim(ClaimTypes.Role, "Admin")
            };

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: "mom-site-client",
                claims: claims,
                expires: DateTime.UtcNow.AddHours(24),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        public string GenerateTokenWithCustomAudience(string audience)
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(TestJwtSecret));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
            var claims = new[]
            {
                new Claim(ClaimTypes.Name, "admin"),
                new Claim(ClaimTypes.Role, "Admin")
            };

            var token = new JwtSecurityToken(
                issuer: "mom-site",
                audience: audience,
                claims: claims,
                expires: DateTime.UtcNow.AddHours(24),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        public string GenerateExpiredToken()
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(TestJwtSecret));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
            var claims = new[]
            {
                new Claim(ClaimTypes.Name, "admin"),
                new Claim(ClaimTypes.Role, "Admin")
            };

            var token = new JwtSecurityToken(
                issuer: "mom-site",
                audience: "mom-site-client",
                claims: claims,
                expires: DateTime.UtcNow.AddSeconds(-10),  // Expired 10 seconds ago
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        public async Task SeedMessageAsync()
        {
            using var scope = Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            if (!context.ContactMessages.Any())
            {
                context.ContactMessages.Add(new ContactMessage
                {
                    Name = "Иван",
                    Email = "ivan@example.com",
                    Subject = "S",
                    Message = "M",
                    Status = ContactMessageStatus.New,
                    CreatedAt = DateTime.UtcNow
                });
                await context.SaveChangesAsync();
            }
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
