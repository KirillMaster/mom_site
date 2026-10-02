
namespace MomSite.Tests
{
    public partial class ArtworkImageServiceTests
    {
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
    }
}
