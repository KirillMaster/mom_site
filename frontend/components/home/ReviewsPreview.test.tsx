import { render, screen } from '@testing-library/react';
import ReviewsPreview from './ReviewsPreview';
import type { ReviewDto } from '@/lib/api';

const review = (id: number, artworkId?: number): ReviewDto => ({
  id, authorName: `Автор ${id}`, text: `Текст ${id}`, rating: 5, createdAt: '2026-01-01', sortOrder: id, artworkId,
});
const five = [review(1), review(2), review(3), review(4), review(5, 7)];

describe('@US2-AS3 отзывы на главной', () => {
  it('показывает не больше трёх и ссылку «Все отзывы» на /reviews', () => {
    const { container } = render(<ReviewsPreview reviews={five} />);
    expect(container.querySelectorAll('blockquote')).toHaveLength(3);
    expect(screen.getByRole('link', { name: /Все отзывы/ })).toHaveAttribute('href', '/reviews');
  });

  it('prioritizeArtworkId ставит отзыв о работе первым', () => {
    const { container } = render(<ReviewsPreview reviews={five} prioritizeArtworkId={7} />);
    const quotes = container.querySelectorAll('blockquote');
    expect(quotes).toHaveLength(3);
    expect(quotes[0].textContent).toContain('Текст 5');
  });
});

describe('@US2-EC1 нет отзывов', () => {
  it('скрыт при пустом списке и при undefined', () => {
    expect(render(<ReviewsPreview reviews={[]} />).container).toBeEmptyDOMElement();
    expect(render(<ReviewsPreview reviews={undefined} />).container).toBeEmptyDOMElement();
  });
});

// ====== Degradation Mode Boundary Tests for ReviewsPreview ======

describe('@US2-AS3 @US2-EC1 отзывы — boundary cases (1, 2, 4 items)', () => {
  it('shows single review when only one exists', () => {
    const { container } = render(<ReviewsPreview reviews={[review(1)]} />);
    const quotes = container.querySelectorAll('blockquote');
    expect(quotes).toHaveLength(1);
    expect(quotes[0].textContent).toContain('Текст 1');
  });

  it('shows exactly two reviews', () => {
    const { container } = render(<ReviewsPreview reviews={[review(1), review(2)]} />);
    const quotes = container.querySelectorAll('blockquote');
    expect(quotes).toHaveLength(2);
  });

  it('shows three reviews when exactly four provided', () => {
    const { container } = render(<ReviewsPreview reviews={[review(1), review(2), review(3), review(4)]} />);
    const quotes = container.querySelectorAll('blockquote');
    expect(quotes).toHaveLength(3);
    expect(screen.getByRole('link', { name: /Все отзывы/ })).toHaveAttribute('href', '/reviews');
  });

  it('always shows "Все отзывы" link when reviews exist', () => {
    const { rerender } = render(<ReviewsPreview reviews={[review(1)]} />);
    expect(screen.getByRole('link', { name: /Все отзывы/ })).toBeInTheDocument();

    rerender(<ReviewsPreview reviews={[review(1), review(2)]} />);
    expect(screen.getByRole('link', { name: /Все отзывы/ })).toBeInTheDocument();
  });
});

describe('@US2-AS3 prioritizeArtworkId — boundary with 1 review', () => {
  it('prioritizes single review if artworkId matches', () => {
    const reviews = [review(1, 5)];
    const { container } = render(<ReviewsPreview reviews={reviews} prioritizeArtworkId={5} />);
    const quotes = container.querySelectorAll('blockquote');
    expect(quotes).toHaveLength(1);
    expect(quotes[0].textContent).toContain('Текст 1');
  });

  it('does not crash when prioritizeArtworkId has no match', () => {
    const reviews = [review(1, 5), review(2)];
    const { container } = render(<ReviewsPreview reviews={reviews} prioritizeArtworkId={999} />);
    const quotes = container.querySelectorAll('blockquote');
    expect(quotes).toHaveLength(2);
  });

  it('shows artwork review first with 2 general + 1 artwork review', () => {
    const reviews = [review(1), review(2), review(3, 42)];
    const { container } = render(<ReviewsPreview reviews={reviews} prioritizeArtworkId={42} />);
    const quotes = container.querySelectorAll('blockquote');
    expect(quotes).toHaveLength(3);
    expect(quotes[0].textContent).toContain('Текст 3');
  });
});

describe('@US2-AS3 review link accessibility', () => {
  it('link href is /reviews for reviews navigation', () => {
    const { container } = render(<ReviewsPreview reviews={[review(1), review(2), review(3)]} />);
    const link = container.querySelector('a[href="/reviews"]');
    expect(link).toBeInTheDocument();
  });
});
