
namespace MomSite.Tests
{
    public partial class ArtworkImageServiceTests
    {
        [Fact, Trait("scenario", "US1-EC7")]
        public async Task US1_EC7_SetCover_ReplacesSortOrder0_NoGrowth()
        {
            var (ctx, svc) = Create();
            var art = await SeedArtworkAsync(ctx, 3);
            var oldCover = art.ImagePath;
            var loaded = await ctx.Artworks.Include(a => a.Images).FirstAsync(a => a.Id == art.Id);

            await svc.SetCoverAsync(loaded, Image("new.jpg"));
            await ctx.SaveChangesAsync();

            var images = await ImagesOf(ctx, art.Id);
            Assert.Equal(3, images.Count);
            Assert.Contains("new.jpg", images[0].ImagePath);
            Assert.Equal(images[0].ImagePath, loaded.ImagePath);
            Assert.Equal(images[0].ThumbnailPath, loaded.ThumbnailPath);
            Assert.Contains(oldCover, _deleted);
        }

        [Fact, Trait("scenario", "US1-EC6")]
        public async Task US1_EC6_DeleteAllFiles_RemovesEveryImageAndThumbnail()
        {
            var (ctx, svc) = Create();
            var art = await SeedArtworkAsync(ctx, 3);

            svc.DeleteAllFiles(art);

            foreach (var i in art.Images)
            {
                Assert.Contains(i.ImagePath, _deleted);
                Assert.Contains(i.ThumbnailPath, _deleted);
            }
        }
    }
}
