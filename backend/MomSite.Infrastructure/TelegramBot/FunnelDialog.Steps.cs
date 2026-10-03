using System.Text.RegularExpressions;

namespace MomSite.Infrastructure.TelegramBot;

public static partial class FunnelDialog
{
    private static readonly Regex PhoneLike = new(@"^\+?[0-9][0-9 ()\-]{8,20}$", RegexOptions.Compiled);
    private const int MaxFreeText = 1000;

    private static FunnelResult OnGoal(FunnelState s, BotInput input, FunnelContext ctx)
    {
        if (input is CallbackInput { Data: var d } && d.StartsWith("g:"))
        {
            var i = FunnelTexts.Goals.ToList().FindIndex(g => "g:" + g.Code == d);
            if (i >= 0)
            {
                return Advance(s with { Goal = (FunnelGoal)i }, ctx);
            }
        }

        return Hint(s, ctx, FunnelTexts.UseButtons);
    }

    private static FunnelResult OnChoice(
        FunnelState s, BotInput input, FunnelContext ctx, string prefix,
        IReadOnlyList<string> options, Func<FunnelState, string, FunnelState> set)
    {
        if (input is CallbackInput { Data: var d } && d.StartsWith(prefix)
            && int.TryParse(d[prefix.Length..], out var i) && i >= 0 && i < options.Count)
        {
            return Advance(set(s, options[i]), ctx);
        }

        return Hint(s, ctx, FunnelTexts.UseButtons);
    }

    private static FunnelResult OnTheme(FunnelState s, BotInput input, FunnelContext ctx)
    {
        if (input is TextInput { Text: var t } && !string.IsNullOrWhiteSpace(t))
        {
            return Advance(s with { Theme = Cut(t, MaxFreeText) }, ctx);
        }

        if (input is CallbackInput { Data: FunnelKeyboards.SkipData } && s.Goal != FunnelGoal.Other)
        {
            return Advance(s, ctx);
        }

        return Hint(s, ctx, s.Goal == FunnelGoal.Other ? FunnelTexts.AskFreeText : FunnelTexts.UseButtons);
    }

    private static FunnelResult OnContact(FunnelState s, BotInput input, FunnelContext ctx)
    {
        switch (input)
        {
            case ContactInput c when !string.IsNullOrWhiteSpace(c.Phone):
                return Advance(s with { Phone = c.Phone.Trim() }, ctx);
            case TextInput { Text: FunnelTexts.UseTelegram } when !string.IsNullOrWhiteSpace(ctx.User.Username):
                return Advance(s, ctx);
            case TextInput { Text: FunnelTexts.UseTelegram }:
                return Reprompt(s, FunnelTexts.AskPhoneOnly);
            case TextInput t when PhoneLike.IsMatch(t.Text.Trim()):
                return Advance(s with { Phone = t.Text.Trim() }, ctx);
            default:
                return Reprompt(s, FunnelTexts.AskContact);
        }
    }

    private static FunnelResult OnName(FunnelState s, BotInput input, FunnelContext ctx)
    {
        string? name = input switch
        {
            CallbackInput { Data: FunnelKeyboards.NameOkData } => ctx.User.FirstName,
            TextInput t when !string.IsNullOrWhiteSpace(t.Text) => Cut(t.Text.Trim(), 200),
            _ => null,
        };
        return string.IsNullOrWhiteSpace(name) ? Hint(s, ctx, FunnelTexts.AskName) : Finish(s with { Name = name }, ctx);
    }
}
