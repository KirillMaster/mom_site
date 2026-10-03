namespace MomSite.Infrastructure.TelegramBot;

/// <summary>Builds the prompt (text + keyboard) of each funnel step. callback_data are short codes.</summary>
public static class FunnelKeyboards
{
    public const string BackData = "back";
    public const string SkipData = "skip";
    public const string NameOkData = "nok";

    private static Button Back => new(FunnelTexts.BackText, BackData);

    private static Keyboard Inline(IEnumerable<Button> buttons, bool withBack, bool oneRow = false)
    {
        var rows = oneRow
            ? new List<IReadOnlyList<Button>> { buttons.ToList() }
            : buttons.Select(b => (IReadOnlyList<Button>)new[] { b }).ToList();
        if (withBack)
        {
            rows.Add(new[] { Back });
        }

        return new Keyboard(KeyboardKind.Inline, rows);
    }

    public static Reply Prompt(FunnelState s, FunnelContext ctx)
    {
        var back = s.History.Count > 0;
        return s.Step switch
        {
            FunnelStep.Goal => new Reply(FunnelTexts.Welcome,
                Keyboard: Inline(FunnelTexts.Goals.Select(g => new Button(g.Label, "g:" + g.Code)), false)),
            FunnelStep.Detail when s.Goal == FunnelGoal.Masterclass => new Reply(FunnelTexts.AskDetailFormat,
                Keyboard: Inline(Indexed("d", FunnelTexts.Formats), back)),
            FunnelStep.Detail => new Reply(FunnelTexts.AskDetailSize,
                Keyboard: Inline(Indexed("d", FunnelTexts.Sizes), back)),
            FunnelStep.Theme when s.Goal == FunnelGoal.Other => new Reply(FunnelTexts.AskFreeText,
                Keyboard: back ? Inline(Array.Empty<Button>(), true) : null),
            FunnelStep.Theme => new Reply(FunnelTexts.AskThemeText,
                Keyboard: Inline(new[] { new Button(FunnelTexts.Skip, SkipData) }, back, oneRow: true)),
            FunnelStep.Budget => new Reply(FunnelTexts.AskBudget, Keyboard: Inline(Indexed("b", FunnelTexts.Budgets), back)),
            FunnelStep.Contact => ContactPrompt(FunnelTexts.AskContact, back),
            FunnelStep.Name => new Reply(FunnelTexts.AskName, Keyboard: NameKeyboard(ctx.User.FirstName, back)),
            _ => new Reply(FunnelTexts.NoDialog),
        };
    }

    public static Reply ContactPrompt(string ask, bool back)
    {
        var rows = new List<IReadOnlyList<Button>>
        {
            new[] { new Button(FunnelTexts.ShareContact, RequestContact: true) },
            new[] { new Button(FunnelTexts.UseTelegram) },
        };
        if (back)
        {
            rows.Add(new[] { new Button(FunnelTexts.BackText) });
        }

        return new Reply(ask + "\n\n" + FunnelTexts.ConsentLine, Keyboard: new Keyboard(KeyboardKind.Reply, rows));
    }

    private static Keyboard? NameKeyboard(string? firstName, bool back)
    {
        var buttons = new List<Button>();
        if (!string.IsNullOrWhiteSpace(firstName))
        {
            buttons.Add(new Button($"{FunnelTexts.ConfirmName} ({firstName})", NameOkData));
        }

        return buttons.Count == 0 && !back ? null : Inline(buttons, back);
    }

    private static IEnumerable<Button> Indexed(string prefix, IReadOnlyList<string> labels) =>
        labels.Select((l, i) => new Button(l, $"{prefix}:{i}"));
}
