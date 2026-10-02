using MomSite.Core.Interfaces;

namespace MomSite.Infrastructure.Blog;

/// <summary>Проверки полей статьи; сообщения — для автора, по-русски и без терминов.</summary>
internal static class BlogPostValidator
{
    public static Dictionary<string, string> Validate(BlogPostInput input, string sanitizedBody)
    {
        var errors = new Dictionary<string, string>();
        if (string.IsNullOrWhiteSpace(input.Title)) errors["title"] = "Напишите заголовок.";
        else if (input.Title.Trim().Length > 200) errors["title"] = "Заголовок длиннее 200 символов — сократите.";
        if (!BlogSlug.IsValid(input.Slug)) errors["slug"] = "Адрес: только латинские буквы, цифры и дефис.";
        if (string.IsNullOrWhiteSpace(sanitizedBody)) errors["bodyHtml"] = "Напишите текст статьи.";
        Max(errors, "excerpt", input.Excerpt, 300, "Анонс");
        Max(errors, "coverAlt", input.CoverAlt, 200, "Подпись к фото");
        Max(errors, "coverImagePath", input.CoverImagePath, 500, "Адрес обложки");
        Max(errors, "seoTitle", input.SeoTitle, 70, "Заголовок для поиска");
        Max(errors, "seoDescription", input.SeoDescription, 200, "Описание для поиска");
        return errors;
    }

    private static void Max(Dictionary<string, string> errors, string key, string? value, int max, string label)
    {
        if (value != null && value.Trim().Length > max) errors[key] = $"{label} длиннее {max} символов — сократите.";
    }
}
