using Microsoft.EntityFrameworkCore;
using MomSite.Core.Models;
using MomSite.Infrastructure.Data;
using MomSite.Infrastructure.Services;
using static MomSite.Tests.ArtworkImageFixtures;

namespace MomSite.Tests
{
    public class ArtworkImageServiceTests
    {
        private readonly List<string> _deleted = new();

        private (ApplicationDbContext ctx, ArtworkImageService svc) Create()
        {
            var ctx = new ApplicationDbContext(AdminTestHelpers.CreateDbOptions(Guid.NewGuid().ToString()));
            return (ctx, new ArtworkImageService(ctx, ImageServiceMock(_deleted).Object));
        }

        private static async Task<List<ArtworkImage>> ImagesOf(ApplicationDbContext ctx, int artworkId) =>
            await ctx.ArtworkImages.Where(i => i.ArtworkId == artworkId).OrderBy(i => i.SortOrder).ToListAsync();

        [Fact, Trait("scenario", "US1-BE1")]
        public async Task US1_BE1_AddImages_AppendsInSendOrder_KeepsCover()
        {
            var (ctx, svc) = Create();
            var art = await SeedArtworkAsync(ctx, 1);
            var cover = art.ImagePath;

            var result = await svc.AddImagesAsync(art.Id, new[] { Image("1.jpg"), Image("2.jpg"), Image("3.jpg") });

            Assert.Equal(ArtworkImageStatus.Ok, result.Status);
            Assert.Equal(new[] { 0, 1, 2, 3 }, result.Images.Select(i => i.SortOrder));
            Assert.EndsWith("_1.jpg", result.Images[1].ImagePath);
            Assert.EndsWith("_3.jpg", result.Images[3].ImagePath);
            Assert.Equal(cover, (await ctx.Artworks.FindAsync(art.Id))!.ImagePath);
            Assert.Equal(4, (await ImagesOf(ctx, art.Id)).Count);
        }

        [Fact, Trait("scenario", "US1-BE2")]
        public async Task US1_BE2_Reorder_PersistsNewOrder()
        {
            var (ctx, svc) = Create();
            var art = await SeedArtworkAsync(ctx, 4);
            var ids = art.Images.Select(i => i.Id).ToList();
            var newOrder = new List<int> { ids[2], ids[0], ids[3], ids[1] };

            var result = await svc.ReorderAsync(art.Id, newOrder);

            Assert.Equal(ArtworkImageStatus.Ok, result.Status);
            Assert.Equal(newOrder, result.Images.Select(i => i.Id));
            Assert.Equal(new[] { 0, 1, 2, 3 }, result.Images.Select(i => i.SortOrder));
            Assert.Equal(newOrder, (await ImagesOf(ctx, art.Id)).Select(i => i.Id));
        }

        [Fact, Trait("scenario", "US1-BE3")]
        public async Task US1_BE3_Reorder_FirstImageBecomesCover()
        {
            var (ctx, svc) = Create();
            var art = await SeedArtworkAsync(ctx, 4);
            var third = art.Images[2];
            var order = new List<int> { third.Id, art.Images[0].Id, art.Images[1].Id, art.Images[3].Id };

            await svc.ReorderAsync(art.Id, order);

            var saved = (await ctx.Artworks.FindAsync(art.Id))!;
            Assert.Equal(third.ImagePath, saved.ImagePath);
            Assert.Equal(third.ThumbnailPath, saved.ThumbnailPath);
        }

        [Fact, Trait("scenario", "US1-BE4")]
        public async Task US1_BE4_Delete_NonCover_NormalizesOrderAndDeletesFiles()
        {
            var (ctx, svc) = Create();
            var art = await SeedArtworkAsync(ctx, 4);
            var second = art.Images[1];
            var cover = art.ImagePath;

            var result = await svc.DeleteImageAsync(art.Id, second.Id);

            Assert.Equal(ArtworkImageStatus.Ok, result.Status);
            Assert.Equal(new[] { 0, 1, 2 }, result.Images.Select(i => i.SortOrder));
            Assert.Contains(second.ImagePath, _deleted);
            Assert.Contains(second.ThumbnailPath, _deleted);
            Assert.Equal(cover, (await ctx.Artworks.FindAsync(art.Id))!.ImagePath);
            Assert.Equal(3, (await ImagesOf(ctx, art.Id)).Count);
        }

        [Fact, Trait("scenario", "US1-EC2")]
        public async Task US1_EC2_Delete_Cover_NextImageBecomesCover()
        {
            var (ctx, svc) = Create();
            var art = await SeedArtworkAsync(ctx, 4);
            var second = art.Images[1];

            var result = await svc.DeleteImageAsync(art.Id, art.Images[0].Id);

            Assert.Equal(3, result.Images.Count);
            Assert.Equal(second.Id, result.Images[0].Id);
            Assert.Equal(0, result.Images[0].SortOrder);
            var saved = (await ctx.Artworks.FindAsync(art.Id))!;
            Assert.Equal(second.ImagePath, saved.ImagePath);
            Assert.Equal(second.ThumbnailPath, saved.ThumbnailPath);
        }

        [Fact, Trait("scenario", "US1-BE5")]
        public async Task US1_BE5_AddImages_OverLimit_BadRequest()
        {
            var (ctx, svc) = Create();
            var art = await SeedArtworkAsync(ctx, 10);

            var result = await svc.AddImagesAsync(art.Id, new[] { Image() });

            Assert.Equal(ArtworkImageStatus.BadRequest, result.Status);
            Assert.Contains("10", result.Message);
            Assert.Equal(10, (await ImagesOf(ctx, art.Id)).Count);
        }

        [Fact, Trait("scenario", "US1-EC3")]
        public async Task US1_EC3_Delete_LastImage_BadRequest_KeepsFiles()
        {
            var (ctx, svc) = Create();
            var art = await SeedArtworkAsync(ctx, 1);

            var result = await svc.DeleteImageAsync(art.Id, art.Images[0].Id);

            Assert.Equal(ArtworkImageStatus.BadRequest, result.Status);
            Assert.Equal("У работы должно быть хотя бы одно фото", result.Message);
            Assert.Empty(_deleted);
            Assert.Single(await ImagesOf(ctx, art.Id));
        }

        [Theory, Trait("scenario", "US1-EC4")]
        [InlineData("text")]
        [InlineData("big")]
        [InlineData("empty")]
        [InlineData("mixed")]
        public async Task US1_EC4_AddImages_Invalid_BadRequest_NothingAdded(string kind)
        {
            var (ctx, svc) = Create();
            var art = await SeedArtworkAsync(ctx, 2);
            var files = kind switch
            {
                "text" => new List<Microsoft.AspNetCore.Http.IFormFile> { Image("a.txt", "text/plain") },
                "big" => new List<Microsoft.AspNetCore.Http.IFormFile> { Image("big.jpg", "image/jpeg", 15L * 1024 * 1024 + 1) },
                "empty" => new List<Microsoft.AspNetCore.Http.IFormFile>(),
                _ => new List<Microsoft.AspNetCore.Http.IFormFile> { Image("ok.jpg"), Image("a.txt", "text/plain") }
            };

            var result = await svc.AddImagesAsync(art.Id, files);

            Assert.Equal(ArtworkImageStatus.BadRequest, result.Status);
            Assert.False(string.IsNullOrWhiteSpace(result.Message));
            Assert.Equal(2, (await ImagesOf(ctx, art.Id)).Count);
        }

        [Theory, Trait("scenario", "US1-EC5")]
        [InlineData("foreign")]
        [InlineData("missing-id")]
        [InlineData("subset")]
        [InlineData("duplicate")]
        public async Task US1_EC5_Reorder_InvalidSet_BadRequest_Unchanged(string kind)
        {
            var (ctx, svc) = Create();
            var a = await SeedArtworkAsync(ctx, 3, "A");
            var b = await SeedArtworkAsync(ctx, 2, "B");
            var ids = a.Images.Select(i => i.Id).ToList();
            var attempt = kind switch
            {
                "foreign" => new List<int> { ids[0], ids[1], b.Images[0].Id },
                "missing-id" => new List<int> { ids[0], ids[1], 99999 },
                "subset" => new List<int> { ids[1], ids[0] },
                _ => new List<int> { ids[0], ids[0], ids[1] }
            };

            var result = await svc.ReorderAsync(a.Id, attempt);

            Assert.Equal(ArtworkImageStatus.BadRequest, result.Status);
            Assert.False(string.IsNullOrWhiteSpace(result.Message));
            Assert.Equal(ids, (await ImagesOf(ctx, a.Id)).Select(i => i.Id));
            Assert.Equal(a.Images[0].ImagePath, (await ctx.Artworks.FindAsync(a.Id))!.ImagePath);
        }

        [Fact, Trait("scenario", "US1-BE7")]
        public async Task US1_BE7_UnknownArtworkOrForeignImage_NotFound()
        {
            var (ctx, svc) = Create();
            var a = await SeedArtworkAsync(ctx, 2, "A");
            var b = await SeedArtworkAsync(ctx, 2, "B");

            Assert.Equal(ArtworkImageStatus.NotFound, (await svc.AddImagesAsync(9999, new[] { Image() })).Status);
            Assert.Equal(ArtworkImageStatus.NotFound, (await svc.ReorderAsync(9999, new List<int> { 1 })).Status);
            Assert.Equal(ArtworkImageStatus.NotFound, (await svc.DeleteImageAsync(a.Id, b.Images[0].Id)).Status);
            Assert.Equal(2, (await ImagesOf(ctx, b.Id)).Count);
        }

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
