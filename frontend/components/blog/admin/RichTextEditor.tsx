'use client';

import { useEffect, useRef, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import LinkExtension from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import EditorToolbar from './EditorToolbar';
import { cleanPastedHtml, imageFilesFrom } from './cleanPastedHtml';
import { blogErrorMessage, uploadBlogImage } from '@/lib/blogApi';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  /** Подпись к вставленным фото (для поисковиков) — обычно заголовок новости. */
  imageAlt?: string;
}

const RichTextEditor = ({ value, onChange, imageAlt = '' }: RichTextEditorProps) => {
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const uploadRef = useRef<(files: File[], pos?: number) => void>(() => undefined);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2] },
        codeBlock: false,
        code: false,
        horizontalRule: false,
        strike: false,
        blockquote: false,
      }),
      LinkExtension.configure({ openOnClick: false, autolink: true }),
      Image.configure({ allowBase64: false }),
      Placeholder.configure({ placeholder: 'Начните писать новость…' }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: 'blog-body min-h-[300px] p-4 focus:outline-none text-lg',
        'aria-label': 'Текст новости',
      },
      transformPastedHTML: cleanPastedHtml,
      handlePaste: (_view, event) => {
        const files = imageFilesFrom(event.clipboardData?.files);
        if (!files.length) return false;
        uploadRef.current(files);
        return true;
      },
      handleDrop: (view, event) => {
        const files = imageFilesFrom((event as DragEvent).dataTransfer?.files);
        if (!files.length) return false;
        const pos = view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos;
        uploadRef.current(files, pos);
        return true;
      },
    },
    onUpdate: ({ editor: e }) => onChange(e.isEmpty ? '' : e.getHTML()),
  });

  uploadRef.current = async (files, pos) => {
    if (!editor) return;
    setError(null);
    for (const file of files) {
      try {
        setUploading(0);
        const src = await uploadBlogImage(file, setUploading);
        const chain = editor.chain().focus();
        (pos !== undefined ? chain.insertContentAt(pos, { type: 'image', attrs: { src, alt: imageAlt } }) : chain.setImage({ src, alt: imageAlt })).run();
      } catch (e) {
        setError(blogErrorMessage(e, 'Не получилось загрузить фото. Попробуйте другое или повторите позже.'));
      }
    }
    setUploading(null);
  };

  useEffect(() => {
    if (editor && value !== (editor.isEmpty ? '' : editor.getHTML())) {
      editor.commands.setContent(value || '', false);
    }
  }, [editor, value]);

  return (
    <div className="border border-gray-300 rounded-lg bg-white">
      <EditorToolbar editor={editor} onPickImage={() => fileInput.current?.click()} disabled={uploading !== null} />
      <input ref={fileInput} type="file" accept="image/*" multiple hidden data-testid="editor-image-input"
        onChange={(event) => {
          const files = imageFilesFrom(event.target.files);
          event.target.value = '';
          if (files.length) uploadRef.current(files);
        }} />
      {uploading !== null && (
        <p role="status" className="px-4 py-2 text-sm text-primary-700 bg-primary-50">
          Загружаем фото… {uploading > 0 ? `${uploading}%` : ''}
        </p>
      )}
      {error && <p role="alert" className="px-4 py-2 text-sm text-red-700 bg-red-50">{error}</p>}
      <EditorContent editor={editor} />
    </div>
  );
};

export default RichTextEditor;
