
namespace MomSite.Tests
{
    public partial class ArtworkImageServiceTests
    {
        [Fact, Trait("scenario", "US1-BE5")]
        public async Task US1_BE5_AddImages_Exactly9Plus2_BadRequest()
        {
            var (ctx, svc) = Create();
            var art = await SeedArtworkAsync(ctx, 9);

            var result = await svc.AddImagesAsync(art.Id, new[] { Image("1.jpg"), Image("2.jpg") });

            Assert.Equal(ArtworkImageStatus.BadRequest, result.Status);
            Assert.Contains("10", result.Message);
            Assert.Equal(9, (await ImagesOf(ctx, art.Id)).Count);
        }

        [Fact, Trait("scenario", "US1-BE5")]
        public async Task US1_BE5_AddImages_Exactly9Plus1_Success()
        {
            var (ctx, svc) = Create();
            var art = await SeedArtworkAsync(ctx, 9);

            var result = await svc.AddImagesAsync(art.Id, new[] { Image("1.jpg") });

            Assert.Equal(ArtworkImageStatus.Ok, result.Status);
            Assert.Equal(10, result.Images.Count);
            Assert.Equal(new[] { 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 }, result.Images.Select(i => i.SortOrder));
            Assert.Equal(10, (await ImagesOf(ctx, art.Id)).Count);
        }

        [Fact, Trait("scenario", "US1-EC4")]
        public async Task US1_EC4_AddImages_FileSizeExactly15MB_Success()
        {
            var (ctx, svc) = Create();
            var art = await SeedArtworkAsync(ctx, 1);
            var exactSize = 15L * 1024 * 1024;

            var result = await svc.AddImagesAsync(art.Id, new[] { Image("exact.jpg", "image/jpeg", exactSize) });

            Assert.Equal(ArtworkImageStatus.Ok, result.Status);
            Assert.Equal(2, result.Images.Count);
        }

        [Fact, Trait("scenario", "US1-EC4")]
        public async Task US1_EC4_AddImages_FileSizeJustUnder15MB_Success()
        {
            var (ctx, svc) = Create();
            var art = await SeedArtworkAsync(ctx, 1);
            var justUnder = 15L * 1024 * 1024 - 1;

            var result = await svc.AddImagesAsync(art.Id, new[] { Image("under.jpg", "image/jpeg", justUnder) });

            Assert.Equal(ArtworkImageStatus.Ok, result.Status);
            Assert.Equal(2, result.Images.Count);
        }

        [Fact, Trait("scenario", "US1-EC5")]
        public async Task US1_EC5_Reorder_EmptyList_BadRequest()
        {
            var (ctx, svc) = Create();
            var art = await SeedArtworkAsync(ctx, 3);

            var result = await svc.ReorderAsync(art.Id, new List<int>());

            Assert.Equal(ArtworkImageStatus.BadRequest, result.Status);
            Assert.False(string.IsNullOrWhiteSpace(result.Message));
            Assert.Equal(art.Images[0].ImagePath, (await ctx.Artworks.FindAsync(art.Id))!.ImagePath);
        }

        [Fact, Trait("scenario", "US1-BE2")]
        public async Task US1_BE2_Reorder_SingleImage_Success()
        {
            var (ctx, svc) = Create();
            var art = await SeedArtworkAsync(ctx, 1);
            var imageId = art.Images[0].Id;

            var result = await svc.ReorderAsync(art.Id, new List<int> { imageId });

            Assert.Equal(ArtworkImageStatus.Ok, result.Status);
            Assert.Single(result.Images);
            Assert.Equal(0, result.Images[0].SortOrder);
        }

        [Fact, Trait("scenario", "US1-BE2")]
        public async Task US1_BE2_Reorder_TwoImages_ReverseOrder()
        {
            var (ctx, svc) = Create();
            var art = await SeedArtworkAsync(ctx, 2);
            var ids = art.Images.Select(i => i.Id).ToList();
            var reversed = new List<int> { ids[1], ids[0] };

            var result = await svc.ReorderAsync(art.Id, reversed);

            Assert.Equal(ArtworkImageStatus.Ok, result.Status);
            Assert.Equal(reversed, result.Images.Select(i => i.Id));
            Assert.Equal(new[] { 0, 1 }, result.Images.Select(i => i.SortOrder));
            Assert.Equal(art.Images[1].ImagePath, (await ctx.Artworks.FindAsync(art.Id))!.ImagePath);
        }

        [Fact, Trait("scenario", "US1-BE4")]
        public async Task US1_BE4_Delete_LastOfTwo_SucceedsLeavingOne()
        {
            var (ctx, svc) = Create();
            var art = await SeedArtworkAsync(ctx, 2);
            var lastId = art.Images[1].Id;

            var result = await svc.DeleteImageAsync(art.Id, lastId);

            Assert.Equal(ArtworkImageStatus.Ok, result.Status);
            Assert.Single(result.Images);
            Assert.Equal(0, result.Images[0].SortOrder);
            Assert.Equal(1, (await ImagesOf(ctx, art.Id)).Count);
        }

        [Fact, Trait("scenario", "US1-BE4")]
        public async Task US1_BE4_Delete_FirstOfTwo_SecondBecomeCover()
        {
            var (ctx, svc) = Create();
            var art = await SeedArtworkAsync(ctx, 2);
            var firstId = art.Images[0].Id;
            var secondPath = art.Images[1].ImagePath;

            var result = await svc.DeleteImageAsync(art.Id, firstId);

            Assert.Equal(ArtworkImageStatus.Ok, result.Status);
            Assert.Single(result.Images);
            Assert.Equal(0, result.Images[0].SortOrder);
            Assert.Equal(secondPath, result.Images[0].ImagePath);
            var saved = (await ctx.Artworks.FindAsync(art.Id))!;
            Assert.Equal(secondPath, saved.ImagePath);
            Assert.Equal(secondPath.Replace("/artworks/", "/thumbnails/"), saved.ThumbnailPath);
        }

        [Fact, Trait("scenario", "US1-EC4")]
        public async Task US1_EC4_AddImages_CaseInsensitiveImageContentType_Success()
        {
            var (ctx, svc) = Create();
            var art = await SeedArtworkAsync(ctx, 1);

            var result = await svc.AddImagesAsync(art.Id, new[] {
                Image("mixed.jpg", "Image/JPEG")
            });

            Assert.Equal(ArtworkImageStatus.Ok, result.Status);
            Assert.Equal(2, result.Images.Count);
        }

        [Fact, Trait("scenario", "US1-BE1")]
        public async Task US1_BE1_AddImages_SortOrderSequential()
        {
            var (ctx, svc) = Create();
            var art = await SeedArtworkAsync(ctx, 2);
            var beforeCount = art.Images.Count;

            var result = await svc.AddImagesAsync(art.Id, new[] { Image("1.jpg"), Image("2.jpg"), Image("3.jpg") });

            Assert.Equal(ArtworkImageStatus.Ok, result.Status);
            var images = result.Images;
            for (var i = 0; i < images.Count; i++)
            {
                Assert.Equal(i, images[i].SortOrder);
            }
            var saved = await ImagesOf(ctx, art.Id);
            for (var i = 0; i < saved.Count; i++)
            {
                Assert.Equal(i, saved[i].SortOrder);
            }
        }

        [Fact, Trait("scenario", "US1-BE3")]
        public async Task US1_BE3_Reorder_CoverSyncedWithImagePath()
        {
            var (ctx, svc) = Create();
            var art = await SeedArtworkAsync(ctx, 4);
            var thirdId = art.Images[2].Id;
            var thirdPath = art.Images[2].ImagePath;
            var thirdThumb = art.Images[2].ThumbnailPath;

            await svc.ReorderAsync(art.Id, new List<int> { thirdId, art.Images[0].Id, art.Images[1].Id, art.Images[3].Id });

            var saved = await ctx.Artworks.AsNoTracking().FirstAsync(a => a.Id == art.Id);
            Assert.Equal(thirdPath, saved.ImagePath);
            Assert.Equal(thirdThumb, saved.ThumbnailPath);
            var images = await ImagesOf(ctx, art.Id);
            Assert.Equal(thirdPath, images[0].ImagePath);
            Assert.Equal(thirdThumb, images[0].ThumbnailPath);
        }

        [Fact, Trait("scenario", "US1-EC3")]
        public async Task US1_EC3_Delete_NoFilesDeletedOnLastImageRejection()
        {
            var (ctx, svc) = Create();
            var art = await SeedArtworkAsync(ctx, 1);
            var imagePath = art.Images[0].ImagePath;
            var thumbPath = art.Images[0].ThumbnailPath;

            var result = await svc.DeleteImageAsync(art.Id, art.Images[0].Id);

            Assert.Equal(ArtworkImageStatus.BadRequest, result.Status);
            Assert.DoesNotContain(imagePath, _deleted);
            Assert.DoesNotContain(thumbPath, _deleted);
        }
    }
}
