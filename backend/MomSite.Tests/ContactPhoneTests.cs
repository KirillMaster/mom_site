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

        private static object Body(string? email, string? phone, string name = "Анна", string subject = "Хочу картину", string message = "Расскажите подробнее") => new
        {
            name, email, phone, subject, message
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
            Assert.Contains("Укажите email, телефон или Telegram", await res.Content.ReadAsStringAsync());
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

        // ====== Degradation Mode Boundary & Error Path Tests ======

        [Theory, Trait("scenario", "US3-BE1,US3-BE2")]
        [InlineData("")]
        [InlineData("   ")]
        public async Task Degradation_BothEmpty_Phone_And_Email_Returns400(string empty)
        {
            var name = "Deg-both-empty-" + Guid.NewGuid().ToString("N");
            var res = await Post(Body(empty, empty, name));
            Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);
            Assert.Equal(0, await Count(name));
        }

        [Fact, Trait("scenario", "US3-BE1")]
        public async Task Degradation_BothEmailAndPhone_Provided_Returns200()
        {
            var name = "Deg-both-" + Guid.NewGuid().ToString("N");
            var res = await Post(Body("test@example.com", "+7 900 111-22-33", name));
            Assert.Equal(HttpStatusCode.OK, res.StatusCode);
            var saved = await _factory.WithDbAsync(c => c.ContactMessages.AsNoTracking().SingleAsync(m => m.Name == name));
            Assert.Equal("test@example.com", saved.Email);
            Assert.Equal("+7 900 111-22-33", saved.Phone);
        }

        [Theory, Trait("scenario", "US3-BE3")]
        [InlineData("valid@example.com", HttpStatusCode.OK)]
        [InlineData("test+tag@domain.co.uk", HttpStatusCode.OK)]
        [InlineData("invalid", HttpStatusCode.BadRequest)]
        [InlineData("@example.com", HttpStatusCode.BadRequest)]
        [InlineData("user@", HttpStatusCode.BadRequest)]
        public async Task Degradation_EmailVariants_Validation(string email, HttpStatusCode expected)
        {
            var name = "Deg-email-" + Guid.NewGuid().ToString("N");
            var res = await Post(Body(email, null, name));
            Assert.Equal(expected, res.StatusCode);
            Assert.Equal(expected == HttpStatusCode.OK ? 1 : 0, await Count(name));
        }

        [Theory, Trait("scenario", "US3-BE3")]
        [InlineData("  +7 900 111-22-33  ")]
        [InlineData("+7 900 111-22-33")]
        [InlineData("8-900-111-22-33")]
        [InlineData("89001112233")]
        public async Task Degradation_PhoneFormats_Accepted(string phone)
        {
            var name = "Deg-phone-fmt-" + Guid.NewGuid().ToString("N");
            var res = await Post(Body(null, phone, name));
            Assert.Equal(HttpStatusCode.OK, res.StatusCode);
            var saved = await _factory.WithDbAsync(c => c.ContactMessages.AsNoTracking().SingleAsync(m => m.Name == name));
            // Phone should be trimmed
            Assert.Equal(phone.Trim(), saved.Phone);
        }

        [Theory, Trait("scenario", "US3-BE3")]
        [InlineData(99, HttpStatusCode.OK)]
        [InlineData(100, HttpStatusCode.OK)]
        [InlineData(101, HttpStatusCode.BadRequest)]
        [InlineData(150, HttpStatusCode.BadRequest)]
        public async Task Degradation_PhoneLengthBoundary_Strict(int length, HttpStatusCode expected)
        {
            var name = "Deg-phone-len-" + Guid.NewGuid().ToString("N");
            var phone = new string('x', length);
            var res = await Post(Body(null, phone, name));
            Assert.Equal(expected, res.StatusCode);
            Assert.Equal(expected == HttpStatusCode.OK ? 1 : 0, await Count(name));
        }

        [Theory, Trait("scenario", "US3-BE2")]
        [InlineData("")]
        [InlineData("   ")]
        public async Task Degradation_InvalidEmailWithValidPhone_Returns200(string invalidEmail)
        {
            var name = "Deg-inv-email-valid-phone-" + Guid.NewGuid().ToString("N");
            var res = await Post(Body(invalidEmail, "+7 900 111-22-33", name));
            Assert.Equal(HttpStatusCode.OK, res.StatusCode);
            var saved = await _factory.WithDbAsync(c => c.ContactMessages.AsNoTracking().SingleAsync(m => m.Name == name));
            Assert.Null(saved.Email);
            Assert.Equal("+7 900 111-22-33", saved.Phone);
        }

        [Theory, Trait("scenario", "US3-BE3")]
        [InlineData("valid@example.com", "")]
        [InlineData("valid@example.com", "   ")]
        public async Task Degradation_ValidEmailWithEmptyPhone_Returns200(string email, string phone)
        {
            var name = "Deg-valid-email-empty-phone-" + Guid.NewGuid().ToString("N");
            var res = await Post(Body(email, phone, name));
            Assert.Equal(HttpStatusCode.OK, res.StatusCode);
            var saved = await _factory.WithDbAsync(c => c.ContactMessages.AsNoTracking().SingleAsync(m => m.Name == name));
            Assert.Equal(email, saved.Email);
            Assert.Null(saved.Phone);
        }

        [Theory, Trait("scenario", "US3-BE1")]
        [InlineData(1, HttpStatusCode.OK)]
        [InlineData(199, HttpStatusCode.OK)]
        [InlineData(200, HttpStatusCode.OK)]
        [InlineData(201, HttpStatusCode.BadRequest)]
        public async Task Degradation_NameLengthBoundary(int length, HttpStatusCode expected)
        {
            var name = new string('А', length);
            var res = await Post(Body(null, "+7 900", name));
            Assert.Equal(expected, res.StatusCode);
        }

        [Theory, Trait("scenario", "US3-BE1")]
        [InlineData("")]
        [InlineData("   ")]
        public async Task Degradation_SubjectEmpty_Returns400(string subject)
        {
            var name = "Deg-subject-empty-" + Guid.NewGuid().ToString("N");
            var res = await _factory.CreateClient().PostAsJsonAsync("/api/public/contact-message", new
            {
                name = name, email = "test@example.com", phone = "", subject = subject, message = "ok"
            });
            Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);
        }

        [Theory, Trait("scenario", "US3-BE1")]
        [InlineData(1, HttpStatusCode.OK)]
        [InlineData(199, HttpStatusCode.OK)]
        [InlineData(200, HttpStatusCode.OK)]
        [InlineData(201, HttpStatusCode.BadRequest)]
        public async Task Degradation_SubjectLengthBoundary(int length, HttpStatusCode expected)
        {
            var name = "Deg-subject-len-" + Guid.NewGuid().ToString("N");
            var subject = new string('х', length);
            var res = await Post(Body(null, "+7 900", name, subject: subject));
            Assert.Equal(expected, res.StatusCode);
        }

        [Theory, Trait("scenario", "US3-BE1")]
        [InlineData("")]
        [InlineData("   ")]
        public async Task Degradation_MessageEmpty_Returns400(string message)
        {
            var name = "Deg-message-empty-" + Guid.NewGuid().ToString("N");
            var res = await _factory.CreateClient().PostAsJsonAsync("/api/public/contact-message", new
            {
                name = name, email = "test@example.com", phone = "", subject = "ok", message = message
            });
            Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);
        }

        [Theory, Trait("scenario", "US3-BE1")]
        [InlineData(1, HttpStatusCode.OK)]
        [InlineData(4999, HttpStatusCode.OK)]
        [InlineData(5000, HttpStatusCode.OK)]
        [InlineData(5001, HttpStatusCode.BadRequest)]
        public async Task Degradation_MessageLengthBoundary(int length, HttpStatusCode expected)
        {
            var name = "Deg-message-len-" + Guid.NewGuid().ToString("N");
            var message = new string('м', length);
            var res = await Post(Body(null, "+7 900", name, message: message));
            Assert.Equal(expected, res.StatusCode);
        }

        [Fact, Trait("scenario", "US3-BE4")]
        public void Degradation_TelegramNotifier_ShowsDashWhenEmailNull()
        {
            var text = TelegramNotifier.BuildText(new ContactMessage
            {
                Name = "Тест", Email = null, Phone = "+7 900", Subject = "S", Message = "M"
            });
            Assert.Contains("Email: —", text);
            Assert.DoesNotContain("Email: null", text);
        }

        [Fact, Trait("scenario", "US3-BE4")]
        public void Degradation_EmailNotifier_ShowsDashWhenEmailNull()
        {
            var (html, text) = EmailNotifier.BuildBodies(new ContactMessage
            {
                Name = "Тест", Email = null, Phone = "+7 900", Subject = "S", Message = "M"
            });
            Assert.Contains("Email: —", text);
            Assert.DoesNotContain("Email: null", text);
        }

        [Fact, Trait("scenario", "US3-BE4")]
        public void Degradation_AdminDto_IncludesPhoneWhenEmailNull()
        {
            var dto = new ContactMessage
            {
                Name = "Тест", Email = null, Phone = "+7 900", Subject = "S", Message = "M"
            }.ToAdminDto();
            Assert.NotNull(dto.Phone);
            Assert.Null(dto.Email);
        }

        [Theory, Trait("scenario", "US3-BE1")]
        [InlineData(199, HttpStatusCode.OK)]
        [InlineData(200, HttpStatusCode.OK)]
        [InlineData(201, HttpStatusCode.BadRequest)]
        public async Task Degradation_EmailMaxLengthBoundary(int length, HttpStatusCode expected)
        {
            var name = "Deg-email-max-" + Guid.NewGuid().ToString("N");
            var email = new string('a', length - 9) + "@test.com"; // @test.com is 9 chars
            var res = await Post(Body(email, null, name));
            Assert.Equal(expected, res.StatusCode);
        }

        [Fact, Trait("scenario", "US3-BE2")]
        public async Task Degradation_NullEmailAndNullPhone_Returns400()
        {
            var name = "Deg-both-null-" + Guid.NewGuid().ToString("N");
            var res = await _factory.CreateClient().PostAsJsonAsync("/api/public/contact-message", new
            {
                name = name, email = (string?)null, phone = (string?)null, subject = "ok", message = "msg"
            });
            Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);
            Assert.Equal(0, await Count(name));
        }

        [Fact, Trait("scenario", "US3-BE1")]
        public async Task Degradation_PhoneWithLeadingTrailingSpaces_Trimmed()
        {
            var name = "Deg-phone-trim-" + Guid.NewGuid().ToString("N");
            var res = await Post(Body(null, "   +7 900 111-22-33   ", name));
            Assert.Equal(HttpStatusCode.OK, res.StatusCode);
            var saved = await _factory.WithDbAsync(c => c.ContactMessages.AsNoTracking().SingleAsync(m => m.Name == name));
            Assert.Equal("+7 900 111-22-33", saved.Phone);
        }

        [Fact, Trait("scenario", "US3-BE1")]
        public async Task Degradation_EmailWithLeadingTrailingSpaces_Trimmed()
        {
            var name = "Deg-email-trim-" + Guid.NewGuid().ToString("N");
            var res = await Post(Body("   test@example.com   ", null, name));
            Assert.Equal(HttpStatusCode.OK, res.StatusCode);
            var saved = await _factory.WithDbAsync(c => c.ContactMessages.AsNoTracking().SingleAsync(m => m.Name == name));
            Assert.Equal("test@example.com", saved.Email);
        }
    }
}
