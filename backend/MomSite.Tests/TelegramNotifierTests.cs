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

public class TelegramLeadContactTests
{
    private static ContactMessage BotLead() => new()
    {
        Name = "Ольга",
        Email = null,
        Phone = "+79001234567",
        TelegramUsername = "olga_art",
        TelegramUserId = 42,
        Subject = "Telegram-бот: Купить картину",
        Message = "Бюджет: 30–70 тыс.",
        UtmSource = "telegram_bot",
        UtmCampaign = "promo_vk",
    };

    [Fact]
    public void BuildText_for_bot_lead_shows_phone_username_and_source()
    {
        var text = TelegramNotifier.BuildText(BotLead());

        Assert.Contains("Новая заявка из Telegram-бота", text);
        Assert.Contains("Телефон: +79001234567", text);
        Assert.Contains("Telegram: @olga_art", text);
        Assert.Contains("telegram_bot / promo_vk", text);
        Assert.DoesNotContain("Email:", text);
    }

    [Fact]
    public void TelegramContact_falls_back_to_user_link_without_username()
    {
        var m = BotLead();
        m.TelegramUsername = null;

        Assert.Equal("tg://user?id=42", LeadSource.TelegramContact(m));
    }

    [Fact]
    public void TelegramContact_is_null_without_username_and_id()
    {
        var m = BotLead();
        m.TelegramUsername = null;
        m.TelegramUserId = null;

        Assert.Null(LeadSource.TelegramContact(m));
    }

    [Fact]
    public void Email_bodies_include_telegram_contact_and_survive_missing_email()
    {
        var (html, text) = EmailNotifier.BuildBodies(BotLead());

        Assert.Contains("@olga_art", html);
        Assert.Contains("Telegram: @olga_art", text);
        Assert.Contains("Email: —", text);
    }

    [Fact]
    public void Site_form_lead_keeps_the_original_text_layout()
    {
        var text = TelegramNotifier.BuildText(new ContactMessage
        {
            Name = "Анна", Email = "a@b.ru", Subject = "s", Message = "m",
        });

        Assert.StartsWith("Новое сообщение с сайта", text);
        Assert.DoesNotContain("Telegram:", text);
    }
}
