import { render, screen } from '@testing-library/react';
import Footer from './Footer';
import { useFooterData } from '@/hooks/useApi';

jest.mock('@/hooks/useApi', () => ({
  useFooterData: jest.fn(),
}));

const mockedUseFooterData = useFooterData as jest.Mock;

describe('@S4-AS9 в Footer есть ссылка на /reviews', () => {
  it('рендерит ссылку на /reviews', () => {
    mockedUseFooterData.mockReturnValue({ data: undefined, isLoading: false });
    render(<Footer />);

    const link = screen.getByRole('link', { name: 'Отзывы' });
    expect(link).toHaveAttribute('href', '/reviews');
  });
});
