import { resolvePrivacy } from './privacy';

describe('resolvePrivacy', () => {
  it('falls back to the default template with operator details when there is no data', () => {
    for (const data of [null, undefined, { text: null, updatedAt: null }, { text: '  \n\n ', updatedAt: null }]) {
      const result = resolvePrivacy(data);
      const all = JSON.stringify(result.sections);
      expect(result.isCustom).toBe(false);
      expect(result.updatedAt).toBeNull();
      expect(all).toContain('Моисеенко Анжела Валерьевна');
      expect(all).toContain('Сухоруких Кирилл Всеволодович');
      expect(all).toContain('suhorukih@mail.ru');
    }
  });

  it('uses admin text split into paragraphs by blank lines and keeps the date', () => {
    const result = resolvePrivacy({ text: 'Первый\nабзац\r\n\r\nВторой абзац\n\n\nТретий', updatedAt: '2026-10-01T12:00:00Z' });
    expect(result.isCustom).toBe(true);
    expect(result.updatedAt).toBe('2026-10-01T12:00:00Z');
    expect(result.sections).toHaveLength(1);
    expect(result.sections[0].paragraphs).toEqual(['Первый\nабзац', 'Второй абзац', 'Третий']);
  });
});
