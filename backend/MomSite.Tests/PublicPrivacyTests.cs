using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using MomSite.API.Controllers;
using MomSite.API.DTOs;
using MomSite.Core.Interfaces;
using MomSite.Core.Models;
using MomSite.Infrastructure.Data;
using MomSite.Infrastructure.Services;
using Xunit;

namespace MomSite.Tests
{
    // T017: GET /api/public/privacy
    public class PublicPrivacyTests
    {
        private class AllowAll : IContactRateLimiter
        {
            public bool TryAcquire(string clientKey) => true;
        }

        private static (PublicController, ApplicationDbContext) Create()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;
            var context = new ApplicationDbContext(options);
            var notifiers = new List<IFeedbackNotifier>();
            var controller = new PublicController(
                context, notifiers, Mock.Of<ILogger<PublicController>>(), new AllowAll(),
                new LeadService(context, notifiers, Mock.Of<ILogger<LeadService>>()))
            {
                ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() }
            };
            return (controller, context);
        }

        private static async Task<PrivacyDto> Get(PublicController controller)
        {
            var result = await controller.GetPrivacy();
            return Assert.IsType<PrivacyDto>(Assert.IsType<OkObjectResult>(result.Result).Value);
        }

        private static PageContent Row(string text, bool active, DateTime updated) => new()
        {
            PageKey = "privacy", ContentKey = "body", TextContent = text, IsActive = active, UpdatedAt = updated
        };

        [Fact]
        public async Task GetPrivacy_WithActiveRecord_ReturnsTextAndDate()
        {
            var (controller, context) = Create();
            var updated = new DateTime(2026, 10, 1, 12, 0, 0, DateTimeKind.Utc);
            context.PageContents.Add(Row("Текст политики", true, updated));
            await context.SaveChangesAsync();

            var dto = await Get(controller);

            Assert.Equal("Текст политики", dto.Text);
            Assert.Equal(updated, dto.UpdatedAt);
        }

        [Fact]
        public async Task GetPrivacy_WithoutRecord_ReturnsNullText()
        {
            var (controller, _) = Create();

            var dto = await Get(controller);

            Assert.Null(dto.Text);
            Assert.Null(dto.UpdatedAt);
        }

        [Fact]
        public async Task GetPrivacy_WithInactiveRecord_ReturnsNullText()
        {
            var (controller, context) = Create();
            context.PageContents.Add(Row("Скрыто", false, DateTime.UtcNow));
            await context.SaveChangesAsync();

            Assert.Null((await Get(controller)).Text);
        }

        [Fact]
        public async Task GetPrivacy_WithBlankText_ReturnsNullText()
        {
            var (controller, context) = Create();
            context.PageContents.Add(Row("   ", true, DateTime.UtcNow));
            await context.SaveChangesAsync();

            var dto = await Get(controller);

            Assert.Null(dto.Text);
            Assert.Null(dto.UpdatedAt);
        }
    }
}
