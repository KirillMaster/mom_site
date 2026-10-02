import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ArtworkForm from '@/components/admin/ArtworkForm';
import { uploadArtworkImages } from '@/lib/artworkImagesApi';

const createMutateAsync = jest.fn();
const updateMutateAsync = jest.fn();
jest.mock('@/hooks/useApi', () => ({
  getImageUrl: (p: string) => p,
  useCreateArtwork: () => ({ mutateAsync: createMutateAsync, isPending: false }),
  useUpdateArtwork: () => ({ mutateAsync: updateMutateAsync, isPending: false }),
}));
jest.mock('@/lib/artworkImagesApi');
jest.mock('@/components/LoadingSpinner', () => () => null);

const upload = uploadArtworkImages as jest.Mock;
const file = (n: string) => new File(['x'], n, { type: 'image/png' });
const cats = [{ id: 1, name: 'Пейзаж' }];
const artwork = { id: 5, title: 'T', categoryId: 1, isForSale: true, images: [{ id: 1, imagePath: 'a', thumbnailPath: 'a', sortOrder: 0 }] };

beforeAll(() => {
  (URL as any).createObjectURL = jest.fn(() => 'blob:x');
  (URL as any).revokeObjectURL = jest.fn();
});
beforeEach(() => jest.clearAllMocks());

const pick = (files: File[]) => fireEvent.change(screen.getByLabelText('Выбрать фото'), { target: { files } });

describe('@US1-AS1 мультизагрузка при редактировании', () => {
  it('uploads all queued files in order after update', async () => {
    updateMutateAsync.mockResolvedValue({});
    upload.mockResolvedValue([]);
    const onSaved = jest.fn();
    render(<ArtworkForm artwork={artwork} categories={cats} onSaved={onSaved} />);
    const [a, b, c] = [file('a.png'), file('b.png'), file('c.png')];
    pick([a, b, c]);
    expect(screen.getAllByTestId('queued-preview')).toHaveLength(3);
    fireEvent.click(screen.getByText('Сохранить изменения'));
    await waitFor(() => expect(upload).toHaveBeenCalledWith(5, [a, b, c]));
    expect(onSaved).toHaveBeenCalled();
  });
});

describe('@US1-EC9 создание работы с несколькими фото', () => {
  it('first file becomes the cover, others uploaded after create', async () => {
    createMutateAsync.mockResolvedValue({ id: 9 });
    upload.mockResolvedValue([]);
    render(<ArtworkForm artwork={null} categories={cats} onSaved={jest.fn()} />);
    fireEvent.change(screen.getByLabelText('Название'), { target: { value: 'Новая' } });
    fireEvent.change(screen.getByLabelText('Категория'), { target: { value: '1' } });
    const [a, b, c] = [file('a.png'), file('b.png'), file('c.png')];
    pick([a, b, c]);
    fireEvent.click(screen.getByText('Добавить картину'));
    await waitFor(() => expect(upload).toHaveBeenCalledWith(9, [b, c]));
    const fd: FormData = createMutateAsync.mock.calls[0][0];
    expect(fd.get('image')).toBe(a);
  });

  it('requires at least one photo on create', async () => {
    render(<ArtworkForm artwork={null} categories={cats} onSaved={jest.fn()} />);
    fireEvent.change(screen.getByLabelText('Название'), { target: { value: 'Новая' } });
    fireEvent.change(screen.getByLabelText('Категория'), { target: { value: '1' } });
    fireEvent.click(screen.getByText('Добавить картину'));
    expect(await screen.findByRole('alert')).toHaveTextContent('хотя бы одно фото');
    expect(createMutateAsync).not.toHaveBeenCalled();
  });
});

describe('@US1-EC8 ошибка сохранения показывается', () => {
  it('shows server message and does not close', async () => {
    updateMutateAsync.mockResolvedValue({});
    upload.mockRejectedValue({ response: { data: 'Файл «x.png» слишком большой' } });
    const onSaved = jest.fn();
    render(<ArtworkForm artwork={artwork} categories={cats} onSaved={onSaved} />);
    pick([file('x.png')]);
    fireEvent.click(screen.getByText('Сохранить изменения'));
    expect(await screen.findByText('Файл «x.png» слишком большой')).toBeInTheDocument();
    expect(onSaved).not.toHaveBeenCalled();
  });
});

describe('@US1-AS5 лимит с учётом уже сохранённых', () => {
  it('counts existing photos towards the 10 limit', () => {
    const full = { ...artwork, images: Array.from({ length: 10 }, (_, i) => ({ id: i + 1, imagePath: 'a', thumbnailPath: 'a', sortOrder: i })) };
    render(<ArtworkForm artwork={full} categories={cats} onSaved={jest.fn()} />);
    pick([file('extra.png')]);
    expect(screen.getByRole('alert')).toHaveTextContent('не более 10 фото');
  });
});

describe('@US1-EC8 повтор после частичного сбоя создания', () => {
  it('does not create the artwork twice on retry', async () => {
    createMutateAsync.mockResolvedValue({ id: 9 });
    upload.mockRejectedValueOnce(new Error('net')).mockResolvedValueOnce([]);
    const onSaved = jest.fn();
    render(<ArtworkForm artwork={null} categories={cats} onSaved={onSaved} />);
    fireEvent.change(screen.getByLabelText('Название'), { target: { value: 'Новая' } });
    fireEvent.change(screen.getByLabelText('Категория'), { target: { value: '1' } });
    const [a, b] = [file('a.png'), file('b.png')];
    pick([a, b]);
    fireEvent.click(screen.getByText('Добавить картину'));
    expect(await screen.findByRole('alert')).toHaveTextContent('Работа создана');
    fireEvent.click(screen.getByText('Добавить картину'));
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(createMutateAsync).toHaveBeenCalledTimes(1);
    expect(upload).toHaveBeenLastCalledWith(9, [b]);
  });
});

describe('@US1-BE4 admin form sends the catalog characteristics', () => {
  it('puts size, technique, support, year and status into the payload', async () => {
    createMutateAsync.mockResolvedValue({ id: 9 });
    upload.mockResolvedValue([]);
    render(<ArtworkForm artwork={null} categories={cats} onSaved={jest.fn()} />);
    fireEvent.change(screen.getByLabelText('Название'), { target: { value: 'Новая' } });
    fireEvent.change(screen.getByLabelText('Категория'), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText('Ширина (см)'), { target: { value: '60' } });
    fireEvent.change(screen.getByLabelText('Высота (см)'), { target: { value: '80' } });
    fireEvent.change(screen.getByLabelText('Год'), { target: { value: '2024' } });
    fireEvent.change(screen.getByLabelText('Основа'), { target: { value: 'холст' } });
    fireEvent.change(screen.getByLabelText('Техника'), { target: { value: 'масло' } });
    fireEvent.change(screen.getByLabelText('Статус'), { target: { value: 'Sold' } });
    pick([file('a.png')]);
    fireEvent.click(screen.getByText('Добавить картину'));
    await waitFor(() => expect(createMutateAsync).toHaveBeenCalled());
    const fd: FormData = createMutateAsync.mock.calls[0][0];
    expect(fd.get('widthCm')).toBe('60');
    expect(fd.get('heightCm')).toBe('80');
    expect(fd.get('year')).toBe('2024');
    expect(fd.get('support')).toBe('холст');
    expect(fd.get('technique')).toBe('масло');
    expect(fd.get('status')).toBe('Sold');
  });
});

describe('@US1-EC10 spec field boundaries in admin form', () => {
  it('accepts width at minimum boundary (1)', async () => {
    createMutateAsync.mockResolvedValue({ id: 9 });
    upload.mockResolvedValue([]);
    render(<ArtworkForm artwork={null} categories={cats} onSaved={jest.fn()} />);
    fireEvent.change(screen.getByLabelText('Название'), { target: { value: 'Новая' } });
    fireEvent.change(screen.getByLabelText('Категория'), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText('Ширина (см)'), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText('Высота (см)'), { target: { value: '100' } });
    pick([file('a.png')]);
    fireEvent.click(screen.getByText('Добавить картину'));
    await waitFor(() => expect(createMutateAsync).toHaveBeenCalled());
    const fd: FormData = createMutateAsync.mock.calls[0][0];
    expect(fd.get('widthCm')).toBe('1');
  });

  it('accepts height at maximum boundary (1000)', async () => {
    createMutateAsync.mockResolvedValue({ id: 9 });
    upload.mockResolvedValue([]);
    render(<ArtworkForm artwork={null} categories={cats} onSaved={jest.fn()} />);
    fireEvent.change(screen.getByLabelText('Название'), { target: { value: 'Новая' } });
    fireEvent.change(screen.getByLabelText('Категория'), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText('Ширина (см)'), { target: { value: '100' } });
    fireEvent.change(screen.getByLabelText('Высота (см)'), { target: { value: '1000' } });
    pick([file('a.png')]);
    fireEvent.click(screen.getByText('Добавить картину'));
    await waitFor(() => expect(createMutateAsync).toHaveBeenCalled());
    const fd: FormData = createMutateAsync.mock.calls[0][0];
    expect(fd.get('heightCm')).toBe('1000');
  });

  it('accepts year at 1950', async () => {
    createMutateAsync.mockResolvedValue({ id: 9 });
    upload.mockResolvedValue([]);
    render(<ArtworkForm artwork={null} categories={cats} onSaved={jest.fn()} />);
    fireEvent.change(screen.getByLabelText('Название'), { target: { value: 'Новая' } });
    fireEvent.change(screen.getByLabelText('Категория'), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText('Год'), { target: { value: '1950' } });
    pick([file('a.png')]);
    fireEvent.click(screen.getByText('Добавить картину'));
    await waitFor(() => expect(createMutateAsync).toHaveBeenCalled());
    const fd: FormData = createMutateAsync.mock.calls[0][0];
    expect(fd.get('year')).toBe('1950');
  });

  it('accepts support at exactly 100 characters', async () => {
    createMutateAsync.mockResolvedValue({ id: 9 });
    upload.mockResolvedValue([]);
    render(<ArtworkForm artwork={null} categories={cats} onSaved={jest.fn()} />);
    fireEvent.change(screen.getByLabelText('Название'), { target: { value: 'Новая' } });
    fireEvent.change(screen.getByLabelText('Категория'), { target: { value: '1' } });
    const longSupport = 'х'.repeat(100);
    fireEvent.change(screen.getByLabelText('Основа'), { target: { value: longSupport } });
    pick([file('a.png')]);
    fireEvent.click(screen.getByText('Добавить картину'));
    await waitFor(() => expect(createMutateAsync).toHaveBeenCalled());
    const fd: FormData = createMutateAsync.mock.calls[0][0];
    expect(fd.get('support')).toBe(longSupport);
  });

  it('accepts technique at exactly 100 characters', async () => {
    createMutateAsync.mockResolvedValue({ id: 9 });
    upload.mockResolvedValue([]);
    render(<ArtworkForm artwork={null} categories={cats} onSaved={jest.fn()} />);
    fireEvent.change(screen.getByLabelText('Название'), { target: { value: 'Новая' } });
    fireEvent.change(screen.getByLabelText('Категория'), { target: { value: '1' } });
    const longTechnique = 'т'.repeat(100);
    fireEvent.change(screen.getByLabelText('Техника'), { target: { value: longTechnique } });
    pick([file('a.png')]);
    fireEvent.click(screen.getByText('Добавить картину'));
    await waitFor(() => expect(createMutateAsync).toHaveBeenCalled());
    const fd: FormData = createMutateAsync.mock.calls[0][0];
    expect(fd.get('technique')).toBe(longTechnique);
  });

  it('accepts all status values in dropdown', async () => {
    createMutateAsync.mockResolvedValue({ id: 9 });
    upload.mockResolvedValue([]);
    const statuses = ['Available', 'Sold', 'NotForSale', 'Unavailable', 'NotMine', 'PrivateCollection'];
    for (const status of statuses) {
      jest.clearAllMocks();
      createMutateAsync.mockResolvedValue({ id: 9 });
      upload.mockResolvedValue([]);
      const { unmount } = render(<ArtworkForm artwork={null} categories={cats} onSaved={jest.fn()} />);
      fireEvent.change(screen.getByLabelText('Название'), { target: { value: 'Test' } });
      fireEvent.change(screen.getByLabelText('Категория'), { target: { value: '1' } });
      fireEvent.change(screen.getByLabelText('Статус'), { target: { value: status } });
      pick([file('a.png')]);
      fireEvent.click(screen.getByText('Добавить картину'));
      await waitFor(() => expect(createMutateAsync).toHaveBeenCalled());
      const fd: FormData = createMutateAsync.mock.calls[0][0];
      expect(fd.get('status')).toBe(status);
      unmount();
    }
  });
});
