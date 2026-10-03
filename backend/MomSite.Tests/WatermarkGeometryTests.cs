using Microsoft.AspNetCore.Http;
using Moq;
using SixLabors.ImageSharp;
using SImage = SixLabors.ImageSharp.Image;
using SixLabors.ImageSharp.PixelFormats;

namespace MomSite.Tests
{
    public class WatermarkGeometryTests
    {
        [Fact, Trait("scenario", "US7-AS1")]
        public void US7_AS1_Geometry_3000x2000_SmallTextInBottomRightCorner()
        {
            var l = WatermarkGeometry.Compute(3000, 2000);

            Assert.True(l.FontSize <= 60);
            Assert.True(l.OriginX > 3000 * 0.75f && l.OriginX < 3000);
            Assert.True(l.OriginY > 2000 * 0.75f && l.OriginY < 2000);
            Assert.True(l.Alpha <= 102);
        }

        [Fact, Trait("scenario", "US7-AS1")]
        public void US7_AS1_Geometry_SmallImage_KeepsMinimumFontSize()
        {
            Assert.Equal(12f, WatermarkGeometry.Compute(300, 200).FontSize);
        }

        [Fact, Trait("scenario", "US7-AS1")]
        public void US7_AS1_Geometry_MinimalBoundary_1x1_StillHasGeometry()
        {
            var l = WatermarkGeometry.Compute(1, 1);

            Assert.Equal(12f, l.FontSize);
            Assert.True(l.Padding >= 4f);
            Assert.True(l.OriginX <= 1);
            Assert.True(l.OriginY <= 1);
            Assert.Equal(102, l.Alpha);
        }

        [Fact, Trait("scenario", "US7-AS1")]
        public void US7_AS1_Geometry_SquareImage_SymmetricOrigin()
        {
            var l = WatermarkGeometry.Compute(1000, 1000);

            Assert.Equal(l.OriginX, l.OriginY);
        }

        [Fact, Trait("scenario", "US7-AS1")]
        public void US7_AS1_Geometry_VeryLargeImage_ProportionalFontSize()
        {
            var large = WatermarkGeometry.Compute(10000, 10000);
            var small = WatermarkGeometry.Compute(100, 100);

            Assert.True(large.FontSize > small.FontSize);
            Assert.True(large.Padding > small.Padding);
        }

        [Fact, Trait("scenario", "US7-AS1")]
        public void US7_AS1_Geometry_WideImage_OriginLocatedCorrectly()
        {
            var l = WatermarkGeometry.Compute(5000, 500);

            Assert.True(l.OriginX > 5000 * 0.75f);
            Assert.True(l.OriginY > 500 * 0.75f);
            Assert.True(l.OriginX <= 5000);
            Assert.True(l.OriginY <= 500);
        }

        [Fact, Trait("scenario", "US7-AS1")]
        public async Task US7_AS1_RealImage_CornerMarked_BottomCenterUntouched_ThumbnailClean()
        {
            var service = new ImageService(new Mock<IS3Service>().Object);
            var file = PngFile(3000, 2000, new Rgba32(128, 128, 128, 255));

            var original = await service.SaveImageAsync(file, "artworks");
            var marked = await service.AddWatermarkAsync(original, "x");
            var thumb = await service.CreateThumbnailAsync(original, 300, 300);

            var uploads = Path.Combine(Directory.GetCurrentDirectory(), "uploads");
            var gray = new Rgba32(128, 128, 128, 255);
            using var m = await SImage.LoadAsync<Rgba32>(Path.Combine(uploads, marked.Replace("/uploads/", "")));
            for (var x = 1400; x < 1600; x++)
                for (var y = 1960; y < 2000; y++)
                    Assert.Equal(gray, m[x, y]);
            var changed = 0;
            for (var x = 2000; x < 3000; x++)
                for (var y = 1850; y < 2000; y++)
                    if (m[x, y] != gray) changed++;
            Assert.True(changed > 0);
            var elsewhere = 0;
            for (var x = 0; x < 3000; x += 3)
                for (var y = 0; y < 1850; y += 3)
                    if (m[x, y] != gray) elsewhere++;
            Assert.Equal(0, elsewhere);

            using var t = await SImage.LoadAsync<Rgba32>(Path.Combine(uploads, thumb.Replace("/uploads/", "")));
            for (var x = 0; x < t.Width; x++)
                for (var y = 0; y < t.Height; y++)
                    Assert.True(Math.Abs(t[x, y].R - 128) <= 1, $"thumb pixel {x},{y}");
        }

        private static IFormFile PngFile(int w, int h, Rgba32 color)
        {
            using var img = new Image<Rgba32>(w, h, color);
            var ms = new MemoryStream();
            img.SaveAsPng(ms);
            ms.Position = 0;
            return new FormFile(ms, 0, ms.Length, "Images", "wm_test.png") { Headers = new HeaderDictionary(), ContentType = "image/png" };
        }
    }
}
