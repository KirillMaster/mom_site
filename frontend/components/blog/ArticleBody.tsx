interface ArticleBodyProps {
  html: string;
}

// The HTML is sanitized on the server when the post is saved (BlogHtmlSanitizer),
// so it is safe to render as is; images below the fold load lazily.
const lazyImages = (html: string) => html.replace(/<img(?![^>]*\sloading=)/g, '<img loading="lazy"');

export default function ArticleBody({ html }: ArticleBodyProps) {
  return <div className="blog-body prose-measure text-lg text-ink-700" dangerouslySetInnerHTML={{ __html: lazyImages(html) }} />;
}
