using Xunit;
using Moq;
using MomSite.API.Controllers;
using MomSite.Infrastructure.Data;
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

        private static PublicController CreateController(
            ApplicationDbContext context,
            IEnumerable<IFeedbackNotifier> notifiers)
        {
            var httpContext = new DefaultHttpContext();
            httpContext.Connection.RemoteIpAddress = System.Net.IPAddress.Parse("203.0.113.42");
            httpContext.Request.Headers.UserAgent = "MomSiteTests/1.0";

            var controller = new PublicController(context, notifiers, Mock.Of<ILogger<PublicController>>());
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

            var ok = Assert.IsType<OkObjectResult>(result);
            Assert.Equal(200, ok.StatusCode);

            var saved = Assert.Single(context.ContactMessages);
            Assert.Equal("Иван Иванов", saved.Name);
            Assert.Equal("ivan@example.com", saved.Email);
            Assert.Equal("Хочу картину", saved.Subject);
            Assert.Equal("Расскажите про доставку", saved.Message);
            Assert.Equal(ContactMessageStatus.New, saved.Status);
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

            var ok = Assert.IsType<OkObjectResult>(result);
            Assert.Equal(200, ok.StatusCode);

            var saved = Assert.Single(context.ContactMessages);
            Assert.Equal(ContactMessageStatus.New, saved.Status);

            var body = Assert.IsAssignableFrom<object>(ok.Value);
            Assert.DoesNotContain("channel failure", body.ToString());

            telegram.Verify(n => n.NotifyAsync(It.IsAny<ContactMessage>(), It.IsAny<CancellationToken>()), Times.Never);
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

            var ok = Assert.IsType<OkObjectResult>(result);
            Assert.Equal(200, ok.StatusCode);

            var saved = Assert.Single(context.ContactMessages);
            Assert.Equal(ContactMessageStatus.New, saved.Status);

            email.Verify(n => n.NotifyAsync(It.IsAny<ContactMessage>(), It.IsAny<CancellationToken>()), Times.Never);
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

            var ok = Assert.IsType<OkObjectResult>(result);
            Assert.Equal(200, ok.StatusCode);

            var saved = Assert.Single(context.ContactMessages);
            Assert.Equal(ContactMessageStatus.New, saved.Status);

            email.Verify(n => n.NotifyAsync(It.IsAny<ContactMessage>(), It.IsAny<CancellationToken>()), Times.Never);
            telegram.Verify(n => n.NotifyAsync(It.IsAny<ContactMessage>(), It.IsAny<CancellationToken>()), Times.Never);
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

            email.Verify(n => n.NotifyAsync(It.IsAny<ContactMessage>(), It.IsAny<CancellationToken>()), Times.Never);
            telegram.Verify(n => n.NotifyAsync(It.IsAny<ContactMessage>(), It.IsAny<CancellationToken>()), Times.Never);
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
    }
}
