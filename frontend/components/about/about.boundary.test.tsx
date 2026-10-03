import { render, screen } from '@testing-library/react';
import BiographySection from './BiographySection';
import { StonePanelsSection, PublicationsSection, CollectionsSection } from './RecordSections';
import { collections, fullBio, publications, stonePanels } from '@/data/biography';

jest.mock('@/hooks/useApi', () => ({ getImageUrl: (p: string) => `https://cdn.test/${p}` }));

describe('@US1-FE4 BiographySection', () => {
  it('renders portrait, every bio paragraph and the three tags', () => {
    const { container } = render(<BiographySection artistPhoto="me.jpg" />);
    const img = screen.getByRole('img') as HTMLImageElement;
    expect(img.getAttribute('src')).toBe('https://cdn.test/me.jpg');
    expect(img).toHaveClass('object-top');
    expect(container.querySelectorAll('.prose-measure p')).toHaveLength(fullBio.length);
    expect(screen.getByText(fullBio[0])).toBeInTheDocument();
    expect(screen.getAllByRole('listitem').map((li) => li.textContent)).toEqual([
      'Импрессионизм',
      'Театральное искусство',
      'Натюрморты',
    ]);
    expect(screen.getByRole('heading', { level: 2, name: 'Анжела Моисеенко' })).toBeInTheDocument();
  });
});

describe('@US1-FE4 RecordSections', () => {
  it('StonePanelsSection shows the title and text', () => {
    render(<StonePanelsSection />);
    expect(screen.getByRole('heading', { level: 2, name: stonePanels.title })).toBeInTheDocument();
    expect(screen.getByText(stonePanels.text)).toBeInTheDocument();
  });

  it('PublicationsSection lists every publication with its year', () => {
    render(<PublicationsSection />);
    expect(screen.getByRole('heading', { level: 2, name: 'Публикации о творчестве' })).toBeInTheDocument();
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(publications.length);
    expect(items[0]).toHaveTextContent(publications[0].year);
    expect(items[0]).toHaveTextContent(publications[0].text);
  });

  it('CollectionsSection lists every museum and country', () => {
    render(<CollectionsSection />);
    expect(screen.getByRole('heading', { level: 3, name: 'Музеи' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Частные коллекции' })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(collections.museums.length);
    collections.countries.forEach((c) => expect(screen.getByText(c)).toBeInTheDocument());
  });
});
