
namespace MomSite.Tests
{
    public partial class ArtworkImageServiceTests
    {
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
    }
}
