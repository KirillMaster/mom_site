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
