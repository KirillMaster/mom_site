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

namespace MomSite.Tests
{
    public class AdminControllerTests
    {
        [Fact]
        public async Task Login_WithValidCredentials_ReturnsOkResult_WithToken()
        {
            // Arrange
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: "TestDatabase_Admin")
                .Options;

            var imageServiceMock = new Mock<IImageService>();
            var configurationMock = new Mock<IConfiguration>();
            configurationMock.Setup(c => c["AdminPassword"]).Returns("password");
            configurationMock.Setup(c => c["JWT:Secret"]).Returns("your-super-secret-key-that-is-long-enough-for-hs256");

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
    }
}