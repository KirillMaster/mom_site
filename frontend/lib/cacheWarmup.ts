const CONCURRENCY = 3;

let running: Promise<void> | null = null;

export type WarmupStatus = 'started' | 'already-running';

export function localOrigin(): string {
  return `http://127.0.0.1:${process.env.PORT || 3000}`;
}

export function extractLocs(xml: string): string[] {
  return Array.from(xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g), (m) => m[1]);
}

export function toLocalUrl(loc: string, origin: string): string {
  const url = new URL(loc);
  return `${origin}${url.pathname}${url.search}`;
}

async function fetchSitemapUrls(origin: string): Promise<string[]> {
  const response = await fetch(`${origin}/sitemap.xml`);
  if (!response.ok) {
    throw new Error(`sitemap status ${response.status}`);
  }
  return extractLocs(await response.text()).map((loc) => toLocalUrl(loc, origin));
}

async function warmUrl(url: string): Promise<void> {
  try {
    const res = await fetch(url);
    await res.arrayBuffer();
  } catch (error) {
    console.error('Cache warmup request failed:', url, error);
  }
}

async function warmUrls(urls: string[]): Promise<void> {
  const queue = [...urls];
  const worker = async () => {
    for (let url = queue.shift(); url; url = queue.shift()) {
      await warmUrl(url);
    }
  };
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, urls.length) }, worker));
}

async function runWarmup(origin: string): Promise<void> {
  try {
    await warmUrls(await fetchSitemapUrls(origin));
  } catch (error) {
    console.error('Cache warmup failed:', error);
  }
}

export function startWarmup(origin: string = localOrigin()): { status: WarmupStatus; done: Promise<void> } {
  if (running) {
    return { status: 'already-running', done: running };
  }
  const done = runWarmup(origin).finally(() => {
    running = null;
  });
  running = done;
  return { status: 'started', done };
}
