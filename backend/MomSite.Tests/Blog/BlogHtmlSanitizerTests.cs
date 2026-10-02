using MomSite.Infrastructure.Blog;

namespace MomSite.Tests.Blog;

public class BlogHtmlSanitizerTests
{
    private readonly BlogHtmlSanitizer _sut = new(new[] { "s3.twcstorage.ru" }, "angelamoiseenko.ru");

    [Fact]
    public void KeepsEditorFormatting()
    {
        const string html = "<h2>Заголовок</h2><p><strong>жирный</strong> и <em>курсив</em></p><ul><li>раз</li></ul><blockquote>цитата</blockquote>";
        Assert.Equal(html, _sut.Sanitize(html));
    }

    [Theory]
    [InlineData("<script>alert(1)</script><p>ok</p>", "<p>ok</p>")]
    [InlineData("<p onclick=\"x()\">ok</p>", "<p>ok</p>")]
    [InlineData("<iframe src=\"https://evil\"></iframe><p>ok</p>", "<p>ok</p>")]
    [InlineData("<p style=\"color:red\" class=\"c\">ok</p>", "<p>ok</p>")]
    [InlineData("<a href=\"javascript:alert(1)\">x</a>", "<a>x</a>")]
    public void RemovesDangerousMarkup(string input, string expected) =>
        Assert.Equal(expected, _sut.Sanitize(input));

    [Fact]
    public void RemovesWordFormattingButKeepsText()
    {
        var result = _sut.Sanitize("<p class=\"MsoNormal\"><span style=\"font-family:Calibri\">Текст</span></p>");
        Assert.Equal("<p>Текст</p>", result);
    }

    [Theory]
    [InlineData("<img src=\"https://s3.twcstorage.ru/b/blog/1.jpg\" alt=\"фото\">", true)]
    [InlineData("<img src=\"/uploads/blog/1.jpg\" alt=\"фото\">", true)]
    [InlineData("<img src=\"http://s3.twcstorage.ru/b/1.jpg\">", false)]
    [InlineData("<img src=\"https://evil.com/1.jpg\">", false)]
    [InlineData("<img src=\"data:image/png;base64,AAAA\">", false)]
    [InlineData("<img src=\"x\" onerror=\"alert(1)\">", false)]
    public void FiltersImagesBySource(string input, bool kept) =>
        Assert.Equal(kept, _sut.Sanitize(input).Contains("<img"));

    [Fact]
    public void ExternalLinksGetNofollow()
    {
        var result = _sut.Sanitize("<a href=\"https://example.com\">x</a>");
        Assert.Contains("rel=\"noopener nofollow\"", result);
        Assert.Contains("target=\"_blank\"", result);
    }

    [Fact]
    public void InternalLinksStayPlain()
    {
        var result = _sut.Sanitize("<a href=\"https://angelamoiseenko.ru/gallery\">x</a><a href=\"/contacts\">y</a>");
        Assert.DoesNotContain("nofollow", result);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("   ")]
    public void EmptyInputGivesEmpty(string? input) => Assert.Equal(string.Empty, _sut.Sanitize(input));
}
