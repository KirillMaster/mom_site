using Microsoft.AspNetCore.Http;
using MomSite.Infrastructure.Blog;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.PixelFormats;

namespace MomSite.Tests.Blog;

public class BlogImageProcessorTests
{
    private static IFormFile MakeFile(byte[] bytes, string contentType, string name = "photo.png") =>
        new FormFile(new MemoryStream(bytes), 0, bytes.Length, "file", name)
        { Headers = new HeaderDictionary(), ContentType = contentType };

    private static byte[] Png(int w, int h)
    {
        using var img = new Image<Rgba32>(w, h);
        using var ms = new MemoryStream();
        img.SaveAsPng(ms);
        return ms.ToArray();
    }

    [Fact]
    public void ValidateRejectsWrongType() =>
        Assert.NotNull(BlogImageProcessor.Validate(MakeFile(new byte[10], "application/pdf")));

    [Fact]
    public void ValidateRejectsEmpty() =>
        Assert.NotNull(BlogImageProcessor.Validate(MakeFile(Array.Empty<byte>(), "image/png")));

    [Fact]
    public void ValidateAcceptsJpeg() =>
        Assert.Null(BlogImageProcessor.Validate(MakeFile(new byte[10], "image/jpeg")));

    [Fact]
    public async Task LargeImageIsShrunkToJpeg()
    {
        var result = await BlogImageProcessor.PrepareAsync(MakeFile(Png(4000, 3000), "image/png"));
        Assert.NotNull(result);
        Assert.Equal("image/jpeg", result!.ContentType);
        Assert.Equal("photo.jpg", result.FileName);
        using var img = await Image.LoadAsync(result.OpenReadStream());
        Assert.Equal(1920, img.Width);
        Assert.Equal(1440, img.Height);
    }

    [Fact]
    public async Task SmallImageIsNotEnlarged()
    {
        var result = await BlogImageProcessor.PrepareAsync(MakeFile(Png(800, 600), "image/png"));
        using var img = await Image.LoadAsync(result!.OpenReadStream());
        Assert.Equal(800, img.Width);
    }

    [Fact]
    public async Task NotAnImageGivesNull() =>
        Assert.Null(await BlogImageProcessor.PrepareAsync(MakeFile(new byte[] { 1, 2, 3, 4 }, "image/jpeg")));
}
