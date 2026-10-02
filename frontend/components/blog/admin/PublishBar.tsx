'use client';

interface PublishBarProps {
  busy: boolean;
  isPublished: boolean;
  hints: string[] | null;
  onSaveDraft: () => void;
  onPreview: () => void;
  onPublish: () => void;
  onPublishAnyway: () => void;
  onCancelHints: () => void;
}

export default function PublishBar(props: PublishBarProps) {
  const { busy, isPublished, hints } = props;
  return (
    <div className="sticky bottom-0 z-10 bg-white border-t p-3 sm:static sm:border sm:rounded">
      {hints && hints.length > 0 && (
        <div role="dialog" aria-label="Проверка перед публикацией" className="mb-3 text-sm">
          <ul className="list-disc pl-5 text-amber-800 mb-2">
            {hints.map((h) => <li key={h}>{h}</li>)}
          </ul>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-primary min-h-[44px]" disabled={busy} onClick={props.onPublishAnyway}>
              Опубликовать всё равно
            </button>
            <button type="button" className="btn-secondary min-h-[44px]" onClick={props.onCancelHints}>
              Вернуться
            </button>
          </div>
        </div>
      )}
      <div className="grid grid-cols-3 gap-2 sm:flex sm:justify-end">
        <button type="button" className="btn-secondary min-h-[44px]" disabled={busy} onClick={props.onSaveDraft}>
          {isPublished ? 'Сохранить' : 'Сохранить черновик'}
        </button>
        <button type="button" className="btn-secondary min-h-[44px]" onClick={props.onPreview}>
          Предпросмотр
        </button>
        {!isPublished && (
          <button type="button" className="btn-primary min-h-[44px]" disabled={busy} onClick={props.onPublish}>
            Опубликовать
          </button>
        )}
      </div>
    </div>
  );
}
