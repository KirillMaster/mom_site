jest.mock('@/hooks/useApi', () => ({
  getGalleryData: jest.fn(),
  getImageUrl: (p: string) => p,
}));
jest.mock('./GalleryClientPage', () => () => null);

import { metadata } from './page';

describe('gallery page metadata', () => {
  it('@US7-AS1 uses the commercial title for both title and openGraph', () => {
    const expected = 'Купить картины маслом — галерея Анжелы Моисеенко';

    expect(metadata.title).toBe(expected);
    expect(metadata.openGraph?.title).toBe(expected);
  });
});
