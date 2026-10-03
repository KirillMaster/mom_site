import { renderHook, act, waitFor } from '@testing-library/react';
import { useArtworkSave } from '@/components/admin/useArtworkSave';
import { uploadArtworkImages } from '@/lib/artworkImagesApi';
import type { ArtworkFormState } from '@/components/admin/ArtworkFormFields';

jest.mock('@/hooks/useApi');
jest.mock('@/lib/artworkImagesApi');

const mockCreateArtwork = jest.fn();
const mockUpdateArtwork = jest.fn();

jest.mock('@/hooks/useApi', () => ({
  useCreateArtwork: () => ({ mutateAsync: mockCreateArtwork, isPending: false }),
  useUpdateArtwork: () => ({ mutateAsync: mockUpdateArtwork, isPending: false }),
}));

const upload = uploadArtworkImages as jest.Mock;

const file = (name: string) => new File(['x'], name, { type: 'image/png' });
const state: ArtworkFormState = { title: 'Test', categoryId: '1', description: 'Desc', price: '100', status: 'Available', widthCm: '', heightCm: '', year: '', support: '', technique: '', shortDescription: '', isFeatured: false, needsReshoot: false, isPublished: true };
const artwork = { id: 5, ...state };

beforeEach(() => {
  jest.clearAllMocks();
  mockCreateArtwork.mockResolvedValue({ id: 10 });
  upload.mockResolvedValue([]);
});

describe('@US1-AS1 создание с фото', () => {
  it('creates artwork with single photo as cover', async () => {
    const onSaved = jest.fn();
    const { result } = renderHook(() => useArtworkSave(null, state, [file('cover.png')], onSaved));

    await act(async () => {
      const event = { preventDefault: jest.fn() } as any;
      await result.current.submit(event);
    });

    expect(mockCreateArtwork).toHaveBeenCalledWith(expect.any(FormData));
    const fd: FormData = mockCreateArtwork.mock.calls[0][0];
    expect(fd.get('image')).toEqual(file('cover.png'));
    expect(upload).not.toHaveBeenCalled();
    expect(onSaved).toHaveBeenCalled();
  });

  it('creates artwork with multiple photos (first as cover, rest uploaded)', async () => {
    const onSaved = jest.fn();
    const [first, ...rest] = [file('cover.png'), file('extra1.png'), file('extra2.png')];
    const { result } = renderHook(() => useArtworkSave(null, state, [first, ...rest], onSaved));

    await act(async () => {
      const event = { preventDefault: jest.fn() } as any;
      await result.current.submit(event);
    });

    expect(mockCreateArtwork).toHaveBeenCalledWith(expect.any(FormData));
    expect(upload).toHaveBeenCalledWith(10, rest);
    expect(onSaved).toHaveBeenCalled();
  });

  it('shows error when creating without photos', async () => {
    const { result } = renderHook(() => useArtworkSave(null, state, [], jest.fn()));

    await act(async () => {
      const event = { preventDefault: jest.fn() } as any;
      await result.current.submit(event);
    });

    expect(result.current.error).toBe('Добавьте хотя бы одно фото');
    expect(mockCreateArtwork).not.toHaveBeenCalled();
  });

  it('clears error before new submission', async () => {
    const { result } = renderHook(() => useArtworkSave(null, state, [], jest.fn()));

    await act(async () => {
      const event = { preventDefault: jest.fn() } as any;
      await result.current.submit(event);
    });
    expect(result.current.error).toBe('Добавьте хотя бы одно фото');

    mockCreateArtwork.mockResolvedValue({ id: 10 });
    const onSaved = jest.fn();
    const { result: result2 } = renderHook(() => useArtworkSave(null, state, [file('ok.png')], onSaved));

    await act(async () => {
      const event = { preventDefault: jest.fn() } as any;
      await result2.current.submit(event);
    });

    expect(result2.current.error).toBeNull();
  });
});

describe('@US1-AS1 редактирование', () => {
  it('updates without additional photos', async () => {
    const onSaved = jest.fn();
    const { result } = renderHook(() => useArtworkSave(artwork, state, [], onSaved));

    await act(async () => {
      const event = { preventDefault: jest.fn() } as any;
      await result.current.submit(event);
    });

    expect(mockUpdateArtwork).toHaveBeenCalledWith({ id: 5, data: expect.any(FormData) });
    expect(upload).not.toHaveBeenCalled();
    expect(onSaved).toHaveBeenCalled();
  });

  it('updates with additional photos', async () => {
    const onSaved = jest.fn();
    const extras = [file('new1.png'), file('new2.png')];
    const { result } = renderHook(() => useArtworkSave(artwork, state, extras, onSaved));

    await act(async () => {
      const event = { preventDefault: jest.fn() } as any;
      await result.current.submit(event);
    });

    expect(mockUpdateArtwork).toHaveBeenCalledWith({ id: 5, data: expect.any(FormData) });
    expect(upload).toHaveBeenCalledWith(5, extras);
    expect(onSaved).toHaveBeenCalled();
  });

  it('does not require photos when editing', async () => {
    const onSaved = jest.fn();
    const { result } = renderHook(() => useArtworkSave(artwork, { ...state, title: 'Updated' }, [], onSaved));

    await act(async () => {
      const event = { preventDefault: jest.fn() } as any;
      await result.current.submit(event);
    });

    expect(result.current.error).toBeNull();
    expect(mockUpdateArtwork).toHaveBeenCalled();
  });
});

describe('@US1-EC8 обработка ошибок', () => {
  it('shows server error on create failure', async () => {
    mockCreateArtwork.mockRejectedValue({ response: { data: 'Title too long' } });
    const { result } = renderHook(() => useArtworkSave(null, state, [file('a.png')], jest.fn()));

    await act(async () => {
      const event = { preventDefault: jest.fn() } as any;
      await result.current.submit(event);
    });

    expect(result.current.error).toBe('Title too long');
  });

  it('shows fallback error on update failure', async () => {
    mockUpdateArtwork.mockRejectedValue(new Error('Network'));
    const { result } = renderHook(() => useArtworkSave(artwork, state, [], jest.fn()));

    await act(async () => {
      const event = { preventDefault: jest.fn() } as any;
      await result.current.submit(event);
    });

    expect(result.current.error).toBe('Не удалось сохранить работу или загрузить фото');
  });

  it('shows special error after partial create failure (upload fails)', async () => {
    mockCreateArtwork.mockResolvedValue({ id: 20 });
    upload.mockRejectedValue({ response: { data: 'Upload failed' } });
    const { result } = renderHook(() => useArtworkSave(null, state, [file('a.png'), file('b.png')], jest.fn()));

    await act(async () => {
      const event = { preventDefault: jest.fn() } as any;
      await result.current.submit(event);
    });

    expect(result.current.error).toBe('Upload failed');
  });

  it('shows partial create fallback on upload error', async () => {
    mockCreateArtwork.mockResolvedValue({ id: 20 });
    upload.mockRejectedValue({});
    const { result } = renderHook(() => useArtworkSave(null, state, [file('a.png'), file('b.png')], jest.fn()));

    await act(async () => {
      const event = { preventDefault: jest.fn() } as any;
      await result.current.submit(event);
    });

    expect(result.current.error).toContain('Работа создана, но часть фото не загрузилась');
  });

  it('handles create failure with message extraction from nested error', async () => {
    mockCreateArtwork.mockRejectedValue({
      response: {
        data: { message: 'Duplicate title' },
      },
    });
    const { result } = renderHook(() => useArtworkSave(null, state, [file('a.png')], jest.fn()));

    await act(async () => {
      const event = { preventDefault: jest.fn() } as any;
      await result.current.submit(event);
    });

    expect(result.current.error).toBe('Duplicate title');
  });

  it('handles create failure with error field', async () => {
    mockCreateArtwork.mockRejectedValue({
      response: {
        data: { error: 'Invalid category' },
      },
    });
    const { result } = renderHook(() => useArtworkSave(null, state, [file('a.png')], jest.fn()));

    await act(async () => {
      const event = { preventDefault: jest.fn() } as any;
      await result.current.submit(event);
    });

    expect(result.current.error).toBe('Invalid category');
  });
});

describe('@US1-BE4 @US1 FormData construction', () => {
  it('includes all state fields in FormData', async () => {
    mockCreateArtwork.mockResolvedValue({ id: 10 });
    const testState: ArtworkFormState = {
      title: 'MyTitle',
      categoryId: '5',
      status: 'Sold',
      widthCm: '60',
      heightCm: '80',
      year: '2024',
      support: 'холст',
      technique: 'масло',
      shortDescription: '', isFeatured: false, needsReshoot: false, isPublished: true,
      description: 'MyDesc',
      price: '50',
    };
    const { result } = renderHook(() => useArtworkSave(null, testState, [file('a.png')], jest.fn()));

    await act(async () => {
      const event = { preventDefault: jest.fn() } as any;
      await result.current.submit(event);
    });

    const fd: FormData = mockCreateArtwork.mock.calls[0][0];
    expect(fd.get('title')).toBe('MyTitle');
    expect(fd.get('categoryId')).toBe('5');
    expect(fd.get('status')).toBe('Sold');
    expect(fd.get('widthCm')).toBe('60');
    expect(fd.get('heightCm')).toBe('80');
    expect(fd.get('year')).toBe('2024');
    expect(fd.get('support')).toBe('холст');
    expect(fd.get('technique')).toBe('масло');
    expect(fd.has('isForSale')).toBe(false);
  });

  it('converts non-string values to strings in FormData', async () => {
    mockCreateArtwork.mockResolvedValue({ id: 10 });
    const testState: ArtworkFormState = {
      title: 'Test',
      categoryId: '99',
      status: 'Available',
      widthCm: '',
      heightCm: '',
      year: '',
      support: '',
      technique: '',
      shortDescription: '', isFeatured: false, needsReshoot: false, isPublished: true,
      description: 'Desc',
      price: '200',
    };
    const { result } = renderHook(() => useArtworkSave(null, testState, [file('a.png')], jest.fn()));

    await act(async () => {
      const event = { preventDefault: jest.fn() } as any;
      await result.current.submit(event);
    });

    const fd: FormData = mockCreateArtwork.mock.calls[0][0];
    expect(fd.get('categoryId')).toEqual(expect.stringContaining('99'));
    expect(fd.get('status')).toEqual(expect.stringContaining('Available'));
  });
});

describe('@US1 pending state', () => {
  it('returns pending state from mutation', async () => {
    const { result } = renderHook(() => useArtworkSave(artwork, state, [], jest.fn()));
    expect(result.current.pending).toBe(false);
  });
});

describe('@US1 edge cases', () => {
  it('handles single photo for create (no upload needed)', async () => {
    const onSaved = jest.fn();
    const { result } = renderHook(() => useArtworkSave(null, state, [file('single.png')], onSaved));

    await act(async () => {
      const event = { preventDefault: jest.fn() } as any;
      await result.current.submit(event);
    });

    expect(mockCreateArtwork).toHaveBeenCalled();
    expect(upload).not.toHaveBeenCalled();
    expect(onSaved).toHaveBeenCalled();
  });

  it('preventDefault called on event', async () => {
    const onSaved = jest.fn();
    const { result } = renderHook(() => useArtworkSave(artwork, state, [], onSaved));
    const event = { preventDefault: jest.fn() } as any;

    await act(async () => {
      await result.current.submit(event);
    });

    expect(event.preventDefault).toHaveBeenCalled();
  });
});

describe('@US1-EC11 spec field boundaries in FormData construction', () => {
  it('accepts widthCm at minimum boundary 1', async () => {
    mockCreateArtwork.mockResolvedValue({ id: 10 });
    const testState: ArtworkFormState = { ...state, widthCm: '1' };
    const { result } = renderHook(() => useArtworkSave(null, testState, [file('a.png')], jest.fn()));

    await act(async () => {
      const event = { preventDefault: jest.fn() } as any;
      await result.current.submit(event);
    });

    const fd: FormData = mockCreateArtwork.mock.calls[0][0];
    expect(fd.get('widthCm')).toBe('1');
  });

  it('accepts heightCm at maximum boundary 1000', async () => {
    mockCreateArtwork.mockResolvedValue({ id: 10 });
    const testState: ArtworkFormState = { ...state, heightCm: '1000' };
    const { result } = renderHook(() => useArtworkSave(null, testState, [file('a.png')], jest.fn()));

    await act(async () => {
      const event = { preventDefault: jest.fn() } as any;
      await result.current.submit(event);
    });

    const fd: FormData = mockCreateArtwork.mock.calls[0][0];
    expect(fd.get('heightCm')).toBe('1000');
  });

  it('accepts year at 1950', async () => {
    mockCreateArtwork.mockResolvedValue({ id: 10 });
    const testState: ArtworkFormState = { ...state, year: '1950' };
    const { result } = renderHook(() => useArtworkSave(null, testState, [file('a.png')], jest.fn()));

    await act(async () => {
      const event = { preventDefault: jest.fn() } as any;
      await result.current.submit(event);
    });

    const fd: FormData = mockCreateArtwork.mock.calls[0][0];
    expect(fd.get('year')).toBe('1950');
  });

  it('accepts support at exactly 100 characters', async () => {
    mockCreateArtwork.mockResolvedValue({ id: 10 });
    const longSupport = 'х'.repeat(100);
    const testState: ArtworkFormState = { ...state, support: longSupport };
    const { result } = renderHook(() => useArtworkSave(null, testState, [file('a.png')], jest.fn()));

    await act(async () => {
      const event = { preventDefault: jest.fn() } as any;
      await result.current.submit(event);
    });

    const fd: FormData = mockCreateArtwork.mock.calls[0][0];
    expect(fd.get('support')).toBe(longSupport);
  });

  it('accepts technique at exactly 100 characters', async () => {
    mockCreateArtwork.mockResolvedValue({ id: 10 });
    const longTechnique = 'т'.repeat(100);
    const testState: ArtworkFormState = { ...state, technique: longTechnique };
    const { result } = renderHook(() => useArtworkSave(null, testState, [file('a.png')], jest.fn()));

    await act(async () => {
      const event = { preventDefault: jest.fn() } as any;
      await result.current.submit(event);
    });

    const fd: FormData = mockCreateArtwork.mock.calls[0][0];
    expect(fd.get('technique')).toBe(longTechnique);
  });

  it('handles empty widthCm, heightCm, year, support, technique', async () => {
    mockCreateArtwork.mockResolvedValue({ id: 10 });
    const testState: ArtworkFormState = {
      title: 'Test',
      categoryId: '1',
      status: 'Available',
      widthCm: '',
      heightCm: '',
      year: '',
      support: '',
      technique: '',
      shortDescription: '', isFeatured: false, needsReshoot: false, isPublished: true,
      description: 'Desc',
      price: '100',
    };
    const { result } = renderHook(() => useArtworkSave(null, testState, [file('a.png')], jest.fn()));

    await act(async () => {
      const event = { preventDefault: jest.fn() } as any;
      await result.current.submit(event);
    });

    const fd: FormData = mockCreateArtwork.mock.calls[0][0];
    expect(fd.get('widthCm')).toBe('');
    expect(fd.get('heightCm')).toBe('');
    expect(fd.get('year')).toBe('');
    expect(fd.get('support')).toBe('');
    expect(fd.get('technique')).toBe('');
  });

  it('handles all status values', async () => {
    const statuses = ['Available', 'Sold', 'NotForSale', 'Unavailable', 'NotMine', 'PrivateCollection'];
    for (const status of statuses) {
      jest.clearAllMocks();
      mockCreateArtwork.mockResolvedValue({ id: 10 });
      const testState: ArtworkFormState = { ...state, status: status as any };
      const { result } = renderHook(() => useArtworkSave(null, testState, [file('a.png')], jest.fn()));

      await act(async () => {
        const event = { preventDefault: jest.fn() } as any;
        await result.current.submit(event);
      });

      const fd: FormData = mockCreateArtwork.mock.calls[0][0];
      expect(fd.get('status')).toBe(status);
    }
  });
});

describe('@T028 клиентская валидация каталога', () => {
  it('blocks save when width out of range and sends booleans otherwise', async () => {
    const onSaved = jest.fn();
    const bad = { ...state, widthCm: '1001' };
    const { result } = renderHook(() => useArtworkSave(artwork, bad, [], onSaved));
    await act(async () => { await result.current.submit({ preventDefault: jest.fn() } as any); });
    expect(mockUpdateArtwork).not.toHaveBeenCalled();
    expect(result.current.error).toMatch(/Ширина/);

    const ok = { ...state, isFeatured: true, needsReshoot: true };
    const hook = renderHook(() => useArtworkSave(artwork, ok, [], onSaved));
    mockUpdateArtwork.mockResolvedValue({});
    await act(async () => { await hook.result.current.submit({ preventDefault: jest.fn() } as any); });
    const fd: FormData = mockUpdateArtwork.mock.calls[0][0].data;
    expect([fd.get('isFeatured'), fd.get('needsReshoot'), fd.get('isPublished')]).toEqual(['true', 'true', 'true']);
  });
});
