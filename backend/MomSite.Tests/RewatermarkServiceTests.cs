using Moq;

namespace MomSite.Tests
{
    public class RewatermarkServiceTests
    {
        private const string Base = "https://s3.twcstorage.ru/bkt/";
        private const string Orig = "2026/10/02/g1_artworks/orig.jpg";
        private const string Copy = "2026/10/02/g2_artworks/watermarked_copy.jpg";
        private static readonly DateTime T = new(2026, 10, 1, 10, 0, 0, DateTimeKind.Utc);

        private class Env
        {
            public ApplicationDbContext Ctx = new(AdminTestHelpers.CreateDbOptions(Guid.NewGuid().ToString()));
            public Mock<IS3Service> S3 = new();
            public Mock<IImageService> Images = new();
            public List<string> Calls = new();
            public RewatermarkService Service => new(Ctx, S3.Object, Images.Object);

            public Env(params StorageObject[] objects)
            {
                S3.Setup(s => s.ListObjectsAsync(It.IsAny<string>())).ReturnsAsync(objects);
                Images.Setup(i => i.GetWatermarkText()).Returns("wm");
                Images.Setup(i => i.AddWatermarkAsync(It.IsAny<string>(), It.IsAny<string>()))
                    .Callback<string, string>((p, _) => Calls.Add("wm:" + p))
                    .ReturnsAsync((string p, string _) => Base + "2026/10/03/new_artworks/watermarked_new.jpg");
                Images.Setup(i => i.CreateThumbnailAsync(It.IsAny<string>(), It.IsAny<int>(), It.IsAny<int>()))
                    .Callback<string, int, int>((p, _, _) => Calls.Add("thumb:" + p))
                    .ReturnsAsync(Base + "2026/10/03/new_thumbnails/thumb_new.jpg");
                Images.Setup(i => i.DeleteImage(It.IsAny<string>())).Callback<string>(p => Calls.Add("del:" + p));
            }

            public async Task<(Artwork Art, ArtworkImage Img)> SeedAsync(string key, string suffix = "")
            {
                var art = new Artwork { Title = "A" + suffix, Category = new Category { Name = "C" + suffix + Guid.NewGuid().ToString("N") } };
                var img = new ArtworkImage
                {
                    ImagePath = Base + key,
                    ThumbnailPath = Base + "2026/10/02/old_thumbnails/thumb_" + suffix + ".jpg",
                    SortOrder = 0
                };
                art.Images.Add(img);
                art.ImagePath = img.ImagePath;
                art.ThumbnailPath = img.ThumbnailPath;
                Ctx.Artworks.Add(art);
                await Ctx.SaveChangesAsync();
                return (art, img);
            }
        }

        private static StorageObject Obj(string key, double sec) => new(key, T.AddSeconds(sec));

        [Fact, Trait("scenario", "US7-AS2")]
        public async Task US7_AS2_Rewatermark_RebuildsFromOriginal_UpdatesPaths_DeletesOldAfterSave()
        {
            var env = new Env(Obj(Orig, 0), Obj(Copy, 3));
            var (_, img) = await env.SeedAsync(Copy);
            var oldThumb = img.ThumbnailPath;
            var oldCopy = img.ImagePath;

            var report = await env.Service.RunAsync(false, 25);

            Assert.False(report.DryRun);
            Assert.Equal(1, report.Matched);
            Assert.Equal(1, report.Processed);
            Assert.Equal(0, report.Remaining);
            Assert.Contains("wm:" + Base + Orig, env.Calls);
            Assert.Contains("thumb:" + Base + Orig, env.Calls);
            var saved = await env.Ctx.ArtworkImages.AsNoTracking().SingleAsync();
            Assert.EndsWith("watermarked_new.jpg", saved.ImagePath);
            Assert.EndsWith("thumb_new.jpg", saved.ThumbnailPath);
            Assert.Equal(Base + Orig, saved.OriginalPath);
            var savedArt = await env.Ctx.Artworks.AsNoTracking().SingleAsync();
            Assert.Equal(saved.ImagePath, savedArt.ImagePath);
            Assert.Equal(saved.ThumbnailPath, savedArt.ThumbnailPath);
            Assert.Contains("del:" + oldCopy, env.Calls);
            Assert.Contains("del:" + oldThumb, env.Calls);
            Assert.DoesNotContain("del:" + Base + Orig, env.Calls);
            Assert.True(env.Calls.IndexOf("del:" + oldCopy) > env.Calls.IndexOf("thumb:" + Base + Orig));
        }

        [Fact, Trait("scenario", "US7-AS2")]
        public async Task US7_AS2_Rewatermark_KeepsArtworkPathsThatDiffered()
        {
            var env = new Env(Obj(Orig, 0), Obj(Copy, 3));
            var (art, _) = await env.SeedAsync(Copy);
            art.ImagePath = "/other/cover.jpg";
            art.ThumbnailPath = "/other/cover_thumb.jpg";
            await env.Ctx.SaveChangesAsync();

            await env.Service.RunAsync(false, 25);

            var savedArt = await env.Ctx.Artworks.AsNoTracking().SingleAsync();
            Assert.Equal("/other/cover.jpg", savedArt.ImagePath);
            Assert.Equal("/other/cover_thumb.jpg", savedArt.ThumbnailPath);
        }

        [Fact, Trait("scenario", "US7-AS2")]
        public async Task US7_AS2_SecondRun_DoesNotReprocess_Idempotent()
        {
            var env = new Env(Obj(Orig, 0), Obj(Copy, 3));
            await env.SeedAsync(Copy);
            await env.Service.RunAsync(false, 25);
            env.Calls.Clear();

            var second = await env.Service.RunAsync(false, 25);

            Assert.Equal(0, second.Processed);
            Assert.Equal(0, second.Matched);
            Assert.Empty(env.Calls);
        }

        [Fact, Trait("scenario", "US7-AS2")]
        public async Task US7_AS2_WatermarkFallingBackToOriginal_IsFailure_NotSaved()
        {
            var env = new Env(Obj(Orig, 0), Obj(Copy, 3));
            env.Images.Setup(i => i.AddWatermarkAsync(It.IsAny<string>(), It.IsAny<string>())).ReturnsAsync((string p, string _) => p);
            var (_, img) = await env.SeedAsync(Copy);

            var report = await env.Service.RunAsync(false, 25);

            Assert.Equal(img.Id, report.Failed.Single().Id);
            Assert.Null((await env.Ctx.ArtworkImages.AsNoTracking().SingleAsync()).OriginalPath);
        }

        [Fact, Trait("scenario", "US7-AS3")]
        public async Task US7_AS3_NoOriginalInWindow_Skipped_NothingChanged()
        {
            var env = new Env(Obj(Orig, 0), Obj(Copy, 500));
            var (_, img) = await env.SeedAsync(Copy);
            var before = img.ImagePath;

            var report = await env.Service.RunAsync(false, 25);

            Assert.Equal(new[] { img.Id }, report.Skipped);
            Assert.Equal(0, report.Processed);
            Assert.Equal(1, report.Remaining);
            Assert.Empty(env.Calls);
            Assert.Equal(before, (await env.Ctx.ArtworkImages.AsNoTracking().SingleAsync()).ImagePath);
            env.S3.Verify(s => s.DeleteFileAsync(It.IsAny<string>()), Times.Never);
        }

        [Fact, Trait("scenario", "US7-BE2")]
        public async Task US7_BE2_DryRun_ReportsMatchesOnly()
        {
            var env = new Env(Obj(Orig, 0), Obj(Copy, 3));
            await env.SeedAsync(Copy);

            var report = await env.Service.RunAsync(true, 25);

            Assert.True(report.DryRun);
            Assert.Equal(1, report.Matched);
            Assert.Equal(0, report.Processed);
            Assert.Equal(1, report.Remaining);
            Assert.Empty(env.Calls);
        }

        [Fact, Trait("scenario", "US7-BE4")]
        public async Task US7_BE4_Take_ClampedToRange()
        {
            var env = new Env();
            for (var i = 0; i < 3; i++) await env.SeedAsync($"2026/10/02/g{i}_artworks/watermarked_c{i}.jpg", i.ToString());

            var zero = await env.Service.RunAsync(true, 0);
            var big = await env.Service.RunAsync(true, 101);

            Assert.Single(zero.Skipped);
            Assert.Equal(3, big.Skipped.Count);
        }

        [Fact, Trait("scenario", "US7-EC4")]
        public async Task US7_EC4_S3FailureOnOneImage_ReportedAndBatchContinues()
        {
            const string orig2 = "2026/10/02/g3_artworks/orig2.jpg";
            const string copy2 = "2026/10/02/g4_artworks/watermarked_copy2.jpg";
            var env = new Env(Obj(Orig, 0), Obj(Copy, 3), Obj(orig2, 1000), Obj(copy2, 1003));
            var (_, bad) = await env.SeedAsync(Copy, "1");
            await env.SeedAsync(copy2, "2");
            env.Images.Setup(i => i.AddWatermarkAsync(Base + Orig, It.IsAny<string>())).ThrowsAsync(new IOException("S3 down"));
            var badPath = bad.ImagePath;

            var report = await env.Service.RunAsync(false, 25);

            Assert.Equal(1, report.Processed);
            Assert.Equal(bad.Id, report.Failed.Single().Id);
            Assert.Contains("S3 down", report.Failed.Single().Error);
            var imgs = await env.Ctx.ArtworkImages.AsNoTracking().OrderBy(i => i.Id).ToListAsync();
            Assert.Equal(badPath, imgs[0].ImagePath);
            Assert.Null(imgs[0].OriginalPath);
            Assert.NotNull(imgs[1].OriginalPath);
        }

        [Fact, Trait("scenario", "US7-BE4")]
        public async Task US7_BE4_Take_MinimumBoundary_ProcessesAtLeastOne()
        {
            var env = new Env(Obj(Orig, 0), Obj(Copy, 3));
            await env.SeedAsync(Copy);

            var report = await env.Service.RunAsync(false, 1);

            Assert.Equal(1, report.Matched);
            Assert.Equal(1, report.Processed);
            Assert.True(env.Calls.Any(c => c.StartsWith("del:")));
        }

        [Fact, Trait("scenario", "US7-BE4")]
        public async Task US7_BE4_Take_MaximumBoundary_ProcessesUpTo100()
        {
            var env = new Env();
            for (var i = 0; i < 105; i++)
                await env.SeedAsync($"2026/10/02/g{i}_artworks/watermarked_c{i}.jpg", i.ToString());

            var report = await env.Service.RunAsync(true, 100);

            Assert.Equal(100, report.Skipped.Count);
        }

        [Fact, Trait("scenario", "US7-BE2")]
        public async Task US7_BE2_DryRun_DoesNotDeleteFiles_VerifyDeleteNotCalled()
        {
            var env = new Env(Obj(Orig, 0), Obj(Copy, 3));
            var (_, img) = await env.SeedAsync(Copy);
            var oldPath = img.ImagePath;

            var report = await env.Service.RunAsync(true, 25);

            Assert.True(report.DryRun);
            Assert.Equal(1, report.Matched);
            Assert.Empty(env.Calls.Where(c => c.StartsWith("del:")));
            env.S3.Verify(s => s.DeleteFileAsync(It.IsAny<string>()), Times.Never);
        }

        [Fact, Trait("scenario", "US7-AS2")]
        public async Task US7_AS2_EmptyDatabase_NoProcessing_ReturnsZeros()
        {
            var env = new Env(Obj(Orig, 0), Obj(Copy, 3));

            var report = await env.Service.RunAsync(false, 25);

            Assert.Equal(0, report.Matched);
            Assert.Equal(0, report.Processed);
            Assert.Equal(0, report.Remaining);
            Assert.Empty(env.Calls);
        }
    }
}
