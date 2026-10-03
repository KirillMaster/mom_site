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
