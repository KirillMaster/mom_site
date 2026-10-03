import { render, screen } from '@testing-library/react';

jest.mock('@/hooks/useApi', () => ({ sendContactMessage: jest.fn() }));

import OrderPage, { metadata } from './page';

describe('@US6-FE1 страница /order', () => {
  it('имеет title и description', () => {
    expect(String(metadata.title)).toMatch(/заказ/i);
    expect(String(metadata.description).length).toBeGreaterThan(20);
  });

  it('описывает процесс и рендерит форму', () => {
    render(<OrderPage searchParams={{}} />);
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/эскиз/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Отправить' })).toBeInTheDocument();
  });

  it('@US6-FE3 передаёт ?artwork= в форму', () => {
    render(<OrderPage searchParams={{ artwork: 'Цветы лета' }} />);
    expect(screen.getByLabelText(/Комментарий/)).toHaveValue('Хочу похожую на «Цветы лета»');
  });
});
