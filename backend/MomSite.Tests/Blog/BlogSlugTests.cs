using MomSite.Infrastructure.Blog;

namespace MomSite.Tests.Blog;

public class BlogSlugTests
{
    [Theory]
    [InlineData("vystavka-v-sevastopole", true)]
    [InlineData("2026", true)]
    [InlineData("", false)]
    [InlineData("Выставка", false)]
    [InlineData("a b", false)]
    [InlineData("-start", false)]
    [InlineData("end-", false)]
    [InlineData("a--b", false)]
    public void Validates(string slug, bool expected) => Assert.Equal(expected, BlogSlug.IsValid(slug));

    [Fact]
    public void RejectsTooLong() => Assert.False(BlogSlug.IsValid(new string('a', 121)));

    [Fact]
    public async Task FreeSlugIsKept() =>
        Assert.Equal("novost", await BlogSlug.MakeUniqueAsync("novost", _ => Task.FromResult(false)));

    [Fact]
    public async Task TakenSlugGetsNumberSuffix()
    {
        var taken = new HashSet<string> { "novost", "novost-2" };
        Assert.Equal("novost-3", await BlogSlug.MakeUniqueAsync("novost", s => Task.FromResult(taken.Contains(s))));
    }

    [Fact]
    public async Task SuffixFitsMaxLength()
    {
        var slug = new string('a', 120);
        var result = await BlogSlug.MakeUniqueAsync(slug, s => Task.FromResult(s == slug));
        Assert.Equal(120, result.Length);
        Assert.EndsWith("-2", result);
    }
}
