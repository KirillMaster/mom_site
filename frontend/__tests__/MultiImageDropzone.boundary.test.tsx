import { render, screen, fireEvent } from '@testing-library/react';
import { useState } from 'react';
import MultiImageDropzone from '@/components/admin/MultiImageDropzone';

const img = (name: string, size = 1000, type = 'image/png') => {
  const f = new File(['x'], name, { type });
  Object.defineProperty(f, 'size', { value: size });
  return f;
};

const Harness = ({ existing = 0, disabled = false }: { existing?: number; disabled?: boolean }) => {
  const [files, setFiles] = useState<File[]>([]);
  return <MultiImageDropzone files={files} onChange={setFiles} existingCount={existing} disabled={disabled} />;
};

beforeAll(() => {
  (URL as any).createObjectURL = jest.fn(() => 'blob:preview');
  (URL as any).revokeObjectURL = jest.fn();
});

describe('@US1-AS5 граница лимита с существующими', () => {
  it('accepts files when existing + new < 10', () => {
    render(<Harness existing={7} />);
    fireEvent.change(screen.getByLabelText('Выбрать фото'), {
      target: { files: [img('a.png'), img('b.png')] },
    });
    expect(screen.getAllByTestId('queued-preview')).toHaveLength(2);
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('accepts exactly enough files to reach 10 total', () => {
    render(<Harness existing={8} />);
    fireEvent.change(screen.getByLabelText('Выбрать фото'), {
      target: { files: [img('x.png'), img('y.png')] },
    });
    expect(screen.getAllByTestId('queued-preview')).toHaveLength(2);
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('rejects files when existing equals 10', () => {
    render(<Harness existing={10} />);
    fireEvent.change(screen.getByLabelText('Выбрать фото'), {
      target: { files: [img('reject.png')] },
    });
    expect(screen.queryByTestId('queued-preview')).toBeNull();
    expect(screen.getByRole('alert')).toHaveTextContent('не более 10 фото');
  });

  it('rejects partial batch when limit crossed', () => {
    render(<Harness existing={9} />);
    fireEvent.change(screen.getByLabelText('Выбрать фото'), {
      target: { files: [img('ok.png'), img('bad.png'), img('bad2.png')] },
    });
    expect(screen.getAllByTestId('queued-preview')).toHaveLength(1);
    expect(screen.getByRole('alert')).toHaveTextContent('«bad.png», «bad2.png»');
  });

  it('considers already-queued files in existing count', () => {
    const { rerender } = render(<Harness existing={9} />);
    fireEvent.change(screen.getByLabelText('Выбрать фото'), {
      target: { files: [img('first.png')] },
    });
    expect(screen.getAllByTestId('queued-preview')).toHaveLength(1);

    // Now add more files - existing (9) + queued (1) = 10, so next should be rejected
    fireEvent.change(screen.getByLabelText('Выбрать фото'), {
      target: { files: [img('second.png')] },
    });
    expect(screen.getAllByTestId('queued-preview')).toHaveLength(1);
    expect(screen.getByRole('alert')).toHaveTextContent('«second.png»');
  });
});

describe('@US1-AS5 граница размера файла', () => {
  it('accepts file at exactly 15 MB', () => {
    render(<Harness />);
    fireEvent.change(screen.getByLabelText('Выбрать фото'), {
      target: { files: [img('exact.png', 15 * 1024 * 1024)] },
    });
    expect(screen.getAllByTestId('queued-preview')).toHaveLength(1);
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('rejects file at 15 MB + 1 byte', () => {
    render(<Harness />);
    fireEvent.change(screen.getByLabelText('Выбрать фото'), {
      target: { files: [img('oversized.png', 15 * 1024 * 1024 + 1)] },
    });
    expect(screen.queryByTestId('queued-preview')).toBeNull();
    expect(screen.getByRole('alert')).toHaveTextContent('размер больше 15 МБ');
  });

  it('accepts very small file (0 bytes)', () => {
    render(<Harness />);
    fireEvent.change(screen.getByLabelText('Выбрать фото'), {
      target: { files: [img('tiny.png', 0)] },
    });
    expect(screen.getAllByTestId('queued-preview')).toHaveLength(1);
  });

  it('accepts 1-byte file', () => {
    render(<Harness />);
    fireEvent.change(screen.getByLabelText('Выбрать фото'), {
      target: { files: [img('minimal.png', 1)] },
    });
    expect(screen.getAllByTestId('queued-preview')).toHaveLength(1);
  });

  it('mixes oversized and valid files correctly', () => {
    render(<Harness />);
    fireEvent.change(screen.getByLabelText('Выбрать фото'), {
      target: {
        files: [
          img('ok1.png', 1000),
          img('huge.png', 20 * 1024 * 1024),
          img('ok2.png', 1000),
        ],
      },
    });
    expect(screen.getAllByTestId('queued-preview')).toHaveLength(2);
    expect(screen.getByRole('alert')).toHaveTextContent('«huge.png»');
  });
});

describe('@US1-AS6 тип файла граничные случаи', () => {
  it('rejects empty MIME type', () => {
    render(<Harness />);
    fireEvent.change(screen.getByLabelText('Выбрать фото'), {
      target: { files: [img('noext', 1000, '')] },
    });
    expect(screen.queryByTestId('queued-preview')).toBeNull();
    expect(screen.getByRole('alert')).toHaveTextContent('не добавлен: это не изображение');
  });

  it('accepts image/webp', () => {
    render(<Harness />);
    fireEvent.change(screen.getByLabelText('Выбрать фото'), {
      target: { files: [img('photo.webp', 1000, 'image/webp')] },
    });
    expect(screen.getAllByTestId('queued-preview')).toHaveLength(1);
  });

  it('rejects text/plain despite filename.png', () => {
    render(<Harness />);
    const f = new File(['fake'], 'fake.png', { type: 'text/plain' });
    fireEvent.change(screen.getByLabelText('Выбрать фото'), {
      target: { files: [f] },
    });
    expect(screen.queryByTestId('queued-preview')).toBeNull();
    expect(screen.getByRole('alert')).toHaveTextContent('не добавлен: это не изображение');
  });
});

describe('@US1 drop zone disabled state', () => {
  it('does not accept drop when disabled', () => {
    render(<Harness disabled={true} />);
    fireEvent.drop(screen.getByTestId('dropzone'), {
      dataTransfer: { files: [img('test.png')] },
    });
    expect(screen.queryByTestId('queued-preview')).toBeNull();
  });

  it('still shows drag-over state when disabled but does not accept', () => {
    render(<Harness disabled={true} />);
    fireEvent.dragOver(screen.getByTestId('dropzone'));
    // Component prevents drop in handleDrop
    fireEvent.drop(screen.getByTestId('dropzone'), {
      dataTransfer: { files: [img('test.png')] },
    });
    expect(screen.queryByTestId('queued-preview')).toBeNull();
  });

  it('input is disabled attribute propagates', () => {
    render(<Harness disabled={true} />);
    const input = screen.getByLabelText('Выбрать фото') as HTMLInputElement;
    expect(input.disabled).toBe(true);
  });
});

describe('@US1 error state clearing', () => {
  it('clears errors when valid files are added after errors', () => {
    render(<Harness />);
    // First: add invalid file
    fireEvent.change(screen.getByLabelText('Выбрать фото'), {
      target: { files: [img('bad.txt', 1000, 'text/plain')] },
    });
    expect(screen.getByRole('alert')).toBeInTheDocument();

    // Then: add valid file
    fireEvent.change(screen.getByLabelText('Выбрать фото'), {
      target: { files: [img('good.png')] },
    });
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getAllByTestId('queued-preview')).toHaveLength(1);
  });

  it('shows new errors replacing old ones', () => {
    render(<Harness />);
    fireEvent.change(screen.getByLabelText('Выбрать фото'), {
      target: { files: [img('bad.txt', 1000, 'text/plain')] },
    });
    expect(screen.getByRole('alert')).toHaveTextContent('не добавлен: это не изображение');

    fireEvent.change(screen.getByLabelText('Выбрать фото'), {
      target: { files: [img('huge.png', 20 * 1024 * 1024)] },
    });
    expect(screen.getByRole('alert')).toHaveTextContent('размер больше 15 МБ');
    expect(screen.queryByText('не добавлен: это не изображение')).toBeNull();
  });
});

describe('@US1-AS1 preview lifecycle', () => {
  it('removes preview when file is removed from queue', () => {
    render(<Harness />);
    fireEvent.change(screen.getByLabelText('Выбрать фото'), {
      target: { files: [img('a.png'), img('b.png')] },
    });
    expect(screen.getAllByTestId('queued-preview')).toHaveLength(2);

    fireEvent.click(screen.getByLabelText('Убрать из очереди a.png'));
    expect(screen.getAllByTestId('queued-preview')).toHaveLength(1);
    expect(screen.getByAltText('Предпросмотр: b.png')).toBeInTheDocument();
  });

  it('handles removing all files', () => {
    render(<Harness />);
    fireEvent.change(screen.getByLabelText('Выбрать фото'), {
      target: { files: [img('only.png')] },
    });
    fireEvent.click(screen.getByLabelText('Убрать из очереди only.png'));
    expect(screen.queryByTestId('queued-preview')).toBeNull();
  });

  it('maintains correct preview order after removal', () => {
    render(<Harness />);
    fireEvent.change(screen.getByLabelText('Выбрать фото'), {
      target: { files: [img('a.png'), img('b.png'), img('c.png')] },
    });
    fireEvent.click(screen.getByLabelText('Убрать из очереди b.png'));

    const previews = screen.getAllByAltText(/^Предпросмотр:/);
    expect(previews[0]).toHaveAttribute('alt', 'Предпросмотр: a.png');
    expect(previews[1]).toHaveAttribute('alt', 'Предпросмотр: c.png');
  });
});

describe('@US1-AS5 multiple file selections', () => {
  it('appends validated files to existing queue', () => {
    render(<Harness />);
    fireEvent.change(screen.getByLabelText('Выбрать фото'), {
      target: { files: [img('first.png')] },
    });
    expect(screen.getAllByTestId('queued-preview')).toHaveLength(1);

    // Select again (different files) - appends to queue via addFiles
    fireEvent.change(screen.getByLabelText('Выбрать фото'), {
      target: { files: [img('second.png'), img('third.png')] },
    });
    // Harness maintains state, so new files are added
    expect(screen.getAllByTestId('queued-preview')).toHaveLength(3);
  });
});

describe('@US1 empty and boundary file lists', () => {
  it('renders with no files initially', () => {
    render(<Harness />);
    expect(screen.queryByTestId('queued-preview')).toBeNull();
  });

  it('handles FileList with single file', () => {
    render(<Harness />);
    fireEvent.change(screen.getByLabelText('Выбрать фото'), {
      target: { files: [img('solo.png')] },
    });
    expect(screen.getByAltText('Предпросмотр: solo.png')).toBeInTheDocument();
  });

  it('handles existing at 0 explicitly', () => {
    render(<Harness existing={0} />);
    fireEvent.change(screen.getByLabelText('Выбрать фото'), {
      target: { files: Array.from({ length: 10 }, (_, i) => img(`img${i}.png`)) },
    });
    expect(screen.getAllByTestId('queued-preview')).toHaveLength(10);
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
