'use client';

import type { Editor } from '@tiptap/react';
import type { LucideIcon } from 'lucide-react';
import { Bold, Heading2, ImagePlus, Italic, Link, List, Undo2 } from 'lucide-react';

interface EditorToolbarProps {
  editor: Editor | null;
  onPickImage: () => void;
  disabled?: boolean;
}

interface ToolbarButton {
  label: string;
  hint: string;
  icon: LucideIcon;
  run: (editor: Editor) => void;
  active?: (editor: Editor) => boolean;
}

export function toggleLink(editor: Editor) {
  if (editor.isActive('link')) {
    editor.chain().focus().unsetLink().run();
    return;
  }
  const input = window.prompt('Вставьте адрес ссылки, например https://vk.com/…');
  if (!input) return;
  const href = /^(https?:|mailto:|tel:|\/)/i.test(input.trim()) ? input.trim() : `https://${input.trim()}`;
  if (editor.state.selection.empty) {
    editor.chain().focus().insertContent({ type: 'text', text: href, marks: [{ type: 'link', attrs: { href } }] }).run();
  } else {
    editor.chain().focus().setLink({ href }).run();
  }
}

const EditorToolbar = ({ editor, onPickImage, disabled }: EditorToolbarProps) => {
  const buttons: ToolbarButton[] = [
    { label: 'Жирный', hint: 'Выделите слова и нажмите', icon: Bold,
      run: (e) => e.chain().focus().toggleBold().run(), active: (e) => e.isActive('bold') },
    { label: 'Курсив', hint: 'Наклонный текст', icon: Italic,
      run: (e) => e.chain().focus().toggleItalic().run(), active: (e) => e.isActive('italic') },
    { label: 'Подзаголовок', hint: 'Крупная строка-заголовок', icon: Heading2,
      run: (e) => e.chain().focus().toggleHeading({ level: 2 }).run(), active: (e) => e.isActive('heading', { level: 2 }) },
    { label: 'Список', hint: 'Пункты с точками', icon: List,
      run: (e) => e.chain().focus().toggleBulletList().run(), active: (e) => e.isActive('bulletList') },
    { label: 'Ссылка', hint: 'Сделать слова ссылкой', icon: Link, run: toggleLink, active: (e) => e.isActive('link') },
    { label: 'Фото', hint: 'Добавить фотографию в текст', icon: ImagePlus, run: () => onPickImage() },
    { label: 'Отменить', hint: 'Вернуть как было', icon: Undo2, run: (e) => e.chain().focus().undo().run() },
  ];

  return (
    <div role="toolbar" aria-label="Оформление текста"
      className="grid grid-cols-4 sm:flex sm:flex-wrap gap-2 p-2 border-b border-gray-200 bg-gray-50 rounded-t-lg">
      {buttons.map(({ label, hint, icon: Icon, run, active }) => {
        const isActive = !!editor && !!active?.(editor);
        return (
          <button key={label} type="button" title={hint} aria-pressed={active ? isActive : undefined}
            disabled={disabled || !editor} onClick={() => editor && run(editor)}
            className={`min-h-[44px] min-w-[44px] flex flex-col sm:flex-row items-center justify-center gap-1 px-3 py-2 rounded-md text-sm border transition-colors disabled:opacity-50 ${
              isActive ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-100'
            }`}>
            <Icon className="w-5 h-5" aria-hidden="true" />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default EditorToolbar;
