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

namespace MomSite.Tests
{
    public class PublicControllerTests
    {
        [Fact]
        public async Task GetHomeData_ReturnsOkResult_WithHomeData()
        {
            // Arrange
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: "TestDatabase")
                .Options;

            using (var context = new ApplicationDbContext(options))
            {
                context.PageContents.Add(new PageContent { PageKey = "home", ContentKey = "welcome_message", TextContent = "Welcome!", IsActive = true });
                context.PageContents.Add(new PageContent { PageKey = "home", ContentKey = "banner_image", ImagePath = "banner.jpg", IsActive = true });
                context.Reviews.Add(new Review { AuthorName = "Test Author", Content = "Test Content", Rating = 5, IsActive = true });
                context.SaveChanges();
            }

            using (var context = new ApplicationDbContext(options))
            {
                var controller = new PublicController(context);

                // Act
                var result = await controller.GetHomeData();

                // Assert
                var okResult = Assert.IsType<OkObjectResult>(result.Result);
                var homeData = Assert.IsType<HomeData>(okResult.Value);
                Assert.Equal("Welcome!", homeData.WelcomeMessage);
                Assert.Equal("banner.jpg", homeData.BannerImage);
                Assert.Single(homeData.Reviews);
            }
        }
    }
}
