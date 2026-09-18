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
        private static DbContextOptions<ApplicationDbContext> CreateDbOptions(string dbName) =>
            AdminTestHelpers.CreateDbOptions(dbName);

        private static (Mock<IImageService>, Mock<IConfiguration>) CreateMocks() =>
            AdminTestHelpers.CreateMocks();

        private static async Task<DbContextOptions<ApplicationDbContext>> SeedSingleMessageAsync(
            string dbName, ContactMessageStatus status)
        {
            var options = CreateDbOptions(dbName);

            using (var context = new ApplicationDbContext(options))
            {
                context.ContactMessages.Add(new ContactMessage
                {
                    Name = "Иван", Email = "ivan@example.com", Subject = "S", Message = "M",
                    Status = status, CreatedAt = DateTime.UtcNow
                });
                await context.SaveChangesAsync();
            }

            return options;
        }

        private static async Task<ContactMessagesPageDto> GetMessagesPageAsync(
            ApplicationDbContext context, Mock<IImageService> imageServiceMock, Mock<IConfiguration> configMock,
            string? filter = null)
        {
            var controller = new AdminController(context, imageServiceMock.Object, configMock.Object);
            var result = filter == null ? await controller.GetMessages() : await controller.GetMessages(filter);
            var ok = Assert.IsType<OkObjectResult>(result.Result);
            return Assert.IsType<ContactMessagesPageDto>(ok.Value);
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
                var page = await GetMessagesPageAsync(context, imageServiceMock, configMock);

                Assert.Equal(3, page.Items.Count);
                Assert.Equal(new[] { "B", "C", "A" }, page.Items.Select(i => i.Name).ToArray());
                Assert.Equal(2, page.UnreadCount);
            }
        }

        [Fact]
        [Trait("Scenario", "S2-AS3")]
        public async Task GetMessage_MarksNewAsRead_AndDecrementsUnreadCount()
        {
            var options = await SeedSingleMessageAsync(
                nameof(GetMessage_MarksNewAsRead_AndDecrementsUnreadCount), ContactMessageStatus.New);
            var (imageServiceMock, configMock) = CreateMocks();

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
            var options = await SeedSingleMessageAsync(
                nameof(ArchiveMessage_SetsArchivedStatus_ExcludedFromUnreadButStillListed), ContactMessageStatus.Read);
            var (imageServiceMock, configMock) = CreateMocks();

            using (var context = new ApplicationDbContext(options))
            {
                var controller = new AdminController(context, imageServiceMock.Object, configMock.Object);

                var result = await controller.ArchiveMessage(1);
                var ok = Assert.IsType<OkObjectResult>(result.Result);
                var dto = Assert.IsType<ContactMessageAdminDto>(ok.Value);
                Assert.Equal("Archived", dto.Status);

                var unread = (await controller.GetUnreadMessagesCount()).Value;
                Assert.Equal(0, unread);

                var archivedPage = await GetMessagesPageAsync(context, imageServiceMock, configMock, "archived");
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
            var page = await GetMessagesPageAsync(context, imageServiceMock, configMock);

            Assert.Empty(page.Items);
            Assert.Equal(0, page.UnreadCount);
        }

        // @S2-AS1-EXT: Each message endpoint is separately marked [Authorize] or inherited from class.
        // This verifies all four methods (not just the class) are protected.
        [Fact]
        [Trait("Scenario", "S2-AS1-EXT")]
        public void AllMessageEndpoints_AreEachProtected()
        {
            var controllerType = typeof(AdminController);

            // Methods that must be individually checked or inherited
            var getMessagesMethod = controllerType.GetMethod(nameof(AdminController.GetMessages));
            var unreadCountMethod = controllerType.GetMethod(nameof(AdminController.GetUnreadMessagesCount));
            var getMessageMethod = controllerType.GetMethod(nameof(AdminController.GetMessage));
            var archiveMessageMethod = controllerType.GetMethod(nameof(AdminController.ArchiveMessage));

            // All must exist
            Assert.NotNull(getMessagesMethod);
            Assert.NotNull(unreadCountMethod);
            Assert.NotNull(getMessageMethod);
            Assert.NotNull(archiveMessageMethod);

            // None should have [AllowAnonymous] override
            Assert.False(getMessagesMethod!.IsDefined(typeof(AllowAnonymousAttribute)),
                $"{nameof(AdminController.GetMessages)} must not bypass authorization");
            Assert.False(unreadCountMethod!.IsDefined(typeof(AllowAnonymousAttribute)),
                $"{nameof(AdminController.GetUnreadMessagesCount)} must not bypass authorization");
            Assert.False(getMessageMethod!.IsDefined(typeof(AllowAnonymousAttribute)),
                $"{nameof(AdminController.GetMessage)} must not bypass authorization");
            Assert.False(archiveMessageMethod!.IsDefined(typeof(AllowAnonymousAttribute)),
                $"{nameof(AdminController.ArchiveMessage)} must not bypass authorization");
        }

        // @S2-AS2-EXT: Sorting is strictly by CreatedAt (descending), not by ID.
        // This test seeds messages with dates that differ from insertion/ID order.
        [Fact]
        [Trait("Scenario", "S2-AS2-EXT")]
        public async Task GetMessages_SortedByCreatedAtDescending_NotById()
        {
            var options = CreateDbOptions(nameof(GetMessages_SortedByCreatedAtDescending_NotById));
            var (imageServiceMock, configMock) = CreateMocks();

            var baseTime = DateTime.UtcNow;
            using (var context = new ApplicationDbContext(options))
            {
                // Insert in reverse date order: oldest first, newest last
                // IDs will be 1, 2, 3 (insertion order), but dates will be old, mid, newest
                context.ContactMessages.AddRange(
                    new ContactMessage { Name = "Oldest", Email = "old@x.com", Subject = "S1", Message = "M1", Status = ContactMessageStatus.New, CreatedAt = baseTime.AddDays(-2) },
                    new ContactMessage { Name = "Middle", Email = "mid@x.com", Subject = "S2", Message = "M2", Status = ContactMessageStatus.New, CreatedAt = baseTime.AddDays(-1) },
                    new ContactMessage { Name = "Newest", Email = "new@x.com", Subject = "S3", Message = "M3", Status = ContactMessageStatus.New, CreatedAt = baseTime }
                );
                await context.SaveChangesAsync();
            }

            using (var context = new ApplicationDbContext(options))
            {
                var page = await GetMessagesPageAsync(context, imageServiceMock, configMock);

                // Should be newest → oldest by date, NOT by ID (which would be Oldest, Middle, Newest)
                Assert.Equal(new[] { "Newest", "Middle", "Oldest" }, page.Items.Select(i => i.Name).ToArray());
            }
        }

        // @S2-AS3-EXT: Viewing an already-Read message does not change status or decrement count again.
        [Fact]
        [Trait("Scenario", "S2-AS3-EXT")]
        public async Task GetMessage_AlreadyRead_DoesNotChangeStatusOrCount()
        {
            var options = await SeedSingleMessageAsync(
                nameof(GetMessage_AlreadyRead_DoesNotChangeStatusOrCount), ContactMessageStatus.Read);
            var (imageServiceMock, configMock) = CreateMocks();

            using (var context = new ApplicationDbContext(options))
            {
                var controller = new AdminController(context, imageServiceMock.Object, configMock.Object);

                var countBefore = (await controller.GetUnreadMessagesCount()).Value;
                Assert.Equal(0, countBefore);

                var result = await controller.GetMessage(1);
                var ok = Assert.IsType<OkObjectResult>(result.Result);
                var dto = Assert.IsType<ContactMessageAdminDto>(ok.Value);
                Assert.Equal("Read", dto.Status);

                var countAfter = (await controller.GetUnreadMessagesCount()).Value;
                Assert.Equal(0, countAfter); // Should still be 0, not negative
            }

            using (var context = new ApplicationDbContext(options))
            {
                var saved = await context.ContactMessages.FindAsync(1);
                Assert.Equal(ContactMessageStatus.Read, saved!.Status);
            }
        }

        // @S2-AS4-EXT: Archiving a nonexistent message returns 404, not an exception.
        [Fact]
        [Trait("Scenario", "S2-AS4-EXT")]
        public async Task ArchiveMessage_NonexistentId_Returns404()
        {
            var options = CreateDbOptions(nameof(ArchiveMessage_NonexistentId_Returns404));
            var (imageServiceMock, configMock) = CreateMocks();

            using var context = new ApplicationDbContext(options);
            var controller = new AdminController(context, imageServiceMock.Object, configMock.Object);

            var result = await controller.ArchiveMessage(99999);
            Assert.IsType<NotFoundResult>(result.Result);
        }

        // @S2-AS4-EXT: Viewing a nonexistent message returns 404.
        [Fact]
        [Trait("Scenario", "S2-AS4-EXT")]
        public async Task GetMessage_NonexistentId_Returns404()
        {
            var options = CreateDbOptions(nameof(GetMessage_NonexistentId_Returns404));
            var (imageServiceMock, configMock) = CreateMocks();

            using var context = new ApplicationDbContext(options);
            var controller = new AdminController(context, imageServiceMock.Object, configMock.Object);

            var result = await controller.GetMessage(99999);
            Assert.IsType<NotFoundResult>(result.Result);
        }

        // @S2-AS2-EXT: Archived messages are excluded from the active filter.
        [Fact]
        [Trait("Scenario", "S2-AS2-EXT")]
        public async Task GetMessages_ActiveFilter_ExcludesArchivedMessages()
        {
            var options = CreateDbOptions(nameof(GetMessages_ActiveFilter_ExcludesArchivedMessages));
            var (imageServiceMock, configMock) = CreateMocks();

            using (var context = new ApplicationDbContext(options))
            {
                context.ContactMessages.AddRange(
                    new ContactMessage { Name = "Active", Email = "a@x.com", Subject = "S1", Message = "M1", Status = ContactMessageStatus.Read, CreatedAt = DateTime.UtcNow },
                    new ContactMessage { Name = "Archived", Email = "b@x.com", Subject = "S2", Message = "M2", Status = ContactMessageStatus.Archived, CreatedAt = DateTime.UtcNow }
                );
                await context.SaveChangesAsync();
            }

            using (var context = new ApplicationDbContext(options))
            {
                var activePage = await GetMessagesPageAsync(context, imageServiceMock, configMock, "active");
                Assert.Single(activePage.Items);
                Assert.Equal("Active", activePage.Items[0].Name);
            }
        }

        // @S2-AS3-EXT: Multiple GetMessage calls on the same New message mark it as Read only once.
        [Fact]
        [Trait("Scenario", "S2-AS3-EXT")]
        public async Task GetMessage_CalledTwiceOnNewMessage_MarksReadOnce()
        {
            var options = await SeedSingleMessageAsync(
                nameof(GetMessage_CalledTwiceOnNewMessage_MarksReadOnce), ContactMessageStatus.New);
            var (imageServiceMock, configMock) = CreateMocks();

            using (var context = new ApplicationDbContext(options))
            {
                var controller = new AdminController(context, imageServiceMock.Object, configMock.Object);

                var count1 = (await controller.GetUnreadMessagesCount()).Value;
                Assert.Equal(1, count1);

                // First call
                await controller.GetMessage(1);
                var count2 = (await controller.GetUnreadMessagesCount()).Value;
                Assert.Equal(0, count2);

                // Second call on same message
                await controller.GetMessage(1);
                var count3 = (await controller.GetUnreadMessagesCount()).Value;
                Assert.Equal(0, count3); // Must stay 0, not go negative
            }
        }

        // @S2-AS2-EXT: UnreadCount includes only New messages, not Read or Archived.
        [Fact]
        [Trait("Scenario", "S2-AS2-EXT")]
        public async Task GetUnreadMessagesCount_CountsOnlyNewMessages()
        {
            var options = CreateDbOptions(nameof(GetUnreadMessagesCount_CountsOnlyNewMessages));
            var (imageServiceMock, configMock) = CreateMocks();

            using (var context = new ApplicationDbContext(options))
            {
                context.ContactMessages.AddRange(
                    new ContactMessage { Name = "New1", Email = "a@x.com", Subject = "S1", Message = "M1", Status = ContactMessageStatus.New, CreatedAt = DateTime.UtcNow },
                    new ContactMessage { Name = "New2", Email = "b@x.com", Subject = "S2", Message = "M2", Status = ContactMessageStatus.New, CreatedAt = DateTime.UtcNow },
                    new ContactMessage { Name = "Read", Email = "c@x.com", Subject = "S3", Message = "M3", Status = ContactMessageStatus.Read, CreatedAt = DateTime.UtcNow },
                    new ContactMessage { Name = "Archived", Email = "d@x.com", Subject = "S4", Message = "M4", Status = ContactMessageStatus.Archived, CreatedAt = DateTime.UtcNow }
                );
                await context.SaveChangesAsync();
            }

            using (var context = new ApplicationDbContext(options))
            {
                var controller = new AdminController(context, imageServiceMock.Object, configMock.Object);
                var count = (await controller.GetUnreadMessagesCount()).Value;
                Assert.Equal(2, count); // Only the two New messages
            }
        }
    }
}
