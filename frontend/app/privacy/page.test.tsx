import { render, screen } from '@testing-library/react';
import PrivacyPage, { generateMetadata, revalidate } from './page';
import { getPrivacyData } from '@/hooks/useApi';

jest.mock('@/hooks/useApi', () => ({ getPrivacyData: jest.fn() }));
const mocked = getPrivacyData as jest.Mock;

const renderPage = async () => render(await PrivacyPage());

describe('/privacy page', () => {
  it('renders the default template with operator details when no text is set', async () => {
    mocked.mockResolvedValue({ text: null, updatedAt: null });
    await renderPage();

    expect(screen.getByRole('heading', { level: 1, name: 'Политика конфиденциальности' })).toBeInTheDocument();
    expect(screen.getByText(/Моисеенко Анжела Валерьевна/)).toBeInTheDocument();
    expect(screen.getAllByText(/suhorukih@mail\.ru/).length).toBeGreaterThan(0);
  });

  it('renders admin text as paragraphs without interpreting HTML', async () => {
    mocked.mockResolvedValue({ text: 'Абзац один\n\n<b>Абзац два</b>', updatedAt: '2026-10-01T12:00:00Z' });
    const { container } = await renderPage();

    expect(screen.getByText('Абзац один')).toBeInTheDocument();
    expect(screen.getByText('<b>Абзац два</b>')).toBeInTheDocument();
    expect(container.querySelector('b')).toBeNull();
    expect(screen.getByText(/Редакция от/)).toBeInTheDocument();
    expect(screen.queryByText(/Моисеенко Анжела Валерьевна/)).toBeNull();
  });

  it('sets canonical metadata and hourly revalidation', async () => {
    const meta = await generateMetadata();
    expect(meta.alternates?.canonical).toBe('/privacy');
    expect(meta.title).toContain('Политика конфиденциальности');
    expect(meta.openGraph).toBeDefined();
    expect(revalidate).toBe(3600);
  });
});
