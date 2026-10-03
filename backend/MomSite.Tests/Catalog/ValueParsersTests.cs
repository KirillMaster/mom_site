using MomSite.Core.Models;
using MomSite.Infrastructure.Catalog;
using Xunit;

namespace MomSite.Tests.Catalog;

public class ValueParsersTests
{
    private static readonly DateTime Now = new(2026, 10, 3);

    [Theory]
    [InlineData("12 500", 12500)]
    [InlineData("12500 ₽", 12500)]
    [InlineData("12 500 руб.", 12500)]
    [InlineData("1500,50", 1500.5)]
    public void Price_parses(string raw, double exp)
    {
        var r = ValueParsers.ParsePrice(raw);
        Assert.Equal(ParseKind.Set, r.Kind);
        Assert.Equal((decimal)exp, r.Value);
    }

    [Theory]
    [InlineData(null, ParseKind.Keep)]
    [InlineData("  ", ParseKind.Keep)]
    [InlineData("-", ParseKind.Clear)]
    [InlineData("по запросу", ParseKind.Clear)]
    [InlineData("abc", ParseKind.Warn)]
    [InlineData("-5", ParseKind.Warn)]
    public void Price_kinds(string? raw, ParseKind kind) => Assert.Equal(kind, ValueParsers.ParsePrice(raw).Kind);

    [Theory]
    [InlineData("110.5", 110.5)]
    [InlineData("110,5", 110.5)]
    [InlineData("80.2021", 80.2)]
    [InlineData("60 см", 60)]
    public void Size_parses(string raw, double exp)
    {
        var r = ValueParsers.ParseSize(raw);
        Assert.Equal(ParseKind.Set, r.Kind);
        Assert.Equal((decimal)exp, r.Value);
    }

    [Theory]
    [InlineData("0", ParseKind.Warn)]
    [InlineData("1001", ParseKind.Warn)]
    [InlineData("x", ParseKind.Warn)]
    [InlineData("-", ParseKind.Clear)]
    [InlineData("", ParseKind.Keep)]
    public void Size_kinds(string raw, ParseKind kind) => Assert.Equal(kind, ValueParsers.ParseSize(raw).Kind);

    [Theory]
    [InlineData("2019", 2019)]
    [InlineData("2019.0", 2019)]
    [InlineData("2019 г.", 2019)]
    public void Year_parses(string raw, int exp) => Assert.Equal(exp, ValueParsers.ParseYear(raw, Now).Value);

    [Theory]
    [InlineData("1900", ParseKind.Warn)]
    [InlineData("2027", ParseKind.Warn)]
    [InlineData("около 2000", ParseKind.Warn)]
    [InlineData("-", ParseKind.Clear)]
    [InlineData(null, ParseKind.Keep)]
    public void Year_kinds(string? raw, ParseKind kind) => Assert.Equal(kind, ValueParsers.ParseYear(raw, Now).Kind);

    [Theory]
    [InlineData("В наличии", ArtworkStatus.Available)]
    [InlineData("  продана ", ArtworkStatus.Sold)]
    [InlineData("Частная коллекция", ArtworkStatus.PrivateCollection)]
    [InlineData("Не моя работа", ArtworkStatus.NotMine)]
    [InlineData("не продаётся", ArtworkStatus.NotForSale)]
    public void Status_parses(string raw, ArtworkStatus exp) => Assert.Equal(exp, ValueParsers.ParseStatus(raw).Value);

    [Fact]
    public void Status_unknown_and_dash_warn()
    {
        Assert.Equal(ParseKind.Warn, ValueParsers.ParseStatus("что-то").Kind);
        Assert.Equal(ParseKind.Warn, ValueParsers.ParseStatus("-").Kind);
        Assert.Equal(ParseKind.Keep, ValueParsers.ParseStatus("").Kind);
    }

    [Theory]
    [InlineData("да", true)]
    [InlineData("Нет", false)]
    [InlineData("1", true)]
    public void Flag_parses(string raw, bool exp) => Assert.Equal(exp, ValueParsers.ParseFlag(raw).Value);

    [Fact]
    public void Flag_other_text()
    {
        Assert.Equal(ParseKind.Warn, ValueParsers.ParseFlag("возможно").Kind);
        Assert.True(ValueParsers.ParseFlag("тёмное фото", true).Value);
        Assert.Equal(ParseKind.Keep, ValueParsers.ParseFlag(" ").Kind);
    }

    [Fact]
    public void Text_rules()
    {
        Assert.Equal(ParseKind.Keep, ValueParsers.ParseText("  ", 10, "X").Kind);
        Assert.Equal(ParseKind.Clear, ValueParsers.ParseText("-", 10, "X").Kind);
        Assert.Equal("abc", ValueParsers.ParseText(" abc ", 10, "X").Value);
        var w = ValueParsers.ParseText(new string('a', 11), 10, "X");
        Assert.Equal(ParseKind.Warn, w.Kind);
        Assert.Contains("X", w.Message);
        Assert.Equal(ParseKind.Set, ValueParsers.ParseText(new string('a', 10), 10, "X").Kind);
    }

    [Fact]
    public void Normalize_collapses_spaces() => Assert.Equal("a b", ValueParsers.Normalize(" a  b "));
}
