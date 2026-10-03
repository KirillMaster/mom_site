import { render, screen } from '@testing-library/react';
import RelatedWorks from '@/app/gallery/[slug]/RelatedWorks';

jest.mock('@/hooks/useApi', () => ({
  getImageUrl: (p: string) => `https://cdn.test${p}`,
}));

const work = (id: number, title = `Работа ${id}`) => ({
  id,
  title,
  imagePath: `/img-${id}.jpg`,
  thumbnailPath: `/thumb-${id}.jpg`,
});

describe('RelatedWorks', () => {
  it('@US5-AS1 shows at most 8 works and a "Смотреть все" link to the category', () => {
    const works = Array.from({ length: 12 }, (_, i) => work(i + 1));
    render(<RelatedWorks works={works} categoryId={3} />);

    expect(screen.getAllByRole('listitem')).toHaveLength(8);
    expect(screen.getByRole('link', { name: 'Смотреть все' })).toHaveAttribute(
      'href',
      '/gallery?category=3'
    );
  });

  it('@US5-EC7 renders no block when there are no other works', () => {
    const { container } = render(<RelatedWorks works={[]} categoryId={3} />);

    expect(container.firstChild).toBeNull();
  });

  it('@US8-AS3 shows a quoted title without the quotes', () => {
    render(<RelatedWorks works={[work(1, '"Утро"')]} categoryId={3} />);

    expect(screen.getByText('Утро')).toBeInTheDocument();
    expect(screen.queryByText('"Утро"')).not.toBeInTheDocument();
  });
});
