import { render } from '@testing-library/react';
import HomeClientPage from '@/app/HomeClientPage';
import AboutClientPage from '@/app/about/AboutClientPage';
import VideosClientPage from '@/app/videos/VideosClientPage';
import ReviewsClientPage from '@/app/reviews/ReviewsClientPage';
import ArticleBody from '@/components/blog/ArticleBody';
import PostCard from '@/components/blog/PostCard';
import CategoryTabs from '@/components/blog/CategoryTabs';
import Pagination from '@/components/blog/Pagination';
import BlogCta from '@/components/blog/BlogCta';
import RelatedArtworks from '@/components/blog/RelatedArtworks';
import ArtistCredentials from '@/components/ArtistCredentials';
import ExhibitionTimeline from '@/components/ExhibitionTimeline';
import LoadingSpinner from '@/components/LoadingSpinner';
import NotFound from '@/app/not-found';

jest.mock('@/hooks/useApi', () => ({
  getImageUrl: (p: string) => `https://cdn.test/${p}`,
  submitReview: jest.fn(),
}));
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));
jest.mock('next/navigation', () => ({ usePathname: () => '/' }));
jest.mock('@/components/Navigation', () => () => null);
jest.mock('@/components/Footer', () => () => null);
jest.mock('@/components/ArtworkCarousel', () => () => null);
jest.mock('react-player', () => ({ __esModule: true, default: () => null }));
jest.mock('@/lib/analytics', () => ({ reachGoal: jest.fn(), Goals: { BlogCta: 'blog_cta' } }));

const LEGACY =
  /(?:bg|text|border|ring|from|to|via|fill|stroke|outline|decoration|shadow|divide|placeholder)-(?:primary|secondary|warm|purple|indigo|blue|violet|fuchsia|orange)-|gradient|gray-50/;

const homeData = {
  bannerImage: 'b.jpg',
  biographyText: 'Биография',
  authorPhoto: '',
  artworks: [],
  contacts: {
    phone: '+79990000000',
    email: 'a@b.ru',
    socialLinks: { instagram: 'https://i', vk: 'https://v', telegram: 'https://t', whatsapp: 'https://w', youtube: 'https://y', max: 'https://m' },
  },
} as any;
const aboutData = { bannerTitle: 'Обо мне', bannerDescription: 'd', artistPhoto: 'a.jpg', philosophy: 'Ф' } as any;
const videosData = {
  videos: [{ id: 1, title: 'В мастерской', description: 'д', videoPath: 'v.mp4', thumbnailPath: 'v.jpg', videoCategoryId: 1 }],
  categories: [{ id: 1, name: 'Процесс', description: 'Съёмки' }],
} as any;
const post = {
  slug: 's', title: 'T', excerpt: 'e', publishedAt: '2026-01-01T00:00:00Z', readingMinutes: 3,
  coverImagePath: 'c.jpg', coverAlt: 'c', category: { slug: 'c', name: 'Кат' },
} as any;

describe('@US1-FE4 home and about without gradients, CTA is Button', () => {
  it('home has no legacy classes; primary CTA is bg-sea, secondary has border-sea', () => {
    const { container } = render(<HomeClientPage homeData={homeData} />);
    expect(container.innerHTML).not.toMatch(LEGACY);
    const cta = container.querySelector('a[href="/gallery"]')!;
    expect(cta.className).toContain('bg-sea');
    const secondary = container.querySelector('a[href="/about"]')!;
    expect(secondary.className).toContain('border-sea');
    expect(secondary.className).not.toContain('bg-sea ');
  });

  it('about has no legacy classes and biography paragraphs use prose-measure', () => {
    const { container } = render(<AboutClientPage aboutData={aboutData} />);
    expect(container.innerHTML).not.toMatch(LEGACY);
    expect(container.querySelector('.prose-measure')).not.toBeNull();
    expect(container.querySelectorAll('.prose-measure p').length).toBeGreaterThan(1);
  });

  it('credentials and timeline have no legacy classes', () => {
    const a = render(<ArtistCredentials />);
    const t = render(<ExhibitionTimeline />);
    expect(a.container.innerHTML).not.toMatch(LEGACY);
    expect(t.container.innerHTML).not.toMatch(LEGACY);
  });
});

describe('@US1-FE5 videos, reviews and public blog on tokens', () => {
  it('videos and reviews have no legacy classes', () => {
    const v = render(<VideosClientPage videosData={videosData} />);
    expect(v.container.innerHTML).not.toMatch(LEGACY);
    const r = render(
      <ReviewsClientPage
        reviews={[{ id: 1, authorName: 'О', authorCity: 'М', text: 'т', rating: 4, createdAt: '2026-01-15T12:00:00Z', sortOrder: 0, artworkId: 5, photoPath: null } as any]}
        artworksById={{ 5: { id: 5, title: 'Море' } }}
      />,
    );
    expect(r.container.innerHTML).not.toMatch(LEGACY);
  });

  it('blog components have no legacy classes', () => {
    const html = [
      render(<PostCard post={post} />),
      render(<CategoryTabs categories={[{ slug: 'c', name: 'Кат' } as any]} activeSlug="c" />),
      render(<Pagination basePath="/blog" page={1} total={30} pageSize={9} />),
      render(<BlogCta slug="s" />),
      render(<RelatedArtworks artworks={[{ id: 1, title: 'Море', thumbnailPath: 't.jpg', isForSale: true } as any]} />),
      render(<LoadingSpinner />),
      render(<NotFound />),
    ].map((r) => r.container.innerHTML).join('');
    expect(html).not.toMatch(LEGACY);
  });

  it('article text has prose-measure', () => {
    const { container } = render(<ArticleBody html="<p>x</p>" />);
    expect(container.firstElementChild).toHaveClass('prose-measure');
  });
});
