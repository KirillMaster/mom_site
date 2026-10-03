import { render, screen } from '@testing-library/react';
import AboutClientPage from './AboutClientPage';

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, sizes }: { src: string; alt: string; sizes?: string }) => (
    <img src={src} alt={alt} data-sizes={sizes} />
  ),
}));
jest.mock('@/components/Navigation', () => () => null);
jest.mock('@/components/Footer', () => () => null);

const base = {
  biography: 'Био',
  artistPhoto: 'a.jpg',
  bannerTitle: 'Обо мне',
  bannerDescription: '',
  additionalBiography: '',
  philosophy: 'Свет',
};
const photo = (id: number) => ({ id, title: `Вернисаж ${id}`, imagePath: `p${id}.jpg`, thumbnailPath: `t${id}.jpg` });

describe('exhibition photos on /about', () => {
  it('@US5-AS4 renders the section with 5 next/image images carrying sizes, biography untouched', () => {
    const { container } = render(
      <AboutClientPage aboutData={{ ...base, exhibitionPhotos: [1, 2, 3, 4, 5].map(photo) } as any} />
    );
    const section = screen.getByTestId('exhibition-photos');
    const imgs = section.querySelectorAll('img');
    expect(imgs).toHaveLength(5);
    imgs.forEach((img) => expect(img.getAttribute('data-sizes')).toBeTruthy());
    expect(screen.getByRole('heading', { name: 'Выставки' })).toBeInTheDocument();
    expect(container.querySelectorAll('.prose-measure p').length).toBeGreaterThan(1);
  });

  it.each([[undefined], [[]], [null]])('@US5-FE3 hidden without data (%p)', (value) => {
    render(<AboutClientPage aboutData={{ ...base, exhibitionPhotos: value } as any} />);
    expect(screen.queryByTestId('exhibition-photos')).not.toBeInTheDocument();
  });
});
