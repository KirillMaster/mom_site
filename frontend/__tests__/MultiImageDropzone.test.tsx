import { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MultiImageDropzone from '@/components/admin/MultiImageDropzone';

const img = (name: string, size = 1000, type = 'image/png') => {
  const f = new File(['x'], name, { type });
  Object.defineProperty(f, 'size', { value: size });
  return f;
};

const Harness = ({ existing = 0 }: { existing?: number }) => {
  const [files, setFiles] = useState<File[]>([]);
  return <MultiImageDropzone files={files} onChange={setFiles} existingCount={existing} />;
};

beforeAll(() => {
  (URL as any).createObjectURL = jest.fn(() => 'blob:preview');
  (URL as any).revokeObjectURL = jest.fn();
});

describe('@US1-AS1 мультивыбор и превью до сохранения', () => {
  it('shows previews for 3 selected files in order', () => {
    render(<Harness />);
    fireEvent.change(screen.getByLabelText('Выбрать фото'), { target: { files: [img('a.png'), img('b.png'), img('c.png')] } });
    expect(screen.getAllByTestId('queued-preview')).toHaveLength(3);
    expect(screen.getByAltText('Предпросмотр: a.png')).toBeInTheDocument();
  });

  it('accepts dropped files', () => {
    render(<Harness />);
    fireEvent.drop(screen.getByTestId('dropzone'), { dataTransfer: { files: [img('a.png'), img('b.png')] } });
    expect(screen.getAllByTestId('queued-preview')).toHaveLength(2);
  });

  it('removes a file from the queue', () => {
    render(<Harness />);
    fireEvent.change(screen.getByLabelText('Выбрать фото'), { target: { files: [img('a.png'), img('b.png')] } });
    fireEvent.click(screen.getByLabelText('Убрать из очереди a.png'));
    expect(screen.getAllByTestId('queued-preview')).toHaveLength(1);
  });
});

describe('@US1-AS5 лимит 10 фото', () => {
  it('rejects extra file with Russian message', () => {
    render(<Harness existing={10} />);
    fireEvent.change(screen.getByLabelText('Выбрать фото'), { target: { files: [img('extra.png')] } });
    expect(screen.getByRole('alert')).toHaveTextContent('не более 10 фото');
    expect(screen.queryByTestId('queued-preview')).toBeNull();
  });
});

describe('@US1-EC8 отклонённые файлы называются, допустимые не теряются', () => {
  it('names non-image and oversized files and keeps valid ones', () => {
    render(<Harness />);
    fireEvent.change(screen.getByLabelText('Выбрать фото'), {
      target: { files: [img('ok.png'), img('doc.txt', 10, 'text/plain'), img('huge.png', 16 * 1024 * 1024)] },
    });
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('«doc.txt» не добавлен: это не изображение');
    expect(alert).toHaveTextContent('«huge.png» не добавлен: размер больше 15 МБ');
    expect(screen.getAllByTestId('queued-preview')).toHaveLength(1);
  });
});
