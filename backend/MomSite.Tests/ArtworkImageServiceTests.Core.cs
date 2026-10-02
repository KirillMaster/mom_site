using Microsoft.EntityFrameworkCore;
using MomSite.Core.Models;
using MomSite.Infrastructure.Data;
using MomSite.Infrastructure.Services;
using static MomSite.Tests.ArtworkImageFixtures;

namespace MomSite.Tests
{
    public partial class ArtworkImageServiceTests
    {
        private readonly List<string> _deleted = new();

        private (ApplicationDbContext ctx, ArtworkImageService svc) Create()
        {
            var ctx = new ApplicationDbContext(AdminTestHelpers.CreateDbOptions(Guid.NewGuid().ToString()));
            return (ctx, new ArtworkImageService(ctx, ImageServiceMock(_deleted).Object));
        }

        private static async Task<List<ArtworkImage>> ImagesOf(ApplicationDbContext ctx, int artworkId) =>
            await ctx.ArtworkImages.Where(i => i.ArtworkId == artworkId).OrderBy(i => i.SortOrder).ToListAsync();
    }
}
