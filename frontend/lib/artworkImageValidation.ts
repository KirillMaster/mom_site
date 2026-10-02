export const MAX_IMAGES = 10;
export const MAX_FILE_BYTES = 15 * 1024 * 1024;

export interface FileValidation {
  accepted: File[];
  errors: string[];
}

export function validateNewFiles(files: File[], occupied: number): FileValidation {
  const accepted: File[] = [];
  const errors: string[] = [];
  const limitHit: string[] = [];
  for (const file of files) {
    if (!file.type.startsWith('image/')) {
      errors.push(`Файл «${file.name}» не добавлен: это не изображение`);
    } else if (file.size > MAX_FILE_BYTES) {
      errors.push(`Файл «${file.name}» не добавлен: размер больше 15 МБ`);
    } else if (occupied + accepted.length >= MAX_IMAGES) {
      limitHit.push(file.name);
    } else {
      accepted.push(file);
    }
  }
  if (limitHit.length > 0) {
    const names = limitHit.map((n) => `«${n}»`).join(', ');
    errors.push(`Достигнут лимит: не более ${MAX_IMAGES} фото на одну работу. Не добавлены: ${names}`);
  }
  return { accepted, errors };
}

export function extractApiError(error: unknown, fallback: string): string {
  const data = (error as { response?: { data?: unknown } })?.response?.data;
  if (typeof data === 'string' && data) return data;
  const obj = data as { message?: string; error?: string } | undefined;
  return obj?.message || obj?.error || fallback;
}
