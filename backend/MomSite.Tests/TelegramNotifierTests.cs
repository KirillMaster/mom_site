using MomSite.Core.Models;
using MomSite.Infrastructure.Notifications;
using Xunit;

namespace MomSite.Tests;

public class TelegramNotifierTests
{
    private static ContactMessage Lead() => new()
    {
        Name = "Анна",
        Email = "anna@example.com",
        Subject = "Хочу купить картину",
        Message = "Здравствуйте! Интересует «Осенний сад».",
    };

    [Fact]
    public void BuildText_names_the_campaign_that_brought_the_lead()
    {
        var message = Lead();
        message.UtmSource = "yandex";
        message.UtmMedium = "cpc";
        message.UtmCampaign = "autumn-sale";

        var text = TelegramNotifier.BuildText(message);

        Assert.Contains("Источник: yandex / cpc / autumn-sale", text);
    }

    [Fact]
    public void BuildText_reports_a_direct_visit_when_no_campaign_is_known()
    {
        var text = TelegramNotifier.BuildText(Lead());

        Assert.Contains("Источник: прямой заход", text);
    }

    [Fact]
    public void BuildText_skips_the_parts_of_the_campaign_that_are_missing()
    {
        var message = Lead();
        message.UtmSource = "vk";

        var text = TelegramNotifier.BuildText(message);

        Assert.Contains("Источник: vk", text);
        Assert.DoesNotContain(" / ", text);
    }

    [Fact]
    public void BuildText_carries_the_visitor_own_words()
    {
        var text = TelegramNotifier.BuildText(Lead());

        Assert.Contains("Анна", text);
        Assert.Contains("anna@example.com", text);
        Assert.Contains("Хочу купить картину", text);
        Assert.Contains("Здравствуйте! Интересует «Осенний сад».", text);
    }
}
