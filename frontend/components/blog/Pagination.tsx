import Link from 'next/link';

interface PaginationProps {
  basePath: string;
  page: number;
  total: number;
  pageSize: number;
}

const pageHref = (basePath: string, page: number) => (page <= 1 ? basePath : `${basePath}?page=${page}`);

export default function Pagination({ basePath, page, total, pageSize }: PaginationProps) {
  const pages = Math.ceil(total / pageSize);
  if (pages <= 1) return null;
  const linkClass = 'inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg px-3';
  return (
    <nav aria-label="Страницы блога" className="mt-10 flex flex-wrap justify-center gap-2">
      {Array.from({ length: pages }, (_, i) => i + 1).map((n) =>
        n === page ? (
          <span key={n} aria-current="page" className={`${linkClass} bg-sea text-white`}>{n}</span>
        ) : (
          <Link key={n} href={pageHref(basePath, n)} className={`${linkClass} bg-paper-50 text-ink-600 border border-line hover:bg-paper-200`}>
            {n}
          </Link>
        ),
      )}
    </nav>
  );
}
