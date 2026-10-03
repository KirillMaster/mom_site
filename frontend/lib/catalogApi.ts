import { api } from './api';
import type { ImportReport, RollbackResult } from '../types/catalog';

const upload = async (file: File, dryRun: boolean) => {
  const form = new FormData();
  form.append('file', file);
  const response = await api.post<ImportReport>(`/admin/catalog/import?dryRun=${dryRun}`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const adminCatalog = {
  preview: (file: File) => upload(file, true),
  apply: (file: File) => upload(file, false),
  rollback: async () => (await api.post<RollbackResult>('/admin/catalog/import/rollback')).data,
};

export function catalogErrorMessage(error: unknown, fallback = 'Не получилось выполнить импорт. Попробуйте ещё раз.'): string {
  const res = (error as { response?: { status?: number; data?: { message?: string } } })?.response;
  if (res?.status === 413) return 'Файл слишком большой: допустимо не более 5 МБ.';
  if (res?.data?.message) return res.data.message;
  return fallback;
}

export const isImportBusy = (error: unknown): boolean =>
  (error as { response?: { status?: number } })?.response?.status === 409;

export const isNothingToRollback = (error: unknown): boolean =>
  (error as { response?: { status?: number } })?.response?.status === 404;
