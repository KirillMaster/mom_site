import { api } from './api';
import { adminCatalog, catalogErrorMessage, isImportBusy, isNothingToRollback } from './catalogApi';

jest.mock('./api', () => ({
  API_BASE_URL: 'http://api.test',
  api: { get: jest.fn(), post: jest.fn() },
}));

const post = api.post as jest.Mock;
const file = new File(['x'], 'c.xlsx');

describe('catalogApi', () => {
  beforeEach(() => jest.resetAllMocks());

  it('preview posts file with dryRun=true', async () => {
    post.mockResolvedValue({ data: { summary: {}, rows: [], logId: null } });
    await adminCatalog.preview(file);
    const [url, body] = post.mock.calls[0];
    expect(url).toBe('/admin/catalog/import?dryRun=true');
    expect((body as FormData).get('file')).toBe(file);
  });

  it('apply posts with dryRun=false and returns report', async () => {
    post.mockResolvedValue({ data: { logId: 7 } });
    expect((await adminCatalog.apply(file)).logId).toBe(7);
    expect(post.mock.calls[0][0]).toBe('/admin/catalog/import?dryRun=false');
  });

  it('rollback posts to rollback endpoint', async () => {
    post.mockResolvedValue({ data: { restoredFields: 2, deletedDrafts: 1, editedAfterImport: [] } });
    expect((await adminCatalog.rollback()).deletedDrafts).toBe(1);
    expect(post.mock.calls[0][0]).toBe('/admin/catalog/import/rollback');
  });

  it('maps errors to messages', () => {
    expect(catalogErrorMessage({ response: { status: 413 } })).toMatch(/5 МБ/);
    expect(catalogErrorMessage({ response: { status: 400, data: { message: 'Нужен .xlsx' } } })).toBe('Нужен .xlsx');
    expect(catalogErrorMessage(new Error('net'))).toMatch(/Не получилось/);
    expect(isImportBusy({ response: { status: 409 } })).toBe(true);
    expect(isNothingToRollback({ response: { status: 404 } })).toBe(true);
    expect(isNothingToRollback({ response: { status: 500 } })).toBe(false);
  });
});
