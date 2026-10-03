using MomSite.Infrastructure.TelegramBot;
using Xunit;

namespace MomSite.Tests.TelegramBot;

public class FunnelDialogTests
{
    internal static readonly BotUser User = new() { Id = 10, Username = "anna", FirstName = "Anna" };
    internal static readonly BotUser NoName = new() { Id = 11, FirstName = "Bob" };

    internal static FunnelResult Run(FunnelState? s, BotInput i, BotUser? user = null, bool quota = false,
        ArtworkInfo? art = null) =>
        FunnelDialog.Handle(s, i, new FunnelContext(user ?? User, art, quota));

    internal static FunnelResult Steps(BotUser user, params BotInput[] inputs)
    {
        FunnelResult r = Run(null, new StartInput(null), user);
        foreach (var i in inputs)
        {
            r = Run(r.State, i, user);
        }

        return r;
    }

    internal static CallbackInput Cb(string d) => new(d);

    [Fact]
    public void Start_AsksGoal()
    {
        var r = Run(null, new StartInput(null));
        Assert.Equal(FunnelStep.Goal, r.State!.Step);
        Assert.NotEmpty(r.Replies);
        Assert.Null(r.Lead);
    }

    [Fact]
    public void BuyFlow_ProducesLeadWithPhoneAndBudget()
    {
        var r = Steps(User, Cb("g:buy"), Cb("b:1"), new ContactInput("+79991112233"), Cb("nok"));
        Assert.Null(r.State);
        Assert.NotNull(r.Lead);
        Assert.Equal("+79991112233", r.Lead!.Phone);
        Assert.Contains("30–70", r.Lead.Message);
        Assert.Equal("anna", r.Lead.TelegramUsername);
        Assert.Equal(10, r.Lead.TelegramUserId);
        Assert.Null(r.Lead.Email);
        Assert.Equal("telegram_bot", r.Lead.UtmSource);
    }

    [Fact]
    public void InteriorFlow_GoesThroughSizeThemeBudget()
    {
        var r = Steps(User, Cb("g:int"), Cb("d:0"), new TextInput("море"), Cb("b:0"));
        Assert.Equal(FunnelStep.Contact, r.State!.Step);
        Assert.Equal("море", r.State.Theme);
        Assert.Equal("до 50 см", r.State.Detail);
    }

    [Fact]
    public void ThemeCanBeSkipped_ForNonOtherGoals()
    {
        var r = Steps(User, Cb("g:com"), Cb("d:1"), Cb("skip"));
        Assert.Equal(FunnelStep.Budget, r.State!.Step);
        Assert.Null(r.State.Theme);
    }

    [Fact]
    public void Masterclass_SkipsBudget()
    {
        var r = Steps(User, Cb("g:mk"), Cb("d:2"));
        Assert.Equal(FunnelStep.Contact, r.State!.Step);
    }

    [Fact]
    public void OtherGoal_RequiresFreeText()
    {
        var r = Steps(User, Cb("g:oth"), Cb("skip"));
        Assert.Equal(FunnelStep.Theme, r.State!.Step);
        r = Run(r.State, new TextInput("Сколько стоит доставка?"));
        Assert.Equal(FunnelStep.Budget, r.State!.Step);
        Assert.Equal("Сколько стоит доставка?", r.State.Theme);
    }

    [Fact]
    public void TextInstead_OfButton_RepeatsQuestion()
    {
        var r = Steps(User, new TextInput("привет"));
        Assert.Equal(FunnelStep.Goal, r.State!.Step);
        Assert.True(r.Replies.Count >= 2);
    }

    [Fact]
    public void UnsupportedInput_GivesHintAndKeepsStep()
    {
        var r = Steps(User, Cb("g:buy"), new UnsupportedInput());
        Assert.Equal(FunnelStep.Budget, r.State!.Step);
        Assert.Contains(r.Replies, x => x.Text == FunnelTexts.UnsupportedInput);
    }

    [Fact]
    public void Back_ReturnsToPreviousStep()
    {
        var r = Steps(User, Cb("g:buy"), Cb("b:1"), Cb("back"));
        Assert.Equal(FunnelStep.Budget, r.State!.Step);
        r = Run(r.State, Cb("back"));
        Assert.Equal(FunnelStep.Goal, r.State!.Step);
    }

    [Fact]
    public void Cancel_ResetsState()
    {
        var r = Steps(User, Cb("g:buy"), new CancelInput());
        Assert.Null(r.State);
        Assert.Null(r.Lead);
    }

    [Fact]
    public void Contact_PhoneTextIsAccepted()
    {
        var r = Steps(User, Cb("g:buy"), Cb("b:0"), new TextInput("+7 (999) 111-22-33"));
        Assert.Equal(FunnelStep.Name, r.State!.Step);
        Assert.Equal("+7 (999) 111-22-33", r.State.Phone);
    }

    [Fact]
    public void Contact_Garbage_AsksAgain()
    {
        var r = Steps(User, Cb("g:buy"), Cb("b:0"), new TextInput("абв"));
        Assert.Equal(FunnelStep.Contact, r.State!.Step);
    }

    [Fact]
    public void Contact_UseTelegram_WithoutUsername_AsksPhone()
    {
        var r = Steps(NoName, Cb("g:buy"), Cb("b:0"), new TextInput(FunnelTexts.UseTelegram));
        Assert.Equal(FunnelStep.Contact, r.State!.Step);
        Assert.Contains(r.Replies, x => x.Text.StartsWith(FunnelTexts.AskPhoneOnly));
    }

    [Fact]
    public void Contact_UseTelegram_WithUsername_Advances()
    {
        var r = Steps(User, Cb("g:buy"), Cb("b:0"), new TextInput(FunnelTexts.UseTelegram));
        Assert.Equal(FunnelStep.Name, r.State!.Step);
    }

    [Fact]
    public void Name_TypedText_IsUsed()
    {
        var r = Steps(User, Cb("g:buy"), Cb("b:0"), new ContactInput("+79990000000"), new TextInput("Мария"));
        Assert.Equal("Мария", r.Lead!.Name);
    }

    [Fact]
    public void FreeText_WithoutDialog_BecomesLead()
    {
        var r = Run(null, new TextInput("Здравствуйте, хочу узнать про заказ"));
        Assert.NotNull(r.Lead);
        Assert.Contains("хочу узнать", r.Lead!.Message);
    }

    [Fact]
    public void FreeText_OverQuota_NoLead()
    {
        var r = Run(null, new TextInput("ещё одна"), quota: true);
        Assert.Null(r.Lead);
        Assert.Contains(r.Replies, x => x.Text == FunnelTexts.QuotaExceeded);
    }

    [Fact]
    public void Finish_OverQuota_NoLead()
    {
        var s = Steps(User, Cb("g:buy"), Cb("b:0"), new ContactInput("+79990000000")).State;
        var r = Run(s, Cb("nok"), quota: true);
        Assert.Null(r.Lead);
        Assert.Null(r.State);
    }

    [Fact]
    public void LongFreeText_IsTruncated()
    {
        var r = Run(null, new TextInput(new string('я', 5000)));
        Assert.True(r.Lead!.Message.Length <= 5000);
    }

    [Fact]
    public void ConsentLine_IsShownAtContactStep()
    {
        var r = Steps(User, Cb("g:buy"), Cb("b:0"));
        Assert.Contains(r.Replies, x => x.Text.Contains("/privacy"));
    }
}
