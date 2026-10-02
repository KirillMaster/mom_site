using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using MomSite.API.DTOs;
using MomSite.Core.Interfaces;
using MomSite.Core.Models;
using MomSite.Infrastructure.Notifications;

namespace MomSite.Tests
{
    public class ContactPhoneWebApplicationFactory : ArtworkImagesWebApplicationFactory
    {
        private sealed class AlwaysAllow : IContactRateLimiter
        {
            public bool TryAcquire(string clientKey) => true;
        }

        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            base.ConfigureWebHost(builder);
            builder.ConfigureServices(s =>
            {
                s.AddSingleton<IContactRateLimiter, AlwaysAllow>();
            });
        }
    }

    [Collection("AdminEnvIntegration")]
    public class ContactPhoneTests : IClassFixture<ContactPhoneWebApplicationFactory>
    {
        private readonly ContactPhoneWebApplicationFactory _factory;

        public ContactPhoneTests(ContactPhoneWebApplicationFactory factory) => _factory = factory;

        private static object Body(string? email, string? phone, string name = "Анна") => new
        {
            name, email, phone, subject = "Хочу картину", message = "Расскажите подробнее"
        };

        private Task<HttpResponseMessage> Post(object body) =>
            _factory.CreateClient().PostAsJsonAsync("/api/public/contact-message", body);

        private Task<int> Count(string name) =>
            _factory.WithDbAsync(c => c.ContactMessages.CountAsync(m => m.Name == name));

        [Fact, Trait("scenario", "US3-BE1")]
        public async Task US3_BE1_PhoneWithoutEmail_Returns200AndSavesPhone()
        {
            var name = "BE1-" + Guid.NewGuid().ToString("N");

            var res = await Post(Body("", "+7 900 111-22-33", name));

            Assert.Equal(HttpStatusCode.OK, res.StatusCode);
            var saved = await _factory.WithDbAsync(c => c.ContactMessages.AsNoTracking().SingleAsync(m => m.Name == name));
            Assert.Equal("+7 900 111-22-33", saved.Phone);
            Assert.Null(saved.Email);
        }

        [Theory, Trait("scenario", "US3-BE2")]
        [InlineData(null, null)]
        [InlineData("", "")]
        [InlineData("  ", "   ")]
        public async Task US3_BE2_NoEmailNoPhone_Returns400AndNotSaved(string? email, string? phone)
        {
            var name = "BE2-" + Guid.NewGuid().ToString("N");

            var res = await Post(Body(email, phone, name));

            Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);
            Assert.Contains("Укажите email или телефон", await res.Content.ReadAsStringAsync());
            Assert.Equal(0, await Count(name));
        }

        [Fact, Trait("scenario", "US3-BE3")]
        public async Task US3_BE3_InvalidEmail_Returns400AndNotSaved()
        {
            var name = "BE3a-" + Guid.NewGuid().ToString("N");

            var res = await Post(Body("not-an-email", null, name));

            Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);
            Assert.Equal(0, await Count(name));
        }

        [Theory, Trait("scenario", "US3-BE3")]
        [InlineData(100, HttpStatusCode.OK)]
        [InlineData(101, HttpStatusCode.BadRequest)]
        public async Task US3_BE3_PhoneLength_Boundary(int length, HttpStatusCode expected)
        {
            var name = "BE3b-" + Guid.NewGuid().ToString("N");

            var res = await Post(Body(null, new string('7', length), name));

            Assert.Equal(expected, res.StatusCode);
            Assert.Equal(expected == HttpStatusCode.OK ? 1 : 0, await Count(name));
        }

        [Fact, Trait("scenario", "US3-BE4")]
        public void US3_BE4_TelegramText_ContainsPhone_AndSurvivesNullEmail()
        {
            var text = TelegramNotifier.BuildText(new ContactMessage
            {
                Name = "Анна", Email = null, Phone = "+7 900 111-22-33", Subject = "S", Message = "M"
            });

            Assert.Contains("Телефон/мессенджер: +7 900 111-22-33", text);
            Assert.Contains("Email: —", text);
        }

        [Fact, Trait("scenario", "US3-BE4")]
        public void US3_BE4_EmailBodies_ContainPhone_AndSurviveNullEmail()
        {
            var (html, text) = EmailNotifier.BuildBodies(new ContactMessage
            {
                Name = "Анна", Email = null, Phone = "8 900 111-22-33", Subject = "S", Message = "M"
            });

            Assert.Contains("8 900 111-22-33", html);
            Assert.Contains("Телефон/мессенджер: 8 900 111-22-33", text);
            Assert.Contains("Email: —", text);
        }

        [Fact, Trait("scenario", "US3-BE4")]
        public void US3_BE4_AdminDto_ExposesPhone()
        {
            var dto = new ContactMessage
            {
                Name = "Анна", Email = null, Phone = "+7 900", Subject = "S", Message = "M"
            }.ToAdminDto();

            Assert.Equal("+7 900", dto.Phone);
            Assert.Null(dto.Email);
        }
    }
}
