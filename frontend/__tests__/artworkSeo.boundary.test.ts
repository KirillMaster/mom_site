import {
  buildSeoTitle,
  buildSeoDescription,
  buildArtworkSchema,
  buildBreadcrumbSchema,
  artworkPageUrl,
  SITE_URL,
  ARTIST_NAME
} from '@/app/gallery/[slug]/artworkSeo';

// Mock the API utility
jest.mock('@/hooks/useApi', () => ({
  getImageUrl: (p: string) => (p.startsWith('http') ? p : `https://cdn.test${p}`)
}));

describe('@US3-AS4 SEO title generation', () => {
  it('includes title and artist name', () => {
    const artwork = { title: 'Сирень', id: 1 };
    const title = buildSeoTitle(artwork);
    expect(title).toContain('Сирень');
    expect(title).toContain(ARTIST_NAME);
    expect(title).toContain('Купить');
  });

  it('handles very long artwork titles', () => {
    const longTitle = 'Очень длинное название картины которое занимает много символов в поиске';
    const artwork = { title: longTitle, id: 1 };
    const title = buildSeoTitle(artwork);
    // Title should still be useful even if long
    expect(title).toContain(longTitle);
    expect(title).toContain('Купить');
  });

  it('handles special characters in title', () => {
    const artwork = { title: 'Картина «Ночь» & "День"', id: 1 };
    const title = buildSeoTitle(artwork);
    expect(title).toContain('Картина');
    expect(title).toContain('Ночь');
  });
});

describe('@US3-AS4 SEO description generation', () => {
  it('includes title and artist with "Купить"', () => {
    const artwork = { title: 'Сирень', description: 'Масло на холсте', id: 1 };
    const desc = buildSeoDescription(artwork);
    expect(desc).toContain('Сирень');
    expect(desc).toContain('Масло на холсте');
    expect(desc).toContain('Купить');
  });

  it('works without description field', () => {
    const artwork = { title: 'Сирень', id: 1 };
    const desc = buildSeoDescription(artwork);
    expect(desc).toContain('Сирень');
    expect(desc).toContain('Купить');
  });

  it('truncates to ~160 chars with ellipsis when too long', () => {
    const longDesc = 'Это очень длинное описание картины которое содержит много информации о технике исполнения, материалах, истории создания и прочих деталях которые не уместятся в мета-описание поиска';
    const artwork = { title: 'Картина', description: longDesc, id: 1 };
    const desc = buildSeoDescription(artwork);
    expect(desc.length).toBeLessThanOrEqual(165); // 157 + '...'
    expect(desc).toContain('...');
  });

  it('does not add ellipsis when within budget', () => {
    const artwork = { title: 'Картина', description: 'Короткое описание', id: 1 };
    const desc = buildSeoDescription(artwork);
    expect(desc).not.toContain('...');
  });

  it('handles empty description string', () => {
    const artwork = { title: 'Сирень', description: '', id: 1 };
    const desc = buildSeoDescription(artwork);
    expect(desc).toContain('Сирень');
  });
});

describe('@US3-AS5 artwork schema.org structure', () => {
  it('creates VisualArtwork schema with title and creator', () => {
    const artwork = { title: 'Сирень', id: 1, description: 'Test' };
    const schema = buildArtworkSchema(artwork, []);
    expect(schema['@context']).toBe('https://schema.org');
    expect(schema['@type']).toBe('VisualArtwork');
    expect(schema.name).toBe('Сирень');
    expect(schema.creator.name).toBe(ARTIST_NAME);
  });

  it('includes all photo URLs in image array', () => {
    const artwork = { title: 'Картина', id: 1 };
    const photos = [
      { path: '/photo-0.jpg', thumbPath: '/thumb-0.jpg' },
      { path: '/photo-1.jpg', thumbPath: '/thumb-1.jpg' },
      { path: '/photo-2.jpg', thumbPath: '/thumb-2.jpg' }
    ];
    const schema = buildArtworkSchema(artwork, photos);
    expect(schema.image).toHaveLength(3);
    expect(schema.image[0]).toContain('photo-0.jpg');
    expect(schema.image[1]).toContain('photo-1.jpg');
    expect(schema.image[2]).toContain('photo-2.jpg');
  });

  it('handles empty photos array', () => {
    const artwork = { title: 'Картина', id: 1 };
    const schema = buildArtworkSchema(artwork, []);
    expect(schema.image).toEqual([]);
  });

  it('uses description for artMedium when present', () => {
    const artwork = { title: 'Картина', id: 1, description: 'Масло на холсте' };
    const schema = buildArtworkSchema(artwork, []);
    expect(schema.artMedium).toBe('Масло на холсте');
  });

  it('omits artMedium when description is missing', () => {
    const artwork = { title: 'Картина', id: 1 };
    const schema = buildArtworkSchema(artwork, []);
    expect(schema.artMedium).toBeUndefined();
  });

  it('includes offers only when isForSale and has price', () => {
    const artwork = { title: 'Картина', id: 1, isForSale: true, price: 50000 };
    const schema = buildArtworkSchema(artwork, []);
    expect(schema.offers).toBeDefined();
    expect(schema.offers.price).toBe(50000);
    expect(schema.offers.priceCurrency).toBe('RUB');
  });

  it('omits offers when isForSale is false', () => {
    const artwork = { title: 'Картина', id: 1, isForSale: false, price: 50000 };
    const schema = buildArtworkSchema(artwork, []);
    expect(schema.offers).toBeUndefined();
  });

  it('omits offers when price is 0', () => {
    const artwork = { title: 'Картина', id: 1, isForSale: true, price: 0 };
    const schema = buildArtworkSchema(artwork, []);
    expect(schema.offers).toBeUndefined();
  });

  it('omits offers when price is missing', () => {
    const artwork = { title: 'Картина', id: 1, isForSale: true };
    const schema = buildArtworkSchema(artwork, []);
    expect(schema.offers).toBeUndefined();
  });

  it('uses categoryName as fallback description', () => {
    const artwork = { title: 'Картина', id: 1 };
    const schema = buildArtworkSchema(artwork, [], 'Пейзажи');
    expect(schema.description).toBe('Пейзажи');
  });

  it('prefers artwork description over categoryName', () => {
    const artwork = { title: 'Картина', id: 1, description: 'Мой текст' };
    const schema = buildArtworkSchema(artwork, [], 'Пейзажи');
    expect(schema.description).toBe('Мой текст');
  });

  it('falls back to title when no description or category', () => {
    const artwork = { title: 'Картина', id: 1 };
    const schema = buildArtworkSchema(artwork, []);
    expect(schema.description).toBe('Картина');
  });
});

describe('@US3-AS6 breadcrumb schema structure', () => {
  it('creates BreadcrumbList with three items', () => {
    const artwork = { title: 'Сирень', id: 5 };
    const schema = buildBreadcrumbSchema(artwork);
    expect(schema['@type']).toBe('BreadcrumbList');
    expect(schema.itemListElement).toHaveLength(3);
  });

  it('includes home, gallery, and artwork items in order', () => {
    const artwork = { title: 'Картина', id: 5 };
    const schema = buildBreadcrumbSchema(artwork);
    expect(schema.itemListElement[0].position).toBe(1);
    expect(schema.itemListElement[0].name).toBe('Главная');
    expect(schema.itemListElement[1].position).toBe(2);
    expect(schema.itemListElement[1].name).toBe('Галерея');
    expect(schema.itemListElement[2].position).toBe(3);
    expect(schema.itemListElement[2].name).toBe('Картина');
  });

  it('builds correct artwork page URL in breadcrumb', () => {
    const artwork = { title: 'Сирень', id: 5 };
    const schema = buildBreadcrumbSchema(artwork);
    const artworkItem = schema.itemListElement[2].item;
    expect(artworkItem).toContain(SITE_URL);
    expect(artworkItem).toContain('/gallery/');
  });
});

describe('@US3-AS7 artwork page URL building', () => {
  it('includes site URL and gallery path', () => {
    const artwork = { title: 'Картина', id: 5 };
    const url = artworkPageUrl(artwork);
    expect(url).toContain(SITE_URL);
    expect(url).toContain('/gallery/');
  });

  it('includes artwork ID for uniqueness', () => {
    const artwork = { title: 'Картина', id: 999 };
    const url = artworkPageUrl(artwork);
    expect(url).toContain('999');
  });
});

describe('@T023 catalog fields in SEO', () => {
  const base = {
    id: 3, title: 'Закат', status: 'Available', price: 12000, widthCm: 60, heightCm: 80, year: 2019,
    support: 'холст', technique: 'масло', shortDescription: 'Тёплый вечер у моря', description: 'Длинное описание',
    imagePath: '/a.jpg',
  };

  it('schema has size, year, medium, surface and InStock offer', () => {
    const ld: any = buildArtworkSchema(base as any, []);
    expect(ld.width).toEqual({ '@type': 'QuantitativeValue', value: 60, unitCode: 'CMT' });
    expect(ld.height.value).toBe(80);
    expect(ld.dateCreated).toBe('2019');
    expect(ld.artMedium).toBe('масло');
    expect(ld.artworkSurface).toBe('холст');
    expect(ld.offers.availability).toMatch(/InStock/);
    expect(ld.offers.priceCurrency).toBe('RUB');
  });

  it('Sold gives SoldOut offer, other statuses give no offer', () => {
    expect((buildArtworkSchema({ ...base, status: 'Sold' } as any, []) as any).offers.availability).toMatch(/SoldOut/);
    expect((buildArtworkSchema({ ...base, status: 'PrivateCollection' } as any, []) as any).offers).toBeUndefined();
  });

  it('description starts with short description', () => {
    expect(buildSeoDescription(base as any)).toContain("Тёплый вечер у моря");
  });
});
