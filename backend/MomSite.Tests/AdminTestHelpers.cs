using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Moq;
using MomSite.Infrastructure.Data;
using MomSite.Infrastructure.Services;

namespace MomSite.Tests
{
    internal static class AdminTestHelpers
    {
        public static DbContextOptions<ApplicationDbContext> CreateDbOptions(string dbName)
        {
            return new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: dbName)
                .Options;
        }

        public static (Mock<IImageService>, Mock<IConfiguration>) CreateMocks()
        {
            var imageServiceMock = new Mock<IImageService>();
            var configurationMock = new Mock<IConfiguration>();
            configurationMock.Setup(c => c["AdminPassword"]).Returns("password");
            configurationMock.Setup(c => c["JWT:Secret"]).Returns("your-super-secret-key-that-is-long-enough-for-hs256");
            return (imageServiceMock, configurationMock);
        }
    }
}
