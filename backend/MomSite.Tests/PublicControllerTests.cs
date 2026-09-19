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

        // Asserts the controller rejected the submission with 400 and never
        // touched the database; shared by every required-field scenario.
        private static void AssertBadRequestAndNotPersisted(IActionResult result, ApplicationDbContext context)
        {
            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Equal(400, badRequest.StatusCode);
            Assert.Empty(context.ContactMessages);
        }

        // Builds a fixed-window rate limiter backed by a controllable clock,
        // for scenarios that need to drive requests past the permit limit
        // and/or advance past the window (@S3-AS3/AS4).
        private static FixedWindowContactRateLimiter CreateRateLimiter(
            FakeTimeProvider timeProvider, int permitLimit, int windowMinutes = 10)
        {
            var options = new ContactRateLimiterOptions { PermitLimit = permitLimit, WindowMinutes = windowMinutes };
            return new FixedWindowContactRateLimiter(options, timeProvider);
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

            AssertBadRequestAndNotPersisted(result, context);
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

            AssertBadRequestAndNotPersisted(result, context);
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

            AssertBadRequestAndNotPersisted(result, context);
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

            AssertBadRequestAndNotPersisted(result, context);
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

            AssertBadRequestAndNotPersisted(result, context);
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
            var limiter = CreateRateLimiter(timeProvider, permitLimit: 5);
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
            var limiter = CreateRateLimiter(timeProvider, permitLimit: 2);
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

        [Fact]
        [Trait("Scenario", "S3-AS3")]
        public async Task SendContactMessage_RateLimitBy429Response_ContainsRateLimitMessage()
        {
            using var context = CreateDbContext(nameof(SendContactMessage_RateLimitBy429Response_ContainsRateLimitMessage));
            var timeProvider = new FakeTimeProvider();
            var limiter = CreateRateLimiter(timeProvider, permitLimit: 1);
            var controller = CreateController(context, Array.Empty<IFeedbackNotifier>(), limiter);

            Assert.IsType<OkObjectResult>(await controller.SendContactMessage(ValidMessage()));

            var blocked = await controller.SendContactMessage(ValidMessage());
            var tooMany = Assert.IsType<ObjectResult>(blocked);
            Assert.Equal(StatusCodes.Status429TooManyRequests, tooMany.StatusCode);

            var responseBody = Assert.IsAssignableFrom<object>(tooMany.Value);
            Assert.Contains("Слишком много запросов", responseBody.ToString()!);
        }

        [Fact]
        [Trait("Scenario", "S3-AS3")]
        public async Task SendContactMessage_BlockedBy429_DoesNotPersistRejectedRequest()
        {
            using var context = CreateDbContext(nameof(SendContactMessage_BlockedBy429_DoesNotPersistRejectedRequest));
            var timeProvider = new FakeTimeProvider();
            var limiter = CreateRateLimiter(timeProvider, permitLimit: 1);
            var controller = CreateController(context, Array.Empty<IFeedbackNotifier>(), limiter);

            var first = ValidMessage();
            first.Name = "First";
            var allowed = await controller.SendContactMessage(first);
            Assert.IsType<OkObjectResult>(allowed);
            Assert.Single(context.ContactMessages);

            var second = ValidMessage();
            second.Name = "Second";
            var blocked = await controller.SendContactMessage(second);
            Assert.Equal(StatusCodes.Status429TooManyRequests, Assert.IsType<ObjectResult>(blocked).StatusCode);

            var saved = Assert.Single(context.ContactMessages);
            Assert.Equal("First", saved.Name);
        }

        [Fact]
        [Trait("Scenario", "S3-AS3")]
        public async Task SendContactMessage_DifferentIpsSeparateRateLimits_BothCanSendWithinTheirLimit()
        {
            using var context = CreateDbContext(nameof(SendContactMessage_DifferentIpsSeparateRateLimits_BothCanSendWithinTheirLimit));
            var timeProvider = new FakeTimeProvider();
            var limiter = CreateRateLimiter(timeProvider, permitLimit: 2);

            // First IP: 203.0.113.1
            var httpContext1 = new DefaultHttpContext();
            httpContext1.Connection.RemoteIpAddress = System.Net.IPAddress.Parse("203.0.113.1");
            httpContext1.Request.Headers.UserAgent = "MomSiteTests/1.0";
            var controller1 = new PublicController(
                context,
                Array.Empty<IFeedbackNotifier>(),
                Mock.Of<ILogger<PublicController>>(),
                limiter);
            controller1.ControllerContext = new ControllerContext { HttpContext = httpContext1 };

            // Second IP: 203.0.113.2
            var httpContext2 = new DefaultHttpContext();
            httpContext2.Connection.RemoteIpAddress = System.Net.IPAddress.Parse("203.0.113.2");
            httpContext2.Request.Headers.UserAgent = "MomSiteTests/1.0";
            var controller2 = new PublicController(
                context,
                Array.Empty<IFeedbackNotifier>(),
                Mock.Of<ILogger<PublicController>>(),
                limiter);
            controller2.ControllerContext = new ControllerContext { HttpContext = httpContext2 };

            var msg1A = ValidMessage();
            msg1A.Name = "IP1_First";
            var msg1B = ValidMessage();
            msg1B.Name = "IP1_Second";
            var msg1C = ValidMessage();
            msg1C.Name = "IP1_Third";

            var msg2A = ValidMessage();
            msg2A.Name = "IP2_First";
            var msg2B = ValidMessage();
            msg2B.Name = "IP2_Second";
            var msg2C = ValidMessage();
            msg2C.Name = "IP2_Third";

            // IP 1 sends 2 (OK), then 3rd is blocked
            Assert.IsType<OkObjectResult>(await controller1.SendContactMessage(msg1A));
            Assert.IsType<OkObjectResult>(await controller1.SendContactMessage(msg1B));
            var blocked1C = await controller1.SendContactMessage(msg1C);
            Assert.Equal(StatusCodes.Status429TooManyRequests, Assert.IsType<ObjectResult>(blocked1C).StatusCode);

            // IP 2 should still be able to send 2 times (separate limit per IP)
            Assert.IsType<OkObjectResult>(await controller2.SendContactMessage(msg2A));
            Assert.IsType<OkObjectResult>(await controller2.SendContactMessage(msg2B));
            var blocked2C = await controller2.SendContactMessage(msg2C);
            Assert.Equal(StatusCodes.Status429TooManyRequests, Assert.IsType<ObjectResult>(blocked2C).StatusCode);

            // Only messages that succeeded should be persisted: 2 from IP1 + 2 from IP2 = 4 total
            Assert.Equal(4, context.ContactMessages.Count());
            var names = context.ContactMessages.OrderBy(m => m.Name).Select(m => m.Name).ToList();
            Assert.Equal(new[] { "IP1_First", "IP1_Second", "IP2_First", "IP2_Second" }, names);
        }

        [Fact]
        [Trait("Scenario", "S3-AS1")]
        public async Task SendContactMessage_HoneypotFilled_ConsumesRateLimitPermit()
        {
            using var context = CreateDbContext(nameof(SendContactMessage_HoneypotFilled_ConsumesRateLimitPermit));
            var timeProvider = new FakeTimeProvider();
            var limiter = CreateRateLimiter(timeProvider, permitLimit: 2);
            var controller = CreateController(context, Array.Empty<IFeedbackNotifier>(), limiter);

            // Send a honeypot message (consumes one permit)
            var honeypotMsg = ValidMessage();
            honeypotMsg.Website = "http://spam.example";
            var honeypotResult = await controller.SendContactMessage(honeypotMsg);
            var honeypotOk = Assert.IsType<OkObjectResult>(honeypotResult);
            Assert.Equal(200, honeypotOk.StatusCode);
            Assert.Empty(context.ContactMessages); // No persistence

            // Send a normal message (consumes second permit)
            var normalMsg1 = ValidMessage();
            normalMsg1.Name = "Normal1";
            var normalResult1 = await controller.SendContactMessage(normalMsg1);
            Assert.IsType<OkObjectResult>(normalResult1);
            Assert.Single(context.ContactMessages);

            // Third request should be blocked (limit exhausted)
            var normalMsg2 = ValidMessage();
            normalMsg2.Name = "Normal2";
            var blockedResult = await controller.SendContactMessage(normalMsg2);
            Assert.Equal(StatusCodes.Status429TooManyRequests, Assert.IsType<ObjectResult>(blockedResult).StatusCode);
        }

        [Fact]
        [Trait("Scenario", "S3-AS2")]
        public async Task SendContactMessage_HoneypotEmptyAndRateLimitOk_SavesNormally()
        {
            using var context = CreateDbContext(nameof(SendContactMessage_HoneypotEmptyAndRateLimitOk_SavesNormally));
            var timeProvider = new FakeTimeProvider();
            var limiter = CreateRateLimiter(timeProvider, permitLimit: 5);
            var controller = CreateController(context, Array.Empty<IFeedbackNotifier>(), limiter);

            var dto = ValidMessage();
            dto.Website = "";

            var result = await controller.SendContactMessage(dto);

            AssertOkAndPersisted(result, context);
        }

        [Fact]
        [Trait("Scenario", "S3-AS3")]
        public async Task SendContactMessage_ExactlyAtLimitThenExceeds_BoundaryValue()
        {
            using var context = CreateDbContext(nameof(SendContactMessage_ExactlyAtLimitThenExceeds_BoundaryValue));
            var timeProvider = new FakeTimeProvider();
            var limiter = CreateRateLimiter(timeProvider, permitLimit: 3);
            var controller = CreateController(context, Array.Empty<IFeedbackNotifier>(), limiter);

            // Send exactly 3 requests (the limit)
            for (int i = 1; i <= 3; i++)
            {
                var msg = ValidMessage();
                msg.Name = $"Message{i}";
                var result = await controller.SendContactMessage(msg);
                Assert.IsType<OkObjectResult>(result);
            }

            Assert.Equal(3, context.ContactMessages.Count());

            // 4th request should be blocked
            var msg4 = ValidMessage();
            msg4.Name = "Message4";
            var blocked = await controller.SendContactMessage(msg4);
            var tooMany = Assert.IsType<ObjectResult>(blocked);
            Assert.Equal(StatusCodes.Status429TooManyRequests, tooMany.StatusCode);

            // Still only 3 persisted
            Assert.Equal(3, context.ContactMessages.Count());
        }

        [Fact]
        [Trait("Scenario", "S3-AS4")]
        public async Task SendContactMessage_WindowResetAllowsAnotherPermit_EachWindowIndependent()
        {
            using var context = CreateDbContext(nameof(SendContactMessage_WindowResetAllowsAnotherPermit_EachWindowIndependent));
            var timeProvider = new FakeTimeProvider();
            var limiter = CreateRateLimiter(timeProvider, permitLimit: 1);
            var controller = CreateController(context, Array.Empty<IFeedbackNotifier>(), limiter);

            var msg1 = ValidMessage();
            msg1.Name = "First";
            var allowed = await controller.SendContactMessage(msg1);
            Assert.IsType<OkObjectResult>(allowed);

            var msg2 = ValidMessage();
            msg2.Name = "Second";
            var blocked = await controller.SendContactMessage(msg2);
            Assert.Equal(StatusCodes.Status429TooManyRequests, Assert.IsType<ObjectResult>(blocked).StatusCode);

            // Advance time just under the window (9 minutes)
            timeProvider.Advance(TimeSpan.FromMinutes(9));

            var msg3 = ValidMessage();
            msg3.Name = "StillBlocked";
            var stillBlocked = await controller.SendContactMessage(msg3);
            Assert.Equal(StatusCodes.Status429TooManyRequests, Assert.IsType<ObjectResult>(stillBlocked).StatusCode);

            // Advance past the window (now 11 minutes total)
            timeProvider.Advance(TimeSpan.FromMinutes(2));

            var msg4 = ValidMessage();
            msg4.Name = "NewWindow";
            var newAllowed = await controller.SendContactMessage(msg4);
            Assert.IsType<OkObjectResult>(newAllowed);

            Assert.Equal(2, context.ContactMessages.Count());
            var names = context.ContactMessages.OrderBy(m => m.Id).Select(m => m.Name).ToList();
            Assert.Equal(new[] { "First", "NewWindow" }, names);
        }

        // -----------------------------------------------------------------
        // S5 — Homepage SEO title/description decoupled from welcomeMessage
        // -----------------------------------------------------------------

        [Fact]
        [Trait("Scenario", "S5-AS1")]
        public async Task GetHomeData_NoSeoContentSet_ReturnsEmptySeoFieldsSeparateFromWelcomeMessage()
        {
            using var context = CreateDbContext(nameof(GetHomeData_NoSeoContentSet_ReturnsEmptySeoFieldsSeparateFromWelcomeMessage));
            context.PageContents.Add(new PageContent
            {
                PageKey = "home",
                ContentKey = "welcome_message",
                TextContent = new string('W', 200),
                IsActive = true
            });
            await context.SaveChangesAsync();

            var controller = CreateController(context, Array.Empty<IFeedbackNotifier>());

            var result = await controller.GetHomeData();

            var ok = Assert.IsType<OkObjectResult>(result.Result);
            var homeData = Assert.IsType<MomSite.API.DTOs.HomeData>(ok.Value);

            // The backend does not fold the long welcomeMessage into the SEO
            // fields — it reports "not set", and the frontend applies its own
            // commercial default rather than rendering the raw welcome copy.
            Assert.Equal(string.Empty, homeData.SeoTitle);
            Assert.Equal(string.Empty, homeData.SeoDescription);
            Assert.Equal(200, homeData.WelcomeMessage.Length);
        }

        [Fact]
        [Trait("Scenario", "S5-AS2")]
        public async Task GetHomeData_SeoContentSet_ReturnsItVerbatim()
        {
            using var context = CreateDbContext(nameof(GetHomeData_SeoContentSet_ReturnsItVerbatim));
            context.PageContents.AddRange(
                new PageContent
                {
                    PageKey = "home",
                    ContentKey = "home_seo_title",
                    TextContent = "Анжела Моисеенко — картины маслом на заказ",
                    IsActive = true
                },
                new PageContent
                {
                    PageKey = "home",
                    ContentKey = "home_seo_description",
                    TextContent = "Галерея и заказ картин маслом художника Анжелы Моисеенко",
                    IsActive = true
                });
            await context.SaveChangesAsync();

            var controller = CreateController(context, Array.Empty<IFeedbackNotifier>());

            var result = await controller.GetHomeData();

            var ok = Assert.IsType<OkObjectResult>(result.Result);
            var homeData = Assert.IsType<MomSite.API.DTOs.HomeData>(ok.Value);

            Assert.Equal("Анжела Моисеенко — картины маслом на заказ", homeData.SeoTitle);
            Assert.Equal("Галерея и заказ картин маслом художника Анжелы Моисеенко", homeData.SeoDescription);
        }

        [Fact]
        [Trait("Scenario", "S5-AS4")]
        public async Task GetHomeData_SeoTitleSetToEmptyString_ReportsEmptyRatherThanNull()
        {
            using var context = CreateDbContext(nameof(GetHomeData_SeoTitleSetToEmptyString_ReportsEmptyRatherThanNull));
            context.PageContents.Add(new PageContent
            {
                PageKey = "home",
                ContentKey = "home_seo_title",
                TextContent = "",
                IsActive = true
            });
            await context.SaveChangesAsync();

            var controller = CreateController(context, Array.Empty<IFeedbackNotifier>());

            var result = await controller.GetHomeData();

            var ok = Assert.IsType<OkObjectResult>(result.Result);
            var homeData = Assert.IsType<MomSite.API.DTOs.HomeData>(ok.Value);

            // The frontend's generateMetadata (S5-AS4) is what supplies the
            // default when this comes back empty — the backend's contract is
            // simply to never surface null here.
            Assert.Equal(string.Empty, homeData.SeoTitle);
        }
    }
}
