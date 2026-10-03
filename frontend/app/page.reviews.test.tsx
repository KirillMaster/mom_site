const mockHome = jest.fn();
const mockReviews = jest.fn();
jest.mock('@/hooks/useApi', () => ({
  getHomeData: (...a: unknown[]) => mockHome(...a),
  getReviewsData: (...a: unknown[]) => mockReviews(...a),
}));
jest.mock('./HomeClientPage', () => () => null);
jest.mock('@/components/StructuredData', () => () => null);

import HomePage from './page';

const reviewsPropOf = (el: any) => {
  const kids = [].concat(el.props.children).filter(Boolean) as any[];
  return kids[kids.length - 1].props.reviews;
};

describe('@US2-EC1 ошибка запроса отзывов не роняет главную', () => {
  it('передаёт пустой список отзывов', async () => {
    mockHome.mockResolvedValue({ artworks: [], contacts: { socialLinks: {} } });
    mockReviews.mockRejectedValue(new Error('boom'));
    expect(reviewsPropOf(await HomePage())).toEqual([]);
  });

  it('@US2-AS3 передаёт отзывы при успехе', async () => {
    mockHome.mockResolvedValue({ artworks: [], contacts: { socialLinks: {} } });
    mockReviews.mockResolvedValue([{ id: 1 }]);
    expect(reviewsPropOf(await HomePage())).toEqual([{ id: 1 }]);
  });
});
