'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { BlogCategory, BlogFieldErrors } from '@/types/blog';
import { adminBlog, blogErrorMessage } from '@/lib/blogApi';
import {
  EMPTY_POST_FORM, STATUS_LABELS, fromAdmin, publishHints, requiredErrors, statusAt, toSave, withTitle,
  type PostForm,
} from '@/lib/blogForm';
import { useDraftAutosave } from '@/hooks/useDraftAutosave';
import CoverUpload from './CoverUpload';
import AdvancedFields from './AdvancedFields';
import PublishBar from './PublishBar';
import PostPreview from './PostPreview';

const RichTextEditor = dynamic(() => import('./RichTextEditor'), {
  ssr: false,
  loading: () => <div className="min-h-[300px] border rounded bg-white p-4 text-gray-400">Загружаем редактор…</div>,
});

interface PostEditorProps {
  /** null — новая новость. */
  postId: number | null;
}

type ErrorResponse = { response?: { status?: number; data?: { errors?: BlogFieldErrors } } };

export default function PostEditor({ postId }: PostEditorProps) {
  const router = useRouter();
  const [form, setForm] = useState<PostForm>(EMPTY_POST_FORM);
  const [savedPublishedAt, setSavedPublishedAt] = useState<string | null>(null);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loaded, setLoaded] = useState(postId === null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hints, setHints] = useState<string[] | null>(null);
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [failure, setFailure] = useState('');
  const draft = useDraftAutosave(`blog-draft:${postId ?? 'new'}`, form, loaded);

  const savedStatus = statusAt(savedPublishedAt);
  const slugLocked = savedStatus === 'Published';

  useEffect(() => {
    adminBlog.categories().then(setCategories).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    if (postId === null) return;
    adminBlog.get(postId)
      .then((post) => {
        setForm(fromAdmin(post));
        setSavedPublishedAt(post.publishedAt ?? null);
        setLoaded(true);
      })
      .catch((e) => setFailure(blogErrorMessage(e, 'Не получилось открыть новость.')));
  }, [postId]);

  const patch = (changes: Partial<PostForm>) => setForm((f) => ({ ...f, ...changes }));

  const save = async (publishedAt: string | null, done: string) => {
    const missing = requiredErrors(form);
    setErrors(missing);
    setHints(null);
    if (Object.keys(missing).length) return;
    setBusy(true);
    setFailure('');
    setNotice('');
    try {
      const body = toSave(form, publishedAt);
      const saved = postId === null ? await adminBlog.create(body) : await adminBlog.update(postId, body);
      draft.clear();
      setForm(fromAdmin(saved));
      setSavedPublishedAt(saved.publishedAt ?? null);
      setNotice(done);
      if (postId === null) router.replace(`/admin/blog/${saved.id}`);
    } catch (e) {
      const fieldErrors = (e as ErrorResponse).response?.data?.errors;
      if (fieldErrors) setErrors(fieldErrors);
      setFailure(blogErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const publishNow = () => save(form.publishedAt ?? new Date().toISOString(), 'Новость опубликована.');

  const publish = () => {
    const missing = requiredErrors(form);
    if (Object.keys(missing).length) return setErrors(missing);
    const found = publishHints(form);
    if (found.length) setHints(found);
    else publishNow();
  };

  if (!loaded) {
    return failure
      ? <p role="alert" className="text-red-600">{failure}</p>
      : <p className="text-gray-500">Открываем новость…</p>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4 pb-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link href="/admin/blog" className="text-amber-700 min-h-[44px] inline-flex items-center">← Все новости</Link>
        <span className="text-sm text-gray-600">Статус: {STATUS_LABELS[savedStatus]}</span>
      </div>

      {draft.restorable && (
        <div role="status" className="card bg-amber-50 p-3 flex flex-wrap items-center gap-2">
          <span className="flex-1">Есть несохранённый текст с прошлого раза. Восстановить?</span>
          <button type="button" className="btn-primary min-h-[44px]"
            onClick={() => { setForm(draft.restorable as PostForm); draft.accept(); }}>
            Восстановить
          </button>
          <button type="button" className="btn-secondary min-h-[44px]" onClick={draft.dismiss}>Не нужно</button>
        </div>
      )}

      <div>
        <label htmlFor="post-title" className="block text-sm font-medium text-gray-700 mb-1">Заголовок</label>
        <input
          id="post-title"
          className="w-full border rounded px-3 py-2 text-xl min-h-[44px]"
          value={form.title}
          placeholder="Например: Приглашаю на выставку"
          onChange={(e) => setForm((f) => withTitle(f, e.target.value, slugLocked))}
        />
        {errors.title && <p role="alert" className="text-sm text-red-600 mt-1">{errors.title}</p>}
      </div>

      <CoverUpload imagePath={form.coverImagePath} onChange={(coverImagePath) => patch({ coverImagePath })} />

      <div>
        <span className="block text-sm font-medium text-gray-700 mb-1">Текст новости</span>
        <RichTextEditor value={form.bodyHtml} onChange={(bodyHtml) => patch({ bodyHtml })} imageAlt={form.title} />
        {errors.bodyHtml && <p role="alert" className="text-sm text-red-600 mt-1">{errors.bodyHtml}</p>}
      </div>

      <AdvancedFields form={form} categories={categories} slugLocked={slugLocked} errors={errors} onChange={patch} />

      {notice && <p role="status" className="text-green-700">{notice}</p>}
      {failure && <p role="alert" className="text-red-600">{failure}</p>}

      <PublishBar
        busy={busy}
        isPublished={savedStatus !== 'Draft'}
        hints={hints}
        onSaveDraft={() => save(form.publishedAt, 'Сохранено.')}
        onPreview={() => setPreview(true)}
        onPublish={publish}
        onPublishAnyway={publishNow}
        onCancelHints={() => setHints(null)}
      />

      {preview && <PostPreview form={form} onClose={() => setPreview(false)} />}
    </div>
  );
}
