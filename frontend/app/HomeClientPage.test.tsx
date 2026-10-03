import { render } from '@testing-library/react';
import HomeClientPage from './HomeClientPage';

jest.mock('@/hooks/useApi', () => ({
  getImageUrl: (p: string) => `https://cdn.test/${p}`,
}));
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));
jest.mock('@/components/ArtworkCarousel', () => () => null);

const homeData = {
  welcomeMessage: 'Привет',
  bannerImage: 'banner.jpg',
  biographyText: 'Биография',
  authorPhoto: '',
  artworks: [],
  contacts: { socialLinks: {} },
} as any;

describe('HomeClientPage hero', () => {
  it('@US7-AS3 gives the hero image a meaningful alt', () => {
    const { container } = render(<HomeClientPage homeData={homeData} />);

    const hero = container.querySelector('img[src$="banner.jpg"]');
    expect(hero).not.toBeNull();
    const alt = hero?.getAttribute('alt') ?? '';
    expect(alt.trim()).not.toBe('');
    expect(alt).toMatch(/Картина|Анжел/);
  });
});
