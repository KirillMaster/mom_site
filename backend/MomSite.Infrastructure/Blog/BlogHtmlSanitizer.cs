using AngleSharp.Html.Dom;
using Ganss.Xss;

namespace MomSite.Infrastructure.Blog;

/// <summary>
/// Очищает HTML статьи по белому списку: остаётся только то, что умеет простой редактор
/// (абзацы, подзаголовки, жирный, курсив, списки, ссылки, картинки).
/// </summary>
public class BlogHtmlSanitizer
{
    private static readonly string[] Tags =
        { "p", "br", "h2", "h3", "strong", "b", "em", "i", "ul", "ol", "li", "blockquote", "a", "img" };

    // Эти теги удаляются вместе с содержимым; остальные лишние (span, div, font из Word) — разворачиваются.
    private static readonly HashSet<string> DropWithContent = new(StringComparer.OrdinalIgnoreCase)
        { "script", "style", "iframe", "object", "embed", "noscript", "template", "svg", "math", "form", "select", "textarea" };

    private readonly HtmlSanitizer _sanitizer;
    private readonly HashSet<string> _imageHosts;
    private readonly string _siteHost;

    public BlogHtmlSanitizer(IEnumerable<string> allowedImageHosts, string siteHost)
    {
        _imageHosts = new HashSet<string>(allowedImageHosts.Where(h => !string.IsNullOrWhiteSpace(h)),
            StringComparer.OrdinalIgnoreCase);
        _siteHost = siteHost;

        _sanitizer = new HtmlSanitizer { KeepChildNodes = true };
        _sanitizer.AllowedTags.Clear();
        foreach (var tag in Tags) _sanitizer.AllowedTags.Add(tag);
        _sanitizer.AllowedAttributes.Clear();
        foreach (var attr in new[] { "href", "src", "alt", "title" }) _sanitizer.AllowedAttributes.Add(attr);
        _sanitizer.AllowedCssProperties.Clear();
        _sanitizer.AllowedAtRules.Clear();
        _sanitizer.AllowedClasses.Clear();
        _sanitizer.AllowedSchemes.Clear();
        foreach (var scheme in new[] { "https", "http", "mailto", "tel" }) _sanitizer.AllowedSchemes.Add(scheme);
        _sanitizer.UriAttributes.Add("src");
        _sanitizer.RemovingTag += (_, e) =>
        {
            if (DropWithContent.Contains(e.Tag.LocalName)) e.Tag.InnerHtml = string.Empty;
        };
        _sanitizer.PostProcessNode += (_, e) => PostProcess(e.Node);
    }

    public string Sanitize(string? html) =>
        string.IsNullOrWhiteSpace(html) ? string.Empty : _sanitizer.Sanitize(html).Trim();

    private void PostProcess(AngleSharp.Dom.INode node)
    {
        switch (node)
        {
            case IHtmlImageElement img when !IsAllowedImage(img.GetAttribute("src")):
                img.Remove();
                break;
            case IHtmlAnchorElement a when IsExternal(a.GetAttribute("href")):
                a.SetAttribute("rel", "noopener nofollow");
                a.SetAttribute("target", "_blank");
                break;
        }
    }

    private bool IsAllowedImage(string? src)
    {
        if (string.IsNullOrEmpty(src)) return false;
        if (src.StartsWith("/uploads/", StringComparison.Ordinal)) return true;
        if (!Uri.TryCreate(src, UriKind.Absolute, out var uri) || uri.Scheme != Uri.UriSchemeHttps) return false;
        return _imageHosts.Count == 0 || _imageHosts.Contains(uri.Host);
    }

    private bool IsExternal(string? href) =>
        Uri.TryCreate(href, UriKind.Absolute, out var uri)
        && (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps)
        && !uri.Host.EndsWith(_siteHost, StringComparison.OrdinalIgnoreCase);
}
