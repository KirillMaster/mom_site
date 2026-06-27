using Xunit;
using Moq;
using MomSite.API.Controllers;
using MomSite.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using MomSite.Core.Models;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using MomSite.Infrastructure.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Http;

namespace MomSite.Tests
{
    public class AdminControllerTests
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

        [Fact]
        public async Task Login_WithValidCredentials_ReturnsOkResult_WithToken()
        {
            // Arrange
            var options = CreateDbOptions("TestDatabase_Admin");
            var (imageServiceMock, configurationMock) = CreateMocks();

            using (var context = new ApplicationDbContext(options))
            {
                var controller = new AdminController(context, imageServiceMock.Object, configurationMock.Object);
                var loginDto = new LoginDto { Username = "admin", Password = "password" };

                // Act
                var result = await controller.Login(loginDto);

                // Assert
                var okResult = Assert.IsType<OkObjectResult>(result.Result);
                var token = Assert.IsType<string>(okResult.Value.GetType().GetProperty("token").GetValue(okResult.Value, null));
                Assert.NotNull(token);
            }
        }

        [Fact]
        public async Task UpdatePageContent_ExistingId_Returns204()
        {
            var options = CreateDbOptions("TestDb_UpdatePC_Existing");
            var (imageServiceMock, configMock) = CreateMocks();

            using (var context = new ApplicationDbContext(options))
            {
                context.PageContents.Add(new PageContent
                {
                    PageKey = "home",
                    ContentKey = "title",
                    TextContent = "Old text"
                });
                await context.SaveChangesAsync();
            }

            using (var context = new ApplicationDbContext(options))
            {
                var controller = new AdminController(context, imageServiceMock.Object, configMock.Object);
                var dto = new UpdatePageContentDto
                {
                    TextContent = "New text",
                    DisplayOrder = 1,
                    IsActive = true
                };

                var result = await controller.UpdatePageContent(1, dto);

                Assert.IsType<NoContentResult>(result);
                var updated = await context.PageContents.FindAsync(1);
                Assert.Equal("New text", updated!.TextContent);
            }
        }

        [Fact]
        public async Task UpdatePageContent_NonExistingId_Returns404()
        {
            var options = CreateDbOptions("TestDb_UpdatePC_NotFound");
            var (imageServiceMock, configMock) = CreateMocks();

            using (var context = new ApplicationDbContext(options))
            {
                var controller = new AdminController(context, imageServiceMock.Object, configMock.Object);
                var dto = new UpdatePageContentDto { TextContent = "text" };

                var result = await controller.UpdatePageContent(999, dto);

                Assert.IsType<NotFoundResult>(result);
            }
        }

        [Fact]
        public async Task CreatePageContent_NewRecord_ReturnsCreated()
        {
            var options = CreateDbOptions("TestDb_CreatePC_New");
            var (imageServiceMock, configMock) = CreateMocks();

            using (var context = new ApplicationDbContext(options))
            {
                var controller = new AdminController(context, imageServiceMock.Object, configMock.Object);
                var dto = new CreatePageContentDto
                {
                    PageKey = "about",
                    ContentKey = "header",
                    TextContent = "About Us",
                    DisplayOrder = 0,
                    IsActive = true
                };

                var result = await controller.CreatePageContent(dto);

                var createdResult = Assert.IsType<CreatedAtActionResult>(result.Result);
                var pageContent = Assert.IsType<PageContent>(createdResult.Value);
                Assert.Equal("about", pageContent.PageKey);
                Assert.Equal("header", pageContent.ContentKey);
                Assert.Equal("About Us", pageContent.TextContent);
            }
        }

        [Fact]
        public async Task CreatePageContent_DuplicateKey_UpdatesExisting()
        {
            var options = CreateDbOptions("TestDb_CreatePC_Upsert");
            var (imageServiceMock, configMock) = CreateMocks();

            using (var context = new ApplicationDbContext(options))
            {
                context.PageContents.Add(new PageContent
                {
                    PageKey = "home",
                    ContentKey = "banner",
                    TextContent = "Original"
                });
                await context.SaveChangesAsync();
            }

            using (var context = new ApplicationDbContext(options))
            {
                var controller = new AdminController(context, imageServiceMock.Object, configMock.Object);
                var dto = new CreatePageContentDto
                {
                    PageKey = "home",
                    ContentKey = "banner",
                    TextContent = "Updated via upsert",
                    DisplayOrder = 5,
                    IsActive = false
                };

                var result = await controller.CreatePageContent(dto);

                var okResult = Assert.IsType<OkObjectResult>(result.Result);
                var pageContent = Assert.IsType<PageContent>(okResult.Value);
                Assert.Equal("Updated via upsert", pageContent.TextContent);
                Assert.Equal(5, pageContent.DisplayOrder);
                Assert.False(pageContent.IsActive);

                Assert.Equal(1, await context.PageContents.CountAsync());
            }
        }

        [Fact]
        public async Task CreatePageContent_WithImage_SavesImagePath()
        {
            var options = CreateDbOptions("TestDb_CreatePC_Image");
            var (imageServiceMock, configMock) = CreateMocks();

            var fileMock = new Mock<IFormFile>();
            fileMock.Setup(f => f.FileName).Returns("test.jpg");
            fileMock.Setup(f => f.Length).Returns(1024);

            imageServiceMock
                .Setup(s => s.SaveImageAsync(It.IsAny<IFormFile>(), "page-content"))
                .ReturnsAsync("/uploads/page-content/test.jpg");

            using (var context = new ApplicationDbContext(options))
            {
                var controller = new AdminController(context, imageServiceMock.Object, configMock.Object);
                var dto = new CreatePageContentDto
                {
                    PageKey = "gallery",
                    ContentKey = "photo1",
                    TextContent = "A photo",
                    Image = fileMock.Object
                };

                var result = await controller.CreatePageContent(dto);

                var createdResult = Assert.IsType<CreatedAtActionResult>(result.Result);
                var pageContent = Assert.IsType<PageContent>(createdResult.Value);
                Assert.Equal("/uploads/page-content/test.jpg", pageContent.ImagePath);
                imageServiceMock.Verify(s => s.SaveImageAsync(fileMock.Object, "page-content"), Times.Once);
            }
        }
    }
}