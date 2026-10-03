namespace MomSite.Infrastructure.TelegramBot;

/// <summary>All user-facing copy in one place. Draft wording, to be agreed with the owner.</summary>
public static class FunnelTexts
{
    public const string SiteUrl = "https://angelamoiseenko.ru";
    public const string PrivacyUrl = SiteUrl + "/privacy";

    public const string Welcome = "Здравствуйте! Я помогу связаться с художницей Анжелой Моисеенко. Что вас интересует?";
    public const string Thanks = "Спасибо! Анжела ответит вам лично в течение дня.";
    public const string Cancelled = "Диалог сброшен. Чтобы начать заново, отправьте /start.";
    public const string QuotaExceeded = "Вы уже отправили несколько заявок сегодня. Анжела ответит вам в ближайшее время, а новые заявки можно оставить завтра.";
    public const string UseButtons = "Пожалуйста, нажмите одну из кнопок под сообщением.";
    public const string UnsupportedInput = "Я понимаю только текст и кнопки. Нажмите кнопку или напишите ответ словами.";
    public const string NoDialog = "Чтобы оставить заявку, отправьте /start.";
    public const string SaveFailed = "Не удалось отправить заявку, попробуйте чуть позже.";
    public const string ConsentLine = "Нажимая кнопку, вы соглашаетесь на обработку персональных данных: " + PrivacyUrl;
    public const string AskThemeText = "Расскажите коротко: какая тема или стиль вам нравятся? Можно пропустить.";
    public const string AskFreeText = "Напишите ваш вопрос одним сообщением.";
    public const string AskBudget = "Какой бюджет вы рассматриваете?";
    public const string AskDetailSize = "Какой размер картины вам нужен?";
    public const string AskDetailFormat = "Какой формат мастер-класса вас интересует?";
    public const string AskContact = "Как с вами связаться? Поделитесь номером телефона или выберите Telegram.";
    public const string AskPhoneOnly = "У вас не указан @username в Telegram, поэтому поделитесь номером телефона, пожалуйста.";
    public const string AskName = "Как к вам обращаться?";
    public const string GalleryLine = "Пока ждёте ответ, посмотрите работы: " + SiteUrl + "/gallery и отзывы: " + SiteUrl + "/reviews";

    public const string ShareContact = "📱 Поделиться номером";
    public const string UseTelegram = "Пишите мне в Telegram";
    public const string BackText = "◀ Назад";
    public const string Skip = "Пропустить";
    public const string ConfirmName = "Да, это я";

    public static readonly IReadOnlyList<(string Code, string Label)> Goals = new[]
    {
        ("buy", "Купить картину"),
        ("int", "Картина для интерьера"),
        ("com", "Заказать картину"),
        ("mk", "Мастер-класс"),
        ("oth", "Другой вопрос"),
    };

    public static readonly IReadOnlyList<string> Sizes = new[] { "до 50 см", "50–100 см", "больше 100 см", "не знаю" };

    public static readonly IReadOnlyList<string> Formats =
        new[] { "для себя", "вдвоём", "группа или корпоратив", "подарочный сертификат" };

    public static readonly IReadOnlyList<string> Budgets =
        new[] { "до 30 тыс. ₽", "30–70 тыс. ₽", "70–150 тыс. ₽", "больше 150 тыс. ₽", "пока не знаю" };

    public static IReadOnlyList<string> Detail(FunnelGoal? goal) => goal == FunnelGoal.Masterclass ? Formats : Sizes;

    public static string GoalLabel(FunnelGoal goal) => Goals[(int)goal].Label;
}
