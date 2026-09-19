using MomSite.Core.Models;
using MomSite.Infrastructure.Notifications;
using Xunit;

namespace MomSite.Tests;

public class LeadSourceTests
{
    private static ContactMessage Lead() => new()
    {
        Name = "Анна",
        Email = "anna@example.com",
        Subject = "Хочу купить картину",
        Message = "Здравствуйте!",
    };

    [Fact]
    public void Names_the_campaign_that_brought_the_lead()
    {
        var lead = Lead();
        lead.UtmSource = "vk";
        lead.UtmMedium = "cpc";
        lead.UtmCampaign = "autumn";

        Assert.Equal("vk / cpc / autumn", LeadSource.Describe(lead));
    }

    [Fact]
    public void Skips_the_parts_of_the_campaign_that_are_missing()
    {
        var lead = Lead();
        lead.UtmSource = "instagram";

        Assert.Equal("instagram", LeadSource.Describe(lead));
    }

    [Fact]
    public void Reports_a_direct_visit_when_no_campaign_is_known()
    {
        Assert.Equal("прямой заход", LeadSource.Describe(Lead()));
    }
}
