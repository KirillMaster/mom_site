import { fireEvent, render, screen } from '@testing-library/react';
import RelatedArtworks from './RelatedArtworks';
import BlogCta from './BlogCta';
import ArticleBody from './ArticleBody';
import { reachGoal, Goals } from '@/lib/analytics';

jest.mock('@/lib/analytics', () => ({
  reachGoal: jest.fn(),
  Goals: { BlogCta: 'blog_cta' },
}));

describe('RelatedArtworks', () => {
  it('shows every artwork, without a buy call for the sold one', () => {
    render(
      <RelatedArtworks
        artworks={[
          { id: 1, title: 'Сирень', thumbnailPath: 'https://s3/a.jpg', isForSale: true },
          { id: 2, title: 'Пионы', thumbnailPath: 'https://s3/b.jpg', isForSale: true },
          { id: 3, title: 'Море', thumbnailPath: 'https://s3/c.jpg', isForSale: false },
        ]}
      />,
    );
    const cards = screen.getAllByTestId('related-artwork');
    expect(cards).toHaveLength(3);
    expect(cards[2]).toHaveTextContent('Работа продана');
    expect(cards[2]).not.toHaveTextContent('Купить');
    expect(cards[0].querySelector('a')).toHaveAttribute('href', '/gallery/siren-1');
  });

  it('renders nothing without artworks', () => {
    const { container } = render(<RelatedArtworks artworks={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe('BlogCta', () => {
  it('fires the blog goal on click', () => {
    render(<BlogCta slug="vystavka" />);
    fireEvent.click(screen.getByRole('link', { name: 'Связаться с художником' }));
    expect(reachGoal).toHaveBeenCalledWith(Goals.BlogCta, { post: 'vystavka' });
  });
});

describe('ArticleBody', () => {
  it('makes images lazy', () => {
    const { container } = render(<ArticleBody html={'<p>т</p><img src="x.jpg" alt="фото">'} />);
    expect(container.querySelector('img')).toHaveAttribute('loading', 'lazy');
  });
});
