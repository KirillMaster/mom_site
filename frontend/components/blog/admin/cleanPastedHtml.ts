const UNWRAP_TAGS = ['SPAN', 'FONT', 'O:P', 'DIV', 'SECTION', 'ARTICLE'];
const DROP_TAGS = ['STYLE', 'SCRIPT', 'META', 'LINK', 'XML', 'TITLE'];
const KEEP_ATTRS: Record<string, string[]> = { A: ['href'], IMG: ['src', 'alt'] };

function unwrap(el: Element) {
  const parent = el.parentNode;
  if (!parent) return;
  while (el.firstChild) parent.insertBefore(el.firstChild, el);
  parent.removeChild(el);
}

function cleanElement(el: Element) {
  const keep = KEEP_ATTRS[el.tagName] ?? [];
  Array.from(el.attributes).forEach((attr) => {
    if (!keep.includes(attr.name)) el.removeAttribute(attr.name);
  });
}

/** Чистит HTML из Word/сайтов: без стилей, классов, span/font и base64-картинок. */
export function cleanPastedHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_COMMENT);
  const comments: Node[] = [];
  while (walker.nextNode()) comments.push(walker.currentNode);
  comments.forEach((c) => c.parentNode?.removeChild(c));

  Array.from(doc.body.querySelectorAll('*')).forEach((el) => {
    if (DROP_TAGS.includes(el.tagName)) {
      el.remove();
      return;
    }
    if (el.tagName === 'IMG' && !/^https?:\/\//i.test(el.getAttribute('src') ?? '')) {
      el.remove();
      return;
    }
    cleanElement(el);
  });

  Array.from(doc.body.querySelectorAll('*'))
    .filter((el) => UNWRAP_TAGS.includes(el.tagName) || el.tagName.includes(':'))
    .reverse()
    .forEach(unwrap);

  return doc.body.innerHTML;
}

export function imageFilesFrom(list: FileList | null | undefined): File[] {
  return Array.from(list ?? []).filter((file) => file.type.startsWith('image/'));
}
