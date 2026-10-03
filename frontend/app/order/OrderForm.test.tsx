import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import OrderForm, { buildOrderRequest } from './OrderForm';
import { sendContactMessage } from '@/hooks/useApi';
import { reachGoal } from '@/lib/analytics';

jest.mock('@/hooks/useApi', () => ({ sendContactMessage: jest.fn() }));
jest.mock('@/lib/analytics', () => ({
  ...jest.requireActual('@/lib/analytics'),
  reachGoal: jest.fn(),
}));

const send = sendContactMessage as jest.Mock;
const goal = reachGoal as jest.Mock;

const fill = (label: RegExp, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });

const fillRequired = () => {
  fill(/Имя/, 'Анна');
  fill(/Как с вами связаться/, 'a@b.ru');
  fill(/Сюжет/, 'Море на закате');
};

beforeEach(() => {
  send.mockReset();
  goal.mockReset();
});

describe('@US6-AS1 отправка формы заказа', () => {
  it('шлёт обращение с темой «Картина на заказ», сюжетом, размером и комментарием, затем цель', async () => {
    send.mockResolvedValue({});
    render(<OrderForm />);
    fillRequired();
    fill(/Размер/, '60x80');
    fill(/Комментарий/, 'Тёплые тона');
    fireEvent.click(screen.getByRole('button', { name: 'Отправить' }));

    await waitFor(() => expect(send).toHaveBeenCalledTimes(1));
    const payload = send.mock.calls[0][0];
    expect(payload.subject).toBe('Картина на заказ');
    expect(payload.name).toBe('Анна');
    expect(payload.email).toBe('a@b.ru');
    expect(payload.message).toContain('Море на закате');
    expect(payload.message).toContain('60x80');
    expect(payload.message).toContain('Тёплые тона');
    await waitFor(() => expect(goal).toHaveBeenCalledWith('custom_order_submit', expect.anything()));
    expect(await screen.findByRole('status')).toHaveTextContent(/Спасибо|отправлен/i);
  });
});

describe('@US6-AS2 пустые обязательные поля блокируют отправку', () => {
  it('показывает ошибки у полей, не шлёт запрос и цель', async () => {
    render(<OrderForm />);
    fireEvent.click(screen.getByRole('button', { name: 'Отправить' }));

    expect((await screen.findAllByRole('alert')).length).toBeGreaterThanOrEqual(3);
    expect(screen.getByLabelText(/Имя/)).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText(/Как с вами связаться/)).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText(/Сюжет/)).toHaveAttribute('aria-invalid', 'true');
    expect(send).not.toHaveBeenCalled();
    expect(goal).not.toHaveBeenCalled();
  });
});

describe('@US6-EC1 ошибка отправки сохраняет введённое', () => {
  it('показывает ошибку с мессенджером, значения остаются, цель не шлётся', async () => {
    send.mockRejectedValue(new Error('500'));
    render(<OrderForm />);
    fillRequired();
    fireEvent.click(screen.getByRole('button', { name: 'Отправить' }));

    const alert = await screen.findByText(/мессенджер/i);
    expect(alert).toBeInTheDocument();
    expect(screen.getByLabelText(/Имя/)).toHaveValue('Анна');
    expect(screen.getByLabelText(/Как с вами связаться/)).toHaveValue('a@b.ru');
    expect(screen.getByLabelText(/Сюжет/)).toHaveValue('Море на закате');
    expect(goal).not.toHaveBeenCalled();
  });
});

describe('@US6-FE2 тип контакта определяется по значению', () => {
  const req = (contact: string) =>
    buildOrderRequest({ name: 'А', contact, subjectText: 'с', size: '', comment: '' });

  it('email', () => {
    const r = req('a@b.ru');
    expect(r.email).toBe('a@b.ru');
    expect(r.phone).toBeUndefined();
    expect(r.telegramUsername).toBeUndefined();
  });
  it('телефон', () => {
    const r = req('+7 999 123-45-67');
    expect(r.phone).toBe('+7 999 123-45-67');
    expect(r.email).toBeUndefined();
    expect(r.telegramUsername).toBeUndefined();
  });
  it('telegram', () => {
    const r = req('@artist');
    expect(r.telegramUsername).toBe('@artist');
    expect(r.email).toBeUndefined();
    expect(r.phone).toBeUndefined();
  });
});

describe('@US6-FE3 параметр artwork префиллит комментарий', () => {
  it('содержит «Хочу похожую на «Цветы лета»»', () => {
    render(<OrderForm artwork="Цветы лета" />);
    expect(screen.getByLabelText(/Комментарий/)).toHaveValue('Хочу похожую на «Цветы лета»');
  });

  it('разметка выводится как обычный текст', () => {
    const { container } = render(<OrderForm artwork="<b>x</b>" />);
    expect(screen.getByLabelText(/Комментарий/)).toHaveValue('Хочу похожую на «<b>x</b>»');
    expect(container.querySelector('b')).toBeNull();
  });
});

// ====== Degradation Mode Boundary Tests for @US6 (Order Form & Telegram) ======

describe('@US6-FE2 тип контакта — telegram boundary cases', () => {
  const req = (contact: string) =>
    buildOrderRequest({ name: 'А', contact, subjectText: 'с', size: '', comment: '' });

  it('telegram с @', () => {
    const r = req('@artist');
    expect(r.telegramUsername).toBe('@artist');
    expect(r.email).toBeUndefined();
    expect(r.phone).toBeUndefined();
  });

  it('telegram с @ и пробелами (trimmed)', () => {
    const r = req('  @artist  ');
    expect(r.telegramUsername).toBe('@artist');
    expect(r.email).toBeUndefined();
    expect(r.phone).toBeUndefined();
  });

  it('telegram только имя', () => {
    const r = req('artist_name');
    expect(r.telegramUsername).toBe('artist_name');
    expect(r.email).toBeUndefined();
    expect(r.phone).toBeUndefined();
  });

  it('именно 64 символа', () => {
    const r = req(new Array(65).join('a'));
    expect(r.telegramUsername?.length).toBe(64);
  });
});

describe('@US6-AS2 пусто контактных данных блокирует отправку — all variations', () => {
  beforeEach(() => {
    send.mockReset();
    goal.mockReset();
  });

  it('только имя и сюжет, контакт пуст', async () => {
    render(<OrderForm />);
    fill(/Имя/, 'Анна');
    fill(/Как с вами связаться/, '');
    fill(/Сюжет/, 'Море на закате');
    fireEvent.click(screen.getByRole('button', { name: 'Отправить' }));

    await waitFor(() => expect(send).not.toHaveBeenCalled());
    expect(goal).not.toHaveBeenCalled();
  });

  it('контакт содержит только пробелы', async () => {
    render(<OrderForm />);
    fill(/Имя/, 'Анна');
    fill(/Как с вами связаться/, '   ');
    fill(/Сюжет/, 'Море');
    fireEvent.click(screen.getByRole('button', { name: 'Отправить' }));

    await waitFor(() => expect(send).not.toHaveBeenCalled());
  });
});

describe('@US6-AS1 @US6-FE2 отправка с telegram-only контактом', () => {
  beforeEach(() => {
    send.mockReset();
    goal.mockReset();
  });

  it('accepts @telegram_handle', async () => {
    send.mockResolvedValue({});
    render(<OrderForm />);
    fill(/Имя/, 'Анна');
    fill(/Как с вами связаться/, '@artist_handle');
    fill(/Сюжет/, 'Портрет');
    fireEvent.click(screen.getByRole('button', { name: 'Отправить' }));

    await waitFor(() => expect(send).toHaveBeenCalledTimes(1));
    const payload = send.mock.calls[0][0];
    expect(payload.telegramUsername).toBe('@artist_handle');
    expect(payload.email).toBeUndefined();
    expect(payload.phone).toBeUndefined();
  });

  it('accepts telegram without @', async () => {
    send.mockResolvedValue({});
    render(<OrderForm />);
    fill(/Имя/, 'Анна');
    fill(/Как с вами связаться/, 'artist_handle');
    fill(/Сюжет/, 'Портрет');
    fireEvent.click(screen.getByRole('button', { name: 'Отправить' }));

    await waitFor(() => expect(send).toHaveBeenCalledTimes(1));
    const payload = send.mock.calls[0][0];
    expect(payload.telegramUsername).toBe('artist_handle');
  });

  it('persists form on server error with telegram', async () => {
    send.mockRejectedValue(new Error('500'));
    render(<OrderForm />);
    fill(/Имя/, 'Анна');
    fill(/Как с вами связаться/, '@artist');
    fill(/Сюжет/, 'Портрет');
    fireEvent.click(screen.getByRole('button', { name: 'Отправить' }));

    const alert = await screen.findByText(/мессенджер/i);
    expect(alert).toBeInTheDocument();
    expect(screen.getByLabelText(/Как с вами связаться/)).toHaveValue('@artist');
  });
});

describe('@US6-FE3 artwork parameter edge cases', () => {
  it('very long artwork title', () => {
    const longTitle = 'А'.repeat(200);
    render(<OrderForm artwork={longTitle} />);
    expect(screen.getByLabelText(/Комментарий/)).toHaveValue(`Хочу похожую на «${longTitle}»`);
  });

  it('artwork title with special characters', () => {
    render(<OrderForm artwork="«Рассвет» & Тень" />);
    expect(screen.getByLabelText(/Комментарий/)).toHaveValue('Хочу похожую на ««Рассвет» & Тень»');
  });

  it('artwork with quotes is not interpreted as HTML', () => {
    const { container } = render(<OrderForm artwork='"quotes"' />);
    expect(screen.getByLabelText(/Комментарий/)).toHaveValue('Хочу похожую на «"quotes"»');
    expect(container.querySelector('b')).toBeNull();
  });
});

describe('@US1-EC2 @US1-EC1 available grid boundary — 0, 1, 2 items', () => {
  beforeEach(() => {
    send.mockReset();
  });

  it('form still renders with no artworks', () => {
    render(<OrderForm />);
    expect(screen.getByRole('button', { name: 'Отправить' })).toBeInTheDocument();
  });

  it('form preserves textarea content on blur and focus', async () => {
    render(<OrderForm />);
    const textarea = screen.getByLabelText(/Сюжет/);

    fireEvent.focus(textarea);
    fireEvent.change(textarea, { target: { value: 'Морской пейзаж' } });
    fireEvent.blur(textarea);

    expect(textarea).toHaveValue('Морской пейзаж');
  });
});
