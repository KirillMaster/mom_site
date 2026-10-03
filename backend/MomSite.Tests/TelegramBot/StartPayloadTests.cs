using MomSite.Infrastructure.TelegramBot;
using Xunit;

namespace MomSite.Tests.TelegramBot;

public class StartPayloadTests
{
    [Theory]
    [InlineData("art_42", PayloadKind.Artwork)]
    [InlineData("mk", PayloadKind.Masterclass)]
    [InlineData("interior", PayloadKind.Interior)]
    [InlineData("vk_spring-2026", PayloadKind.Campaign)]
    [InlineData(null, PayloadKind.None)]
    [InlineData("", PayloadKind.None)]
    [InlineData("art_", PayloadKind.Campaign)]
    [InlineData("art_0", PayloadKind.Campaign)]
    [InlineData("art_99999999999", PayloadKind.Campaign)]
    [InlineData("a b", PayloadKind.None)]
    [InlineData("<script>", PayloadKind.None)]
    public void Parse_ClassifiesPayload(string? raw, PayloadKind expected)
    {
        Assert.Equal(expected, StartPayloadParser.Parse(raw).Kind);
    }

    [Fact]
    public void Parse_ArtworkPayload_ExtractsId()
    {
        Assert.Equal(42, StartPayloadParser.Parse("art_42").ArtworkId);
    }

    [Fact]
    public void Parse_TooLongPayload_IsIgnored()
    {
        Assert.Equal(PayloadKind.None, StartPayloadParser.Parse(new string('a', 65)).Kind);
    }
}
