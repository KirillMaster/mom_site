import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import PageContentManagement from './page';

const existingHomeContent = [
  { id: 1, pageKey: 'home', contentKey: 'welcome_message', textContent: 'Добро пожаловать', isActive: true, displayOrder: 0 },
  { id: 2, pageKey: 'home', contentKey: 'home_seo_title', textContent: '', isActive: true, displayOrder: 4 },
  { id: 3, pageKey: 'home', contentKey: 'home_seo_description', textContent: '', isActive: true, displayOrder: 5 },
];

describe('@S5-AS3 admin panel exposes editable homepage SEO fields', () => {
  beforeEach(() => {
    localStorage.setItem('token', 'test-token');
    global.fetch = jest.fn((url: string, opts?: any) => {
      if (opts?.method === 'PUT' || opts?.method === 'POST') {
        return Promise.resolve({ ok: true, json: async () => ({}), text: async () => '' } as Response);
      }
      return Promise.resolve({
        ok: true,
        json: async () => existingHomeContent,
      } as Response);
    }) as any;
  });

  afterEach(() => {
    jest.resetAllMocks();
    localStorage.clear();
  });

  it('shows separate labelled inputs for SEO title and SEO description, distinct from welcomeMessage', async () => {
    render(<PageContentManagement />);

    await waitFor(() => expect(screen.getByText(/Приветственное сообщение/i)).toBeInTheDocument());

    expect(screen.getByText('SEO заголовок (главная)')).toBeInTheDocument();
    expect(screen.getByText('SEO описание (главная)')).toBeInTheDocument();
  });

  it('saves the SEO fields independently of welcomeMessage', async () => {
    render(<PageContentManagement />);

    await waitFor(() => expect(screen.getByText(/Приветственное сообщение/i)).toBeInTheDocument());

    const seoTitleLabel = screen.getByText('SEO заголовок (главная)');
    const seoTitleInput = seoTitleLabel.parentElement!.querySelector('input') as HTMLInputElement;
    fireEvent.change(seoTitleInput, { target: { value: 'Новый SEO заголовок' } });

    const welcomeLabel = screen.getByText(/Приветственное сообщение/i);
    const welcomeTextarea = welcomeLabel.parentElement!.querySelector('textarea') as HTMLTextAreaElement;
    expect(welcomeTextarea.value).toBe('Добро пожаловать');

    fireEvent.click(screen.getByRole('button', { name: /Сохранить/i }));

    await waitFor(() => {
      const putCalls = (global.fetch as jest.Mock).mock.calls.filter(([, opts]) => opts?.method === 'PUT');
      expect(putCalls.length).toBeGreaterThan(0);
    });

    // The SEO title was PUT to its own content item (id 2), and its FormData
    // carries the new value without touching welcomeMessage's item (id 1).
    const putCalls = (global.fetch as jest.Mock).mock.calls.filter(([, opts]) => opts?.method === 'PUT');
    const seoTitleCall = putCalls.find(([url]: [string]) => url.includes('/page-content/2'));
    expect(seoTitleCall).toBeDefined();
    const body = seoTitleCall![1].body as FormData;
    expect(body.get('textContent')).toBe('Новый SEO заголовок');

    // welcomeMessage's own value stays what it already was.
    expect(welcomeTextarea.value).toBe('Добро пожаловать');
  });
});
