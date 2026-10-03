using MomSite.Infrastructure.TelegramBot;
using Xunit;
using static MomSite.Tests.TelegramBot.FunnelDialogTests;

namespace MomSite.Tests.TelegramBot;

public class FunnelDialogPayloadTests
{
    private static readonly ArtworkInfo Art = new(42, "Закат", "https://angelamoiseenko.ru/t/42.jpg");

    [Fact]
    public void ArtPayload_WithKnownArtwork_StartsAtContactWithPhoto()
    {
        var r = Run(null, new StartInput("art_42"), art: Art);
        Assert.Equal(FunnelStep.Contact, r.State!.Step);
        Assert.Equal(FunnelGoal.Buy, r.State.Goal);
        Assert.Contains(r.Replies, x => x.PhotoUrl == Art.ThumbnailPath);
    }

    [Fact]
    public void ArtPayload_LeadContainsArtworkLinkAndCampaign()
    {
        var r = Run(null, new StartInput("art_42"), art: Art);
        r = Run(r.State, new ContactInput("+79990000000"));
        r = Run(r.State, Cb("nok"));
        Assert.Contains("/gallery/artwork-42", r.Lead!.Message);
        Assert.Contains("Закат", r.Lead.Message);
        Assert.Equal("art_42", r.Lead.UtmCampaign);
    }

    [Fact]
    public void ArtPayload_UnknownArtwork_FallsBackToGoalStep()
    {
        var r = Run(null, new StartInput("art_999"), art: null);
        Assert.Equal(FunnelStep.Goal, r.State!.Step);
    }

    [Fact]
    public void MkPayload_JumpsToMasterclassFormats()
    {
        var r = Run(null, new StartInput("mk"));
        Assert.Equal(FunnelStep.Detail, r.State!.Step);
        Assert.Equal(FunnelGoal.Masterclass, r.State.Goal);
    }

    [Fact]
    public void InteriorPayload_JumpsToSizeStep()
    {
        var r = Run(null, new StartInput("interior"));
        Assert.Equal(FunnelStep.Detail, r.State!.Step);
        Assert.Equal(FunnelGoal.Interior, r.State.Goal);
    }

    [Fact]
    public void CampaignPayload_AsksGoal_AndIsStoredAsCampaign()
    {
        var r = Run(null, new StartInput("vk_spring"));
        Assert.Equal(FunnelStep.Goal, r.State!.Step);
        r = Run(r.State, Cb("g:buy"));
        r = Run(r.State, Cb("b:0"));
        r = Run(r.State, new ContactInput("+79990000000"));
        r = Run(r.State, Cb("nok"));
        Assert.Equal("vk_spring", r.Lead!.UtmCampaign);
    }

    [Fact]
    public void InvalidPayload_IsIgnored()
    {
        var r = Run(null, new StartInput("<script>alert(1)</script>"));
        Assert.Equal(FunnelStep.Goal, r.State!.Step);
        Assert.Null(r.State.Payload);
    }

    [Fact]
    public void StartInMiddleOfDialog_Restarts()
    {
        var r = Steps(User, Cb("g:buy"), Cb("b:0"));
        r = Run(r.State, new StartInput(null));
        Assert.Equal(FunnelStep.Goal, r.State!.Step);
    }
}
