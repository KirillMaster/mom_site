using System.Text.RegularExpressions;

namespace MomSite.Infrastructure.TelegramBot;

/// <summary>Pure state machine of the funnel: (state, input, context) -> (state, replies, lead?). No I/O.</summary>
public static partial class FunnelDialog
{

    public static FunnelResult Handle(FunnelState? state, BotInput input, FunnelContext ctx)
    {
        switch (input)
        {
            case StartInput start:
                return Start(start.Payload, ctx);
            case CancelInput:
                return new FunnelResult(null, new[] { new Reply(FunnelTexts.Cancelled, Keyboard: Keyboard.Remove) });
        }

        if (state is null || state.Step == FunnelStep.Done)
        {
            return input is TextInput t && !string.IsNullOrWhiteSpace(t.Text)
                ? FreeText(t.Text, ctx)
                : new FunnelResult(null, new[] { new Reply(FunnelTexts.NoDialog) });
        }

        if (IsBack(input) && state.History.Count > 0)
        {
            var prev = state.History[^1];
            var back = state with { Step = prev, History = state.History.Take(state.History.Count - 1).ToList() };
            return Show(back, ctx);
        }

        return input switch
        {
            UnsupportedInput => Hint(state, ctx, FunnelTexts.UnsupportedInput),
            _ => Step(state, input, ctx),
        };
    }

    private static FunnelResult Start(string? raw, FunnelContext ctx)
    {
        var payload = StartPayloadParser.Parse(raw);
        var s = new FunnelState(FunnelStep.Goal, Array.Empty<FunnelStep>(),
            Payload: payload.Kind == PayloadKind.None ? null : payload);

        if (payload.Kind == PayloadKind.Artwork && ctx.Artwork is { } art)
        {
            var contact = s with { Step = FunnelStep.Contact, Goal = FunnelGoal.Buy, Artwork = art };
            var intro = new Reply($"«{art.Title}» — прекрасный выбор! Оставьте контакт, и Анжела расскажет о цене и деталях.", art.ThumbnailPath);
            return new FunnelResult(contact, new[] { intro, FunnelKeyboards.Prompt(contact, ctx) });
        }

        FunnelGoal? goal = payload.Kind switch
        {
            PayloadKind.Masterclass => FunnelGoal.Masterclass,
            PayloadKind.Interior => FunnelGoal.Interior,
            _ => null,
        };
        return goal is { } g ? Show(s with { Step = FunnelStep.Detail, Goal = g }, ctx) : Show(s, ctx);
    }

    private static FunnelResult FreeText(string text, FunnelContext ctx)
    {
        if (ctx.QuotaExceeded)
        {
            return new FunnelResult(null, new[] { new Reply(FunnelTexts.QuotaExceeded) });
        }

        var lead = FunnelLeadBuilder.FromFreeText(Cut(text, MaxFreeText), ctx.User);
        return new FunnelResult(null, ThanksReplies(), lead);
    }

    private static FunnelResult Step(FunnelState s, BotInput input, FunnelContext ctx) => s.Step switch
    {
        FunnelStep.Goal => OnGoal(s, input, ctx),
        FunnelStep.Detail => OnChoice(s, input, ctx, "d:", FunnelTexts.Detail(s.Goal), (st, v) => st with { Detail = v }),
        FunnelStep.Theme => OnTheme(s, input, ctx),
        FunnelStep.Budget => OnChoice(s, input, ctx, "b:", FunnelTexts.Budgets, (st, v) => st with { Budget = v }),
        FunnelStep.Contact => OnContact(s, input, ctx),
        FunnelStep.Name => OnName(s, input, ctx),
        _ => Hint(s, ctx, FunnelTexts.UseButtons),
    };

    private static FunnelResult Advance(FunnelState s, FunnelContext ctx)
    {
        var history = s.History.Append(s.Step).ToList();
        return Show(s with { Step = Next(s), History = history }, ctx);
    }

    private static FunnelStep Next(FunnelState s) => s.Step switch
    {
        FunnelStep.Goal => s.Goal switch
        {
            FunnelGoal.Buy => FunnelStep.Budget,
            FunnelGoal.Other => FunnelStep.Theme,
            _ => FunnelStep.Detail,
        },
        FunnelStep.Detail => s.Goal == FunnelGoal.Masterclass ? FunnelStep.Contact : FunnelStep.Theme,
        FunnelStep.Theme => FunnelStep.Budget,
        FunnelStep.Budget => FunnelStep.Contact,
        _ => FunnelStep.Name,
    };

    private static FunnelResult Finish(FunnelState s, FunnelContext ctx)
    {
        if (ctx.QuotaExceeded)
        {
            return new FunnelResult(null, new[] { new Reply(FunnelTexts.QuotaExceeded) });
        }

        if (string.IsNullOrWhiteSpace(s.Phone) && string.IsNullOrWhiteSpace(ctx.User.Username))
        {
            return Reprompt(s with { Step = FunnelStep.Contact }, FunnelTexts.AskPhoneOnly);
        }

        return new FunnelResult(null, ThanksReplies(), FunnelLeadBuilder.Build(s, ctx.User));
    }

    private static Reply[] ThanksReplies() => new[]
    {
        new Reply(FunnelTexts.Thanks, Keyboard: Keyboard.Remove),
        new Reply(FunnelTexts.GalleryLine),
    };

    private static FunnelResult Show(FunnelState s, FunnelContext ctx) =>
        new(s, new[] { FunnelKeyboards.Prompt(s, ctx) });

    private static FunnelResult Hint(FunnelState s, FunnelContext ctx, string hint) =>
        new(s, new[] { new Reply(hint), FunnelKeyboards.Prompt(s, ctx) });

    private static FunnelResult Reprompt(FunnelState s, string ask) =>
        new(s, new[] { FunnelKeyboards.ContactPrompt(ask, s.History.Count > 0) });

    private static bool IsBack(BotInput input) =>
        input is CallbackInput { Data: FunnelKeyboards.BackData } or TextInput { Text: FunnelTexts.BackText };

    private static string Cut(string value, int max) => value.Length <= max ? value : value[..max];
}
