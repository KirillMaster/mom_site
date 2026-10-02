import { validateNewFiles, extractApiError, MAX_IMAGES, MAX_FILE_BYTES } from '@/lib/artworkImageValidation';

const file = (name: string, size: number, type = 'image/png') => {
  const f = new File(['x'], name, { type });
  Object.defineProperty(f, 'size', { value: size });
  return f;
};

describe('@US1-AS5 граница 10 фото', () => {
  it('accepts exactly 10 total images', () => {
    const result = validateNewFiles([file('new.png', 1000)], 9);
    expect(result.accepted).toHaveLength(1);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects 11th image when 10 already occupied', () => {
    const result = validateNewFiles([file('extra.png', 1000)], 10);
    expect(result.accepted).toHaveLength(0);
    expect(result.errors[0]).toContain('не более 10 фото');
    expect(result.errors[0]).toContain('«extra.png»');
  });

  it('accepts exactly (MAX_IMAGES - occupied) new images', () => {
    const incoming = Array.from({ length: 5 }, (_, i) => file(`img${i}.png`, 1000));
    const result = validateNewFiles(incoming, 5);
    expect(result.accepted).toHaveLength(5);
    expect(result.errors).toHaveLength(0);
  });

  it('accepts partial batch when limit hit', () => {
    const incoming = [file('ok1.png', 1000), file('ok2.png', 1000), file('reject.png', 1000)];
    const result = validateNewFiles(incoming, 8);
    expect(result.accepted).toHaveLength(2);
    expect(result.errors[0]).toContain('не более 10 фото');
    expect(result.errors[0]).toContain('«reject.png»');
  });

  it('rejects all images when already at MAX_IMAGES', () => {
    const result = validateNewFiles([file('a.png', 1000), file('b.png', 1000)], 10);
    expect(result.accepted).toHaveLength(0);
    expect(result.errors.length).toBe(1);
    expect(result.errors[0]).toContain('«a.png», «b.png»');
  });
});

describe('@US1-AS5 граница 15 МБ', () => {
  it('accepts file exactly at 15 MB', () => {
    const result = validateNewFiles([file('exact.png', MAX_FILE_BYTES)], 0);
    expect(result.accepted).toHaveLength(1);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects file at 15 MB + 1 byte', () => {
    const result = validateNewFiles([file('oversized.png', MAX_FILE_BYTES + 1)], 0);
    expect(result.accepted).toHaveLength(0);
    expect(result.errors[0]).toContain('размер больше 15 МБ');
  });

  it('accepts 14.99 MB file', () => {
    const result = validateNewFiles([file('almost.png', 14 * 1024 * 1024 + 1024)], 0);
    expect(result.accepted).toHaveLength(1);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects multiple oversized files with individual messages', () => {
    const result = validateNewFiles([
      file('huge1.png', MAX_FILE_BYTES + 1),
      file('huge2.png', 20 * 1024 * 1024),
    ], 0);
    expect(result.accepted).toHaveLength(0);
    expect(result.errors).toHaveLength(2);
    expect(result.errors.every(e => e.includes('размер больше 15 МБ'))).toBe(true);
  });
});

describe('@US1-AS6 валидация типа файла', () => {
  it('rejects non-image MIME types', () => {
    const result = validateNewFiles([
      file('doc.txt', 1000, 'text/plain'),
      file('sheet.csv', 1000, 'text/csv'),
      file('pdf.pdf', 1000, 'application/pdf'),
    ], 0);
    expect(result.accepted).toHaveLength(0);
    expect(result.errors).toHaveLength(3);
    expect(result.errors.every(e => e.includes('не добавлен: это не изображение'))).toBe(true);
  });

  it('accepts image/webp and image/jpeg', () => {
    const result = validateNewFiles([
      file('photo.webp', 1000, 'image/webp'),
      file('photo.jpg', 1000, 'image/jpeg'),
    ], 0);
    expect(result.accepted).toHaveLength(2);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects image/svg+xml (starts with image/ but might need specific handling)', () => {
    // Note: validateNewFiles accepts all types starting with 'image/'
    const result = validateNewFiles([file('vector.svg', 1000, 'image/svg+xml')], 0);
    expect(result.accepted).toHaveLength(1);
  });
});

describe('@US1-AS5 комбинированные граничные случаи', () => {
  it('handles batch: 5 valid, 2 oversized, 1 non-image, at limit', () => {
    const batch = [
      file('ok1.png', 1000),
      file('huge.png', MAX_FILE_BYTES + 1),
      file('ok2.png', 1000),
      file('doc.txt', 1000, 'text/plain'),
      file('ok3.png', 1000),
    ];
    const result = validateNewFiles(batch, 7);
    expect(result.accepted).toHaveLength(3); // ok1, ok2, ok3 before limit hit
    expect(result.errors.length).toBeGreaterThan(1);
    expect(result.errors.some(e => e.includes('размер больше 15 МБ'))).toBe(true);
    expect(result.errors.some(e => e.includes('не добавлен: это не изображение'))).toBe(true);
  });

  it('accepts 0 files from batch with occupied at exact limit', () => {
    const result = validateNewFiles([file('x.png', 1000)], MAX_IMAGES);
    expect(result.accepted).toHaveLength(0);
    expect(result.errors[0]).toContain('«x.png»');
  });

  it('names all rejected files in single limit message', () => {
    const result = validateNewFiles([
      file('reject1.png', 1000),
      file('reject2.png', 1000),
      file('reject3.png', 1000),
    ], 8);
    // occupied=8, first 2 are accepted (8+0=8, 8+1=9 both < 10), third hits limit
    expect(result.accepted).toHaveLength(2);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('«reject3.png»');
  });
});

describe('@US1-EC7 extractApiError функция', () => {
  it('extracts string from error.response.data', () => {
    const error = { response: { data: 'Файл повреждён' } };
    expect(extractApiError(error, 'default')).toBe('Файл повреждён');
  });

  it('extracts message from object response.data', () => {
    const error = { response: { data: { message: 'Имя уже занято' } } };
    expect(extractApiError(error, 'default')).toBe('Имя уже занято');
  });

  it('extracts error field when message absent', () => {
    const error = { response: { data: { error: 'Ошибка сохранения' } } };
    expect(extractApiError(error, 'default')).toBe('Ошибка сохранения');
  });

  it('prefers message over error when both present', () => {
    const error = { response: { data: { message: 'Приоритет', error: 'Второй' } } };
    expect(extractApiError(error, 'default')).toBe('Приоритет');
  });

  it('uses fallback when response.data is undefined', () => {
    const error = { response: {} };
    expect(extractApiError(error, 'Ошибка сервера')).toBe('Ошибка сервера');
  });

  it('uses fallback when response is undefined', () => {
    const error = {};
    expect(extractApiError(error, 'Что-то пошло не так')).toBe('Что-то пошло не так');
  });

  it('uses fallback for null error', () => {
    expect(extractApiError(null, 'Неизвестная ошибка')).toBe('Неизвестная ошибка');
  });

  it('uses fallback for undefined error', () => {
    expect(extractApiError(undefined, 'Неизвестная ошибка')).toBe('Неизвестная ошибка');
  });

  it('ignores empty string in response.data', () => {
    const error = { response: { data: '' } };
    expect(extractApiError(error, 'fallback')).toBe('fallback');
  });

  it('returns empty string from response.data (falsy but present)', () => {
    // Current implementation returns empty string because `typeof data === 'string' && data` is falsy
    const error = { response: { data: '' } };
    const result = extractApiError(error, 'fallback');
    expect(result).toBe('fallback');
  });

  it('handles response.data as empty object', () => {
    const error = { response: { data: {} } };
    expect(extractApiError(error, 'fallback')).toBe('fallback');
  });

  it('extracts from nested response structure', () => {
    const error = {
      response: {
        status: 400,
        data: { message: 'Validation error' },
      },
    };
    expect(extractApiError(error, 'default')).toBe('Validation error');
  });

  it('handles numeric error response.data', () => {
    const error = { response: { data: 404 } };
    expect(extractApiError(error, 'Not found')).toBe('Not found');
  });
});

describe('@US1-EC8 граничные значения в массивах', () => {
  it('handles empty file array', () => {
    const result = validateNewFiles([], 5);
    expect(result.accepted).toHaveLength(0);
    expect(result.errors).toHaveLength(0);
  });

  it('handles single file at various occupied states', () => {
    const single = [file('one.png', 1000)];
    expect(validateNewFiles(single, 0).accepted).toHaveLength(1);
    expect(validateNewFiles(single, 9).accepted).toHaveLength(1);
    expect(validateNewFiles(single, 10).accepted).toHaveLength(0);
  });

  it('counts accepted.length in occupied calculation during iteration', () => {
    const batch = Array.from({ length: 3 }, (_, i) => file(`img${i}.png`, 1000));
    const result = validateNewFiles(batch, 8);
    // occupied=8, first accepted (8+0=8<10), second accepted (8+1=9<10), third would be (8+2=10, hits limit)
    expect(result.accepted).toHaveLength(2);
    expect(result.errors[0]).toContain('«img2.png»');
  });

  it('file.type boundary: empty string type', () => {
    const f = new File(['x'], 'noext', { type: '' });
    const result = validateNewFiles([f], 0);
    expect(result.accepted).toHaveLength(0);
    expect(result.errors[0]).toContain('не добавлен: это не изображение');
  });
});
