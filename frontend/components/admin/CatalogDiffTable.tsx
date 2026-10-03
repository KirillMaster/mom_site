import type { RowReport } from '@/types/catalog';

interface Props {
  rows: RowReport[];
  onlyErrors: boolean;
}

const hasError = (r: RowReport) => r.issues.some((i) => i.level === 'error');
const show = (v: string | null) => (v === null || v === '' ? '—' : v);

const CatalogDiffTable = ({ rows, onlyErrors }: Props) => {
  const visible = onlyErrors ? rows.filter(hasError) : rows;
  if (visible.length === 0) return <p className="text-sm text-gray-600">Нет строк для показа.</p>;
  return (
    <ul className="space-y-3">
      {visible.map((r) => (
        <li key={`${r.sheet}-${r.row}`} className={`card bg-white p-3 ${hasError(r) ? 'border border-red-300' : ''}`}>
          <p className="font-medium">
            {r.sheet}, строка {r.row}: {r.title || `ID ${r.id ?? '—'}`}
            {r.id === null && <span className="ml-2 text-xs text-green-700">новая (черновик)</span>}
          </p>
          {r.comment && <p className="text-sm text-gray-600">Комментарий: {r.comment}</p>}
          {r.changes.length > 0 && (
            <table className="mt-2 w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="pr-2">Поле</th><th className="pr-2">Было</th><th>Станет</th>
                </tr>
              </thead>
              <tbody>
                {r.changes.map((c) => (
                  <tr key={c.field}>
                    <td className="pr-2">{c.field}</td>
                    <td className="pr-2 text-red-700">{show(c.old)}</td>
                    <td className="text-green-700">{show(c.new)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {r.issues.map((i, k) => (
            <p key={k} className={`mt-1 text-sm ${i.level === 'error' ? 'text-red-600' : 'text-amber-700'}`}>
              {i.level === 'error' ? 'Ошибка' : 'Предупреждение'} ({i.column}): {i.message}
            </p>
          ))}
        </li>
      ))}
    </ul>
  );
};

export default CatalogDiffTable;
