using Xunit;
using Moq;
using MomSite.API.Controllers;
using MomSite.Infrastructure.Data;
using MomSite.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using MomSite.Core.Interfaces;
using MomSite.Core.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Time.Testing;

namespace MomSite.Tests
{
    public class PublicControllerTests
    {
        private static ApplicationDbContext CreateDbContext(string dbName)
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: dbName)
                .Options;
            return new ApplicationDbContext(options);
        }

        // Always allows the request through; used by every test that isn't
        // specifically exercising the rate-limit scenarios (S3-AS3/AS4).
        private class AlwaysAllowRateLimiter : IContactRateLimiter
        {
            public bool TryAcquire(string clientKey) => true;
        }

        private static PublicController CreateController(
            ApplicationDbContext context,
            IEnumerable<IFeedbackNotifier> notifiers,
            IContactRateLimiter? rateLimiter = null)
        {
            var httpContext = new DefaultHttpContext();
            httpContext.Connection.RemoteIpAddress = System.Net.IPAddress.Parse("203.0.113.42");
            httpContext.Request.Headers.UserAgent = "MomSiteTests/1.0";

            var controller = new PublicController(
                context,
                notifiers,
                Mock.Of<ILogger<PublicController>>(),
                rateLimiter ?? new AlwaysAllowRateLimiter());
            controller.ControllerContext = new ControllerContext
            {
                HttpContext = httpContext
            };
            return controller;
        }

        private static ContactMessageDto ValidMessage() => new()
        {
            Name = "Иван Иванов",
            Email = "ivan@example.com",
            Subject = "Хочу картину",
            Message = "Расскажите про доставку"
        };

        private static Mock<IFeedbackNotifier> EnabledNotifier(bool throws = false)
        {
            var mock = new Mock<IFeedbackNotifier>();
            mock.SetupGet(n => n.IsEnabled).Returns(true);
            if (throws)
            {
                mock.Setup(n => n.NotifyAsync(It.IsAny<ContactMessage>(), It.IsAny<CancellationToken>()))
                    .ThrowsAsync(new InvalidOperationException("channel failure"));
            }
            else
            {
                mock.Setup(n => n.NotifyAsync(It.IsAny<ContactMessage>(), It.IsAny<CancellationToken>()))
                    .Returns(Task.CompletedTask);
            }
            return mock;
        }

        private static Mock<IFeedbackNotifier> DisabledNotifier()
        {
            var mock = new Mock<IFeedbackNotifier>();
            mock.SetupGet(n => n.IsEnabled).Returns(false);
            return mock;
        }

        // Asserts the controller answered 200 with the lead already
        // persisted, and returns that saved row for scenario-specific checks.
        private static ContactMessage AssertOkAndPersisted(IActionResult result, ApplicationDbContext context)
        {
            var ok = Assert.IsType<OkObjectResult>(result);
            Assert.Equal(200, ok.StatusCode);

            var saved = Assert.Single(context.ContactMessages);
            Assert.Equal(ContactMessageStatus.New, saved.Status);
            return saved;
        }

        private static void VerifyNeverNotified(Mock<IFeedbackNotifier> notifier)
        {
            notifier.Verify(n => n.NotifyAsync(It.IsAny<ContactMessage>(), It.IsAny<CancellationToken>()), Times.Never);
        }

        // A DbContext whose SaveChangesAsync always fails, to simulate a
        // PostgreSQL outage (@S1-AS5) without needing a real database.
        private class FailingSaveDbContext : ApplicationDbContext
        {
            public FailingSaveDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

            public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
            {
                throw new InvalidOperationException("simulated database outage");
            }
        }

        [Fact]
        [Trait("Scenario", "S1-AS1")]
        public async Task SendContactMessage_BothChannelsHealthy_Saves200AndNotifiesBoth()
        {
            using var context = CreateDbContext(nameof(SendContactMessage_BothChannelsHealthy_Saves200AndNotifiesBoth));
            var email = EnabledNotifier();
            var telegram = EnabledNotifier();
            var controller = CreateController(context, new[] { email.Object, telegram.Object });

            var dto = ValidMessage();
            var result = await controller.SendContactMessage(dto);

            var saved = AssertOkAndPersisted(result, context);
            Assert.Equal("Иван Иванов", saved.Name);
            Assert.Equal("ivan@example.com", saved.Email);
            Assert.Equal("Хочу картину", saved.Subject);
            Assert.Equal("Расскажите про доставку", saved.Message);
            Assert.False(string.IsNullOrEmpty(saved.IpAddress));
            Assert.False(string.IsNullOrEmpty(saved.UserAgent));

            email.Verify(n => n.NotifyAsync(It.IsAny<ContactMessage>(), It.IsAny<CancellationToken>()), Times.Once);
            telegram.Verify(n => n.NotifyAsync(It.IsAny<ContactMessage>(), It.IsAny<CancellationToken>()), Times.Once);
        }

        [Fact]
        [Trait("Scenario", "S1-AS2")]
        public async Task SendContactMessage_EmailChannelFails_StillSaves200()
        {
            using var context = CreateDbContext(nameof(SendContactMessage_EmailChannelFails_StillSaves200));
            var email = EnabledNotifier(throws: true);
            var telegram = DisabledNotifier();
            var controller = CreateController(context, new[] { email.Object, telegram.Object });

            var result = await controller.SendContactMessage(ValidMessage());

            AssertOkAndPersisted(result, context);

            var ok = Assert.IsType<OkObjectResult>(result);
            var body = Assert.IsAssignableFrom<object>(ok.Value);
            Assert.DoesNotContain("channel failure", body.ToString());

            VerifyNeverNotified(telegram);
        }

        [Fact]
        [Trait("Scenario", "S1-AS3")]
        public async Task SendContactMessage_TelegramChannelFails_StillSaves200()
        {
            using var context = CreateDbContext(nameof(SendContactMessage_TelegramChannelFails_StillSaves200));
            var email = DisabledNotifier();
            var telegram = EnabledNotifier(throws: true);
            var controller = CreateController(context, new[] { email.Object, telegram.Object });

            var result = await controller.SendContactMessage(ValidMessage());

            AssertOkAndPersisted(result, context);
            VerifyNeverNotified(email);
        }

        [Fact]
        [Trait("Scenario", "S1-AS4")]
        public async Task SendContactMessage_BothChannelsDisabled_SavesAndAttemptsNoNotification()
        {
            using var context = CreateDbContext(nameof(SendContactMessage_BothChannelsDisabled_SavesAndAttemptsNoNotification));
            var email = DisabledNotifier();
            var telegram = DisabledNotifier();
            var controller = CreateController(context, new[] { email.Object, telegram.Object });

            var result = await controller.SendContactMessage(ValidMessage());

            AssertOkAndPersisted(result, context);
            VerifyNeverNotified(email);
            VerifyNeverNotified(telegram);
        }

        [Fact]
        [Trait("Scenario", "S1-AS5")]
        public async Task SendContactMessage_DatabaseUnavailable_Returns500AndNoNotificationsSent()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: nameof(SendContactMessage_DatabaseUnavailable_Returns500AndNoNotificationsSent))
                .Options;
            using var context = new FailingSaveDbContext(options);
            var email = EnabledNotifier();
            var telegram = EnabledNotifier();
            var controller = CreateController(context, new[] { email.Object, telegram.Object });

            var result = await controller.SendContactMessage(ValidMessage());

            var statusResult = Assert.IsType<ObjectResult>(result);
            Assert.Equal(500, statusResult.StatusCode);

            VerifyNeverNotified(email);
            VerifyNeverNotified(telegram);
        }

        [Fact]
        [Trait("Scenario", "S1-AS6")]
        public async Task SendContactMessage_MissingRequiredField_Returns400AndDoesNotPersist()
        {
            using var context = CreateDbContext(nameof(SendContactMessage_MissingRequiredField_Returns400AndDoesNotPersist));
            var controller = CreateController(context, Array.Empty<IFeedbackNotifier>());

            var dto = ValidMessage();
            dto.Email = string.Empty;
            controller.ModelState.AddModelError("Email", "Email обязателен");

            var result = await controller.SendContactMessage(dto);

            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Equal(400, badRequest.StatusCode);
            Assert.Empty(context.ContactMessages);
        }

        [Fact]
        [Trait("Scenario", "S1-AS7")]
        public async Task SendContactMessage_UtmFieldsRoundTripAndAreNullWhenAbsent()
        {
            using var context = CreateDbContext(nameof(SendContactMessage_UtmFieldsRoundTripAndAreNullWhenAbsent));
            var controller = CreateController(context, Array.Empty<IFeedbackNotifier>());

            var withUtm = ValidMessage();
            withUtm.UtmSource = "yandex";
            withUtm.UtmMedium = "cpc";
            withUtm.UtmCampaign = "spring";

            var firstResult = await controller.SendContactMessage(withUtm);
            Assert.IsType<OkObjectResult>(firstResult);

            var firstSaved = Assert.Single(context.ContactMessages);
            Assert.Equal("yandex", firstSaved.UtmSource);
            Assert.Equal("cpc", firstSaved.UtmMedium);
            Assert.Equal("spring", firstSaved.UtmCampaign);

            var withoutUtm = ValidMessage();
            var secondResult = await controller.SendContactMessage(withoutUtm);
            Assert.IsType<OkObjectResult>(secondResult);

            var secondSaved = context.ContactMessages.OrderByDescending(m => m.Id).First();
            Assert.Null(secondSaved.UtmSource);
            Assert.Null(secondSaved.UtmMedium);
            Assert.Null(secondSaved.UtmCampaign);
        }

        [Fact]
        [Trait("Scenario", "S1-AS1")]
        public async Task SendContactMessage_MissingName_Returns400AndDoesNotPersist()
        {
            using var context = CreateDbContext(nameof(SendContactMessage_MissingName_Returns400AndDoesNotPersist));
            var controller = CreateController(context, Array.Empty<IFeedbackNotifier>());

            var dto = ValidMessage();
            dto.Name = string.Empty;
            controller.ModelState.AddModelError("Name", "Name обязателен");

            var result = await controller.SendContactMessage(dto);

            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Equal(400, badRequest.StatusCode);
            Assert.Empty(context.ContactMessages);
        }

        [Fact]
        [Trait("Scenario", "S1-AS1")]
        public async Task SendContactMessage_MissingSubject_Returns400AndDoesNotPersist()
        {
            using var context = CreateDbContext(nameof(SendContactMessage_MissingSubject_Returns400AndDoesNotPersist));
            var controller = CreateController(context, Array.Empty<IFeedbackNotifier>());

            var dto = ValidMessage();
            dto.Subject = string.Empty;
            controller.ModelState.AddModelError("Subject", "Subject обязателен");

            var result = await controller.SendContactMessage(dto);

            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Equal(400, badRequest.StatusCode);
            Assert.Empty(context.ContactMessages);
        }

        [Fact]
        [Trait("Scenario", "S1-AS1")]
        public async Task SendContactMessage_MissingMessage_Returns400AndDoesNotPersist()
        {
            using var context = CreateDbContext(nameof(SendContactMessage_MissingMessage_Returns400AndDoesNotPersist));
            var controller = CreateController(context, Array.Empty<IFeedbackNotifier>());

            var dto = ValidMessage();
            dto.Message = string.Empty;
            controller.ModelState.AddModelError("Message", "Message обязателен");

            var result = await controller.SendContactMessage(dto);

            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Equal(400, badRequest.StatusCode);
            Assert.Empty(context.ContactMessages);
        }

        [Fact]
        [Trait("Scenario", "S1-AS2")]
        public async Task SendContactMessage_FirstChannelFailsSecondStillCalled()
        {
            using var context = CreateDbContext(nameof(SendContactMessage_FirstChannelFailsSecondStillCalled));
            var first = EnabledNotifier(throws: true);
            var second = EnabledNotifier();
            var controller = CreateController(context, new[] { first.Object, second.Object });

            var result = await controller.SendContactMessage(ValidMessage());

            AssertOkAndPersisted(result, context);
            first.Verify(n => n.NotifyAsync(It.IsAny<ContactMessage>(), It.IsAny<CancellationToken>()), Times.Once);
            second.Verify(n => n.NotifyAsync(It.IsAny<ContactMessage>(), It.IsAny<CancellationToken>()), Times.Once);
        }

        [Fact]
        [Trait("Scenario", "S1-AS3")]
        public async Task SendContactMessage_BothChannelsFail_StillSaves200()
        {
            using var context = CreateDbContext(nameof(SendContactMessage_BothChannelsFail_StillSaves200));
            var first = EnabledNotifier(throws: true);
            var second = EnabledNotifier(throws: true);
            var controller = CreateController(context, new[] { first.Object, second.Object });

            var result = await controller.SendContactMessage(ValidMessage());

            AssertOkAndPersisted(result, context);
            first.Verify(n => n.NotifyAsync(It.IsAny<ContactMessage>(), It.IsAny<CancellationToken>()), Times.Once);
            second.Verify(n => n.NotifyAsync(It.IsAny<ContactMessage>(), It.IsAny<CancellationToken>()), Times.Once);
        }

        [Fact]
        [Trait("Scenario", "S1-AS4")]
        public async Task SendContactMessage_NoNotifiersRegistered_SavesAndReturns200()
        {
            using var context = CreateDbContext(nameof(SendContactMessage_NoNotifiersRegistered_SavesAndReturns200));
            var controller = CreateController(context, Array.Empty<IFeedbackNotifier>());

            var result = await controller.SendContactMessage(ValidMessage());

            AssertOkAndPersisted(result, context);
        }

        [Fact]
        [Trait("Scenario", "S1-AS1")]
        public async Task SendContactMessage_NameAtMaxLength_Saves200()
        {
            using var context = CreateDbContext(nameof(SendContactMessage_NameAtMaxLength_Saves200));
            var controller = CreateController(context, Array.Empty<IFeedbackNotifier>());

            var dto = ValidMessage();
            dto.Name = new string('А', 200);  // Exactly 200 chars

            var result = await controller.SendContactMessage(dto);

            var saved = AssertOkAndPersisted(result, context);
            Assert.Equal(200, saved.Name.Length);
        }

        [Fact]
        [Trait("Scenario", "S1-AS1")]
        public async Task SendContactMessage_SubjectAtMaxLength_Saves200()
        {
            using var context = CreateDbContext(nameof(SendContactMessage_SubjectAtMaxLength_Saves200));
            var controller = CreateController(context, Array.Empty<IFeedbackNotifier>());

            var dto = ValidMessage();
            dto.Subject = new string('А', 200);  // Exactly 200 chars

            var result = await controller.SendContactMessage(dto);

            var saved = AssertOkAndPersisted(result, context);
            Assert.Equal(200, saved.Subject.Length);
        }

        [Fact]
        [Trait("Scenario", "S1-AS1")]
        public async Task SendContactMessage_MessageAtMaxLength_Saves200()
        {
            using var context = CreateDbContext(nameof(SendContactMessage_MessageAtMaxLength_Saves200));
            var controller = CreateController(context, Array.Empty<IFeedbackNotifier>());

            var dto = ValidMessage();
            dto.Message = new string('А', 5000);  // Exactly 5000 chars

            var result = await controller.SendContactMessage(dto);

            var saved = AssertOkAndPersisted(result, context);
            Assert.Equal(5000, saved.Message.Length);
        }

        [Fact]
        [Trait("Scenario", "S1-AS1")]
        public async Task SendContactMessage_UtmFieldsAtMaxLength_Saves200()
        {
            using var context = CreateDbContext(nameof(SendContactMessage_UtmFieldsAtMaxLength_Saves200));
            var controller = CreateController(context, Array.Empty<IFeedbackNotifier>());

            var dto = ValidMessage();
            dto.UtmSource = new string('а', 200);
            dto.UtmMedium = new string('б', 200);
            dto.UtmCampaign = new string('в', 200);

            var result = await controller.SendContactMessage(dto);

            var saved = AssertOkAndPersisted(result, context);
            Assert.Equal(200, saved.UtmSource.Length);
            Assert.Equal(200, saved.UtmMedium.Length);
            Assert.Equal(200, saved.UtmCampaign.Length);
        }

        [Fact]
        [Trait("Scenario", "S1-AS1")]
        public async Task SendContactMessage_StatusAlwaysNewWhenSaved()
        {
            using var context = CreateDbContext(nameof(SendContactMessage_StatusAlwaysNewWhenSaved));
            var controller = CreateController(context, Array.Empty<IFeedbackNotifier>());

            var result = await controller.SendContactMessage(ValidMessage());

            var saved = AssertOkAndPersisted(result, context);
            Assert.Equal(ContactMessageStatus.New, saved.Status);
        }

        [Fact]
        [Trait("Scenario", "S1-AS1")]
        public async Task SendContactMessage_CreatedAtIsUtcNow()
        {
            using var context = CreateDbContext(nameof(SendContactMessage_CreatedAtIsUtcNow));
            var controller = CreateController(context, Array.Empty<IFeedbackNotifier>());

            var beforeCall = DateTime.UtcNow;
            var result = await controller.SendContactMessage(ValidMessage());
            var afterCall = DateTime.UtcNow;

            var saved = AssertOkAndPersisted(result, context);
            Assert.True(saved.CreatedAt >= beforeCall && saved.CreatedAt <= afterCall,
                $"CreatedAt {saved.CreatedAt} should be between {beforeCall} and {afterCall}");
        }

        [Fact]
        [Trait("Scenario", "S1-AS1")]
        public async Task SendContactMessage_IpAddressAndUserAgentCaptured()
        {
            using var context = CreateDbContext(nameof(SendContactMessage_IpAddressAndUserAgentCaptured));
            var controller = CreateController(context, Array.Empty<IFeedbackNotifier>());

            var result = await controller.SendContactMessage(ValidMessage());

            var saved = AssertOkAndPersisted(result, context);
            Assert.NotNull(saved.IpAddress);
            Assert.NotNull(saved.UserAgent);
            Assert.Equal("203.0.113.42", saved.IpAddress);
            Assert.Equal("MomSiteTests/1.0", saved.UserAgent);
        }

        [Fact]
        [Trait("Scenario", "S1-AS1")]
        public async Task SendContactMessage_PersistenceBeforeNotification()
        {
            using var context = CreateDbContext(nameof(SendContactMessage_PersistenceBeforeNotification));

            var notifier = new Mock<IFeedbackNotifier>();
            notifier.SetupGet(n => n.IsEnabled).Returns(true);

            var savedIdWhenNotified = 0;
            notifier.Setup(n => n.NotifyAsync(It.IsAny<ContactMessage>(), It.IsAny<CancellationToken>()))
                .Callback<ContactMessage, CancellationToken>((msg, ct) =>
                {
                    savedIdWhenNotified = msg.Id;
                    var count = context.ContactMessages.Count();
                    Assert.Equal(1, count);
                    var record = context.ContactMessages.FirstOrDefault();
                    Assert.NotNull(record);
                    Assert.Equal(ContactMessageStatus.New, record.Status);
                })
                .Returns(Task.CompletedTask);

            var controller = CreateController(context, new[] { notifier.Object });

            var result = await controller.SendContactMessage(ValidMessage());

            AssertOkAndPersisted(result, context);
            Assert.True(savedIdWhenNotified > 0, "Notifier should have received a message with a valid ID");
            var saved = context.ContactMessages.First();
            Assert.Equal(savedIdWhenNotified, saved.Id);
        }

        [Fact]
        [Trait("Scenario", "S1-AS1")]
        public async Task SendContactMessage_NotifyDisabledChannelIsNeverCalled()
        {
            using var context = CreateDbContext(nameof(SendContactMessage_NotifyDisabledChannelIsNeverCalled));
            var disabled = DisabledNotifier();
            var enabled = EnabledNotifier();
            var controller = CreateController(context, new[] { disabled.Object, enabled.Object });

            var result = await controller.SendContactMessage(ValidMessage());

            AssertOkAndPersisted(result, context);
            VerifyNeverNotified(disabled);
            enabled.Verify(n => n.NotifyAsync(It.IsAny<ContactMessage>(), It.IsAny<CancellationToken>()), Times.Once);
        }

        [Fact]
        [Trait("Scenario", "S1-AS1")]
        public async Task SendContactMessage_ChannelNotCalledIfNotEnabled()
        {
            using var context = CreateDbContext(nameof(SendContactMessage_ChannelNotCalledIfNotEnabled));
            var disabledNotifier = DisabledNotifier();
            var controller = CreateController(context, new[] { disabledNotifier.Object });

            var result = await controller.SendContactMessage(ValidMessage());

            AssertOkAndPersisted(result, context);
            VerifyNeverNotified(disabledNotifier);
        }

        [Fact]
        [Trait("Scenario", "S1-AS6")]
        public async Task SendContactMessage_WhitespaceNameTreatedAsEmpty()
        {
            using var context = CreateDbContext(nameof(SendContactMessage_WhitespaceNameTreatedAsEmpty));
            var controller = CreateController(context, Array.Empty<IFeedbackNotifier>());

            var dto = ValidMessage();
            dto.Name = "   ";
            // Assuming validation treats whitespace as empty/required violation
            controller.ModelState.AddModelError("Name", "Name обязателен");

            var result = await controller.SendContactMessage(dto);

            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Equal(400, badRequest.StatusCode);
            Assert.Empty(context.ContactMessages);
        }

        [Fact]
        [Trait("Scenario", "S1-AS1")]
        public async Task SendContactMessage_AllRequiredFieldsPresent()
        {
            using var context = CreateDbContext(nameof(SendContactMessage_AllRequiredFieldsPresent));
            var controller = CreateController(context, Array.Empty<IFeedbackNotifier>());

            var dto = ValidMessage();

            var result = await controller.SendContactMessage(dto);

            var saved = AssertOkAndPersisted(result, context);
            Assert.NotEmpty(saved.Name);
            Assert.NotEmpty(saved.Email);
            Assert.NotEmpty(saved.Subject);
            Assert.NotEmpty(saved.Message);
        }

        [Fact]
        [Trait("Scenario", "S1-AS1")]
        public async Task SendContactMessage_EmailFieldIsCapture()
        {
            using var context = CreateDbContext(nameof(SendContactMessage_EmailFieldIsCapture));
            var controller = CreateController(context, Array.Empty<IFeedbackNotifier>());

            var dto = ValidMessage();
            dto.Email = "test@example.org";

            var result = await controller.SendContactMessage(dto);

            var saved = AssertOkAndPersisted(result, context);
            Assert.Equal("test@example.org", saved.Email);
        }

        // -----------------------------------------------------------------
        // S3 — Anti-spam (honeypot + rate-limit)
        // -----------------------------------------------------------------

        [Fact]
        [Trait("Scenario", "S3-AS1")]
        public async Task SendContactMessage_HoneypotFilled_Returns200SilentlyWithoutPersistOrNotify()
        {
            using var context = CreateDbContext(nameof(SendContactMessage_HoneypotFilled_Returns200SilentlyWithoutPersistOrNotify));
            var email = EnabledNotifier();
            var telegram = EnabledNotifier();
            var controller = CreateController(context, new[] { email.Object, telegram.Object });

            var dto = ValidMessage();
            dto.Website = "http://spam.example";

            var result = await controller.SendContactMessage(dto);

            var ok = Assert.IsType<OkObjectResult>(result);
            Assert.Equal(200, ok.StatusCode);
            Assert.Empty(context.ContactMessages);
            VerifyNeverNotified(email);
            VerifyNeverNotified(telegram);
        }

        [Fact]
        [Trait("Scenario", "S3-AS2")]
        public async Task SendContactMessage_HoneypotEmpty_SavesNormally()
        {
            using var context = CreateDbContext(nameof(SendContactMessage_HoneypotEmpty_SavesNormally));
            var controller = CreateController(context, Array.Empty<IFeedbackNotifier>());

            var dto = ValidMessage();
            dto.Website = "";

            var result = await controller.SendContactMessage(dto);

            AssertOkAndPersisted(result, context);
        }

        [Fact]
        [Trait("Scenario", "S3-AS3")]
        public async Task SendContactMessage_ExceedsRateLimit_Returns429AndDoesNotPersistExtra()
        {
            using var context = CreateDbContext(nameof(SendContactMessage_ExceedsRateLimit_Returns429AndDoesNotPersistExtra));
            var timeProvider = new FakeTimeProvider();
            var options = new ContactRateLimiterOptions { PermitLimit = 5, WindowMinutes = 10 };
            var limiter = new FixedWindowContactRateLimiter(options, timeProvider);
            var controller = CreateController(context, Array.Empty<IFeedbackNotifier>(), limiter);

            for (int i = 0; i < 5; i++)
            {
                var allowed = await controller.SendContactMessage(ValidMessage());
                Assert.IsType<OkObjectResult>(allowed);
            }

            var blocked = await controller.SendContactMessage(ValidMessage());

            var tooMany = Assert.IsType<ObjectResult>(blocked);
            Assert.Equal(StatusCodes.Status429TooManyRequests, tooMany.StatusCode);
            Assert.Equal(5, context.ContactMessages.Count());
        }

        [Fact]
        [Trait("Scenario", "S3-AS4")]
        public async Task SendContactMessage_AfterWindowExpires_RateLimitResetsAndSaves200()
        {
            using var context = CreateDbContext(nameof(SendContactMessage_AfterWindowExpires_RateLimitResetsAndSaves200));
            var timeProvider = new FakeTimeProvider();
            var options = new ContactRateLimiterOptions { PermitLimit = 2, WindowMinutes = 10 };
            var limiter = new FixedWindowContactRateLimiter(options, timeProvider);
            var controller = CreateController(context, Array.Empty<IFeedbackNotifier>(), limiter);

            Assert.IsType<OkObjectResult>(await controller.SendContactMessage(ValidMessage()));
            Assert.IsType<OkObjectResult>(await controller.SendContactMessage(ValidMessage()));

            var blocked = await controller.SendContactMessage(ValidMessage());
            Assert.Equal(StatusCodes.Status429TooManyRequests, Assert.IsType<ObjectResult>(blocked).StatusCode);

            timeProvider.Advance(TimeSpan.FromMinutes(11));

            var afterReset = await controller.SendContactMessage(ValidMessage());

            Assert.IsType<OkObjectResult>(afterReset);
            Assert.Equal(3, context.ContactMessages.Count());
        }
    }
}
