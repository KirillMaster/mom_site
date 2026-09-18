using Xunit;
using Moq;
using MomSite.API.Controllers;
using MomSite.API.DTOs;
using MomSite.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using MomSite.Core.Models;
using System;
using System.Linq;
using System.Reflection;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MomSite.Infrastructure.Services;
using Microsoft.Extensions.Configuration;

namespace MomSite.Tests
{
    public class AdminMessagesControllerTests
    {
        private static DbContextOptions<ApplicationDbContext> CreateDbOptions(string dbName)
        {
            return new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: dbName)
                .Options;
        }

        private static (Mock<IImageService>, Mock<IConfiguration>) CreateMocks()
        {
            var imageServiceMock = new Mock<IImageService>();
            var configurationMock = new Mock<IConfiguration>();
            configurationMock.Setup(c => c["AdminPassword"]).Returns("password");
            configurationMock.Setup(c => c["JWT:Secret"]).Returns("your-super-secret-key-that-is-long-enough-for-hs256");
            return (imageServiceMock, configurationMock);
        }

        // @S2-AS1: unauthenticated access must be rejected. The project has
        // no HTTP-pipeline integration test harness (existing tests always
        // instantiate controllers directly), so the authorization contract
        // is asserted the same way the rest of the suite verifies behavior:
        // against the actual attributes ASP.NET Core's auth middleware reads
        // to decide access — [Authorize] on the class and no [AllowAnonymous]
        // override on the messages endpoints.
        [Fact]
        [Trait("Scenario", "S2-AS1")]
        public void MessagesEndpoints_RequireAuthorization()
        {
            var controllerType = typeof(AdminController);
            Assert.True(controllerType.IsDefined(typeof(AuthorizeAttribute), inherit: true),
                "AdminController must be [Authorize]-protected");

            string[] actionNames = { nameof(AdminController.GetMessages), nameof(AdminController.GetUnreadMessagesCount), nameof(AdminController.GetMessage), nameof(AdminController.ArchiveMessage) };

            foreach (var actionName in actionNames)
            {
                var method = controllerType.GetMethod(actionName);
                Assert.NotNull(method);
                Assert.False(method!.IsDefined(typeof(AllowAnonymousAttribute), inherit: true),
                    $"{actionName} must not bypass authorization");
            }
        }

        [Fact]
        [Trait("Scenario", "S2-AS2")]
        public async Task GetMessages_ReturnsNewestFirst_WithUnreadBadgeCount()
        {
            var options = CreateDbOptions(nameof(GetMessages_ReturnsNewestFirst_WithUnreadBadgeCount));
            var (imageServiceMock, configMock) = CreateMocks();

            var now = DateTime.UtcNow;
            using (var context = new ApplicationDbContext(options))
            {
                context.ContactMessages.AddRange(
                    new ContactMessage { Name = "A", Email = "a@x.com", Subject = "S1", Message = "M1", Status = ContactMessageStatus.New, CreatedAt = now.AddMinutes(-10) },
                    new ContactMessage { Name = "B", Email = "b@x.com", Subject = "S2", Message = "M2", Status = ContactMessageStatus.New, CreatedAt = now.AddMinutes(-1) },
                    new ContactMessage { Name = "C", Email = "c@x.com", Subject = "S3", Message = "M3", Status = ContactMessageStatus.Read, CreatedAt = now.AddMinutes(-5) }
                );
                await context.SaveChangesAsync();
            }

            using (var context = new ApplicationDbContext(options))
            {
                var controller = new AdminController(context, imageServiceMock.Object, configMock.Object);

                var result = await controller.GetMessages();

                var ok = Assert.IsType<OkObjectResult>(result.Result);
                var page = Assert.IsType<ContactMessagesPageDto>(ok.Value);

                Assert.Equal(3, page.Items.Count);
                Assert.Equal(new[] { "B", "C", "A" }, page.Items.Select(i => i.Name).ToArray());
                Assert.Equal(2, page.UnreadCount);
            }
        }

        [Fact]
        [Trait("Scenario", "S2-AS3")]
        public async Task GetMessage_MarksNewAsRead_AndDecrementsUnreadCount()
        {
            var options = CreateDbOptions(nameof(GetMessage_MarksNewAsRead_AndDecrementsUnreadCount));
            var (imageServiceMock, configMock) = CreateMocks();

            using (var context = new ApplicationDbContext(options))
            {
                context.ContactMessages.Add(new ContactMessage
                {
                    Name = "Иван", Email = "ivan@example.com", Subject = "S", Message = "M",
                    Status = ContactMessageStatus.New, CreatedAt = DateTime.UtcNow
                });
                await context.SaveChangesAsync();
            }

            using (var context = new ApplicationDbContext(options))
            {
                var controller = new AdminController(context, imageServiceMock.Object, configMock.Object);

                var beforeCount = (await controller.GetUnreadMessagesCount()).Value;
                Assert.Equal(1, beforeCount);

                var result = await controller.GetMessage(1);
                var ok = Assert.IsType<OkObjectResult>(result.Result);
                var dto = Assert.IsType<ContactMessageAdminDto>(ok.Value);
                Assert.Equal("Read", dto.Status);

                var afterCount = (await controller.GetUnreadMessagesCount()).Value;
                Assert.Equal(0, afterCount);
            }

            using (var context = new ApplicationDbContext(options))
            {
                var saved = await context.ContactMessages.FindAsync(1);
                Assert.Equal(ContactMessageStatus.Read, saved!.Status);
            }
        }

        [Fact]
        [Trait("Scenario", "S2-AS4")]
        public async Task ArchiveMessage_SetsArchivedStatus_ExcludedFromUnreadButStillListed()
        {
            var options = CreateDbOptions(nameof(ArchiveMessage_SetsArchivedStatus_ExcludedFromUnreadButStillListed));
            var (imageServiceMock, configMock) = CreateMocks();

            using (var context = new ApplicationDbContext(options))
            {
                context.ContactMessages.Add(new ContactMessage
                {
                    Name = "Иван", Email = "ivan@example.com", Subject = "S", Message = "M",
                    Status = ContactMessageStatus.Read, CreatedAt = DateTime.UtcNow
                });
                await context.SaveChangesAsync();
            }

            using (var context = new ApplicationDbContext(options))
            {
                var controller = new AdminController(context, imageServiceMock.Object, configMock.Object);

                var result = await controller.ArchiveMessage(1);
                var ok = Assert.IsType<OkObjectResult>(result.Result);
                var dto = Assert.IsType<ContactMessageAdminDto>(ok.Value);
                Assert.Equal("Archived", dto.Status);

                var unread = (await controller.GetUnreadMessagesCount()).Value;
                Assert.Equal(0, unread);

                var archivedList = await controller.GetMessages("archived");
                var archivedOk = Assert.IsType<OkObjectResult>(archivedList.Result);
                var archivedPage = Assert.IsType<ContactMessagesPageDto>(archivedOk.Value);
                Assert.Single(archivedPage.Items);
                Assert.Equal("Archived", archivedPage.Items[0].Status);
            }

            using (var context = new ApplicationDbContext(options))
            {
                var saved = await context.ContactMessages.FindAsync(1);
                Assert.Equal(ContactMessageStatus.Archived, saved!.Status);
            }
        }

        [Fact]
        [Trait("Scenario", "S2-AS5")]
        public async Task GetMessages_EmptyDatabase_ReturnsEmptyListAndZeroUnread()
        {
            var options = CreateDbOptions(nameof(GetMessages_EmptyDatabase_ReturnsEmptyListAndZeroUnread));
            var (imageServiceMock, configMock) = CreateMocks();

            using var context = new ApplicationDbContext(options);
            var controller = new AdminController(context, imageServiceMock.Object, configMock.Object);

            var result = await controller.GetMessages();

            var ok = Assert.IsType<OkObjectResult>(result.Result);
            var page = Assert.IsType<ContactMessagesPageDto>(ok.Value);

            Assert.Empty(page.Items);
            Assert.Equal(0, page.UnreadCount);
        }
    }
}
