import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import CatalogAdminPage from './page';
import { adminCatalog } from '@/lib/catalogApi';
import type { ImportReport } from '@/types/catalog';

jest.mock('@/components/AdminAuthGuard', () => ({ __esModule: true, default: ({ children }: any) => <>{children}</> }));
jest.mock('@/lib/catalogApi', () => ({
  ...jest.requireActual('@/lib/catalogApi'),
  adminCatalog: { preview: jest.fn(), apply: jest.fn(), rollback: jest.fn() },
}));

const mocked = adminCatalog as jest.Mocked<typeof adminCatalog>;

const report = (over: Partial<ImportReport> = {}): ImportReport => ({
  summary: { updated: 1, created: 1, skipped: 0, warnings: 0, errors: 1, templateVersionMismatch: false },
  rows: [
    { row: 2, sheet: 'Каталог', id: 5, title: 'Закат', changes: [{ field: 'Price', old: '1000', new: '2000' }], issues: [], comment: 'проверить' },
    { row: 3, sheet: 'Каталог', id: null, title: 'Новая', changes: [], issues: [{ level: 'error', column: 'Год', message: 'Год вне диапазона' }], comment: null },
  ],
  logId: null,
  ...over,
});

const pickFile = () => {
  fireEvent.change(screen.getByLabelText('Файл каталога'), { target: { files: [new File(['x'], 'c.xlsx')] } });
};

beforeEach(() => {
  jest.resetAllMocks();
  window.confirm = jest.fn(() => true);
});

describe('admin catalog page', () => {
  it('preview shows summary, diff, comment and error filter', async () => {
    mocked.preview.mockResolvedValue(report());
    render(<CatalogAdminPage />);
    pickFile();
    fireEvent.click(screen.getByText('Предпросмотр'));
    expect(await screen.findByText(/Обновится: 1, создастся: 1/)).toBeInTheDocument();
    expect(screen.getByText('2000')).toBeInTheDocument();
    expect(screen.getByText(/Комментарий: проверить/)).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('только с ошибками'));
    expect(screen.queryByText('2000')).not.toBeInTheDocument();
    expect(screen.getByText(/Год вне диапазона/)).toBeInTheDocument();
  });

  it('apply asks confirm and shows log id and link to artworks', async () => {
    mocked.preview.mockResolvedValue(report());
    mocked.apply.mockResolvedValue(report({ logId: 42 }));
    render(<CatalogAdminPage />);
    pickFile();
    fireEvent.click(screen.getByText('Предпросмотр'));
    fireEvent.click(await screen.findByText('Применить'));
    expect(await screen.findByText(/журнал № 42/)).toBeInTheDocument();
    expect(window.confirm).toHaveBeenCalled();
    expect(screen.getByText('Перейти к картинам')).toHaveAttribute('href', '/admin/artworks');
  });

  it('409 on apply shows busy message', async () => {
    mocked.preview.mockResolvedValue(report());
    mocked.apply.mockRejectedValue({ response: { status: 409 } });
    render(<CatalogAdminPage />);
    pickFile();
    fireEvent.click(screen.getByText('Предпросмотр'));
    fireEvent.click(await screen.findByText('Применить'));
    expect(await screen.findByText('Импорт уже выполняется. Подождите и повторите.')).toBeInTheDocument();
  });

  it('changing file resets previous preview', async () => {
    mocked.preview.mockResolvedValue(report());
    render(<CatalogAdminPage />);
    pickFile();
    fireEvent.click(screen.getByText('Предпросмотр'));
    await screen.findByText(/Обновится/);
    pickFile();
    await waitFor(() => expect(screen.queryByText(/Обновится/)).not.toBeInTheDocument());
  });

  it('rollback shows result, 404 shows nothing to roll back', async () => {
    mocked.rollback.mockResolvedValueOnce({ restoredFields: 3, deletedDrafts: 1, editedAfterImport: [9] });
    render(<CatalogAdminPage />);
    fireEvent.click(screen.getByText('Откатить последний импорт'));
    expect(await screen.findByText(/восстановлено полей 3, удалено черновиков 1/)).toBeInTheDocument();
    expect(screen.getByText(/правились после импорта\): 9/)).toBeInTheDocument();

    mocked.rollback.mockRejectedValueOnce({ response: { status: 404 } });
    fireEvent.click(screen.getByText('Откатить последний импорт'));
    expect(await screen.findByText('Откатывать нечего.')).toBeInTheDocument();
  });
});
