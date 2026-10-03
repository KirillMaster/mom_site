'use client';

import { useState } from 'react';
import Link from 'next/link';
import AdminAuthGuard from '@/components/AdminAuthGuard';
import CatalogDiffTable from '@/components/admin/CatalogDiffTable';
import { adminCatalog, catalogErrorMessage, isImportBusy, isNothingToRollback } from '@/lib/catalogApi';
import type { ImportReport, RollbackResult } from '@/types/catalog';

const CatalogContent = () => {
  const [file, setFile] = useState<File | null>(null);
  const [report, setReport] = useState<ImportReport | null>(null);
  const [applied, setApplied] = useState<ImportReport | null>(null);
  const [rolledBack, setRolledBack] = useState<RollbackResult | null>(null);
  const [onlyErrors, setOnlyErrors] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const reset = () => { setReport(null); setApplied(null); setRolledBack(null); setError(''); };

  const run = async (action: () => Promise<void>, fallback: string, nothingText?: string) => {
    setBusy(true);
    setError('');
    try {
      await action();
    } catch (e) {
      if (isImportBusy(e)) setError('Импорт уже выполняется. Подождите и повторите.');
      else if (nothingText && isNothingToRollback(e)) setError(nothingText);
      else setError(catalogErrorMessage(e, fallback));
    } finally {
      setBusy(false);
    }
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    reset();
    setFile(e.target.files?.[0] ?? null);
  };

  const preview = () => {
    if (!file) return;
    return run(async () => { setApplied(null); setReport(await adminCatalog.preview(file)); }, 'Не получилось построить предпросмотр.');
  };

  const apply = () => {
    if (!file || !window.confirm('Применить изменения к каталогу?')) return;
    return run(async () => { setApplied(await adminCatalog.apply(file)); setReport(null); }, 'Не получилось применить импорт.');
  };

  const rollback = () => {
    if (!window.confirm('Откатить последний импорт?')) return;
    return run(async () => { reset(); setRolledBack(await adminCatalog.rollback()); }, 'Не получилось откатить импорт.', 'Откатывать нечего.');
  };

  const s = report?.summary;
  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <h1 className="text-2xl font-serif font-bold">Импорт каталога</h1>
      <p className="text-sm text-gray-600">Пустая ячейка не меняет значение, «-» очищает его. Файл .xlsx до 5 МБ, до 2000 строк.</p>
      <input type="file" aria-label="Файл каталога" accept=".xlsx" onChange={onFile} />
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-secondary" disabled={!file || busy} onClick={preview}>Предпросмотр</button>
        <button type="button" className="btn-secondary" disabled={busy} onClick={rollback}>Откатить последний импорт</button>
      </div>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

      {report && s && (
        <section className="space-y-3">
          {s.templateVersionMismatch && (
            <p className="text-sm text-amber-700">Версия шаблона отличается от текущей: проверьте названия колонок.</p>
          )}
          <p>
            Обновится: {s.updated}, создастся: {s.created}, без изменений: {s.skipped}, предупреждений: {s.warnings}, ошибок: {s.errors}
          </p>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={onlyErrors} onChange={(e) => setOnlyErrors(e.target.checked)} />
            только с ошибками
          </label>
          <CatalogDiffTable rows={report.rows} onlyErrors={onlyErrors} />
          <button type="button" className="btn-primary" disabled={busy || s.updated + s.created === 0} onClick={apply}>Применить</button>
        </section>
      )}

      {applied && (
        <p role="status" className="card bg-white p-4">
          Импорт выполнен (журнал № {applied.logId ?? '—'}). Создано черновиков: {applied.summary.created}.{' '}
          <Link href="/admin/artworks" className="text-indigo-600 underline">Перейти к картинам</Link>
        </p>
      )}

      {rolledBack && (
        <p role="status" className="card bg-white p-4">
          Откат выполнен: восстановлено полей {rolledBack.restoredFields}, удалено черновиков {rolledBack.deletedDrafts}.
          {rolledBack.editedAfterImport.length > 0 &&
            ` Не тронуты (правились после импорта): ${rolledBack.editedAfterImport.join(', ')}.`}
        </p>
      )}
    </div>
  );
};

const CatalogAdminPage = () => (
  <AdminAuthGuard>
    <div className="min-h-screen bg-gray-50 p-3 sm:p-8">
      <CatalogContent />
    </div>
  </AdminAuthGuard>
);

export default CatalogAdminPage;
