import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ContactsClientPage from './ContactsClientPage';
import { sendContactMessage } from '@/hooks/useApi';
import type { ContactsData } from '@/lib/api';

jest.mock('@/components/Navigation', () => () => <div />);
jest.mock('@/hooks/useApi', () => ({ sendContactMessage: jest.fn() }));
let params = new URLSearchParams();
jest.mock('next/navigation', () => ({ useSearchParams: () => params }));
window.alert = jest.fn();

const data = {
  bannerTitle: 't', bannerDescription: 'd', email: 'a@b.ru', phone: '+70000000000',
  socialLinks: { instagram: 'https://i', vk: 'https://v', telegram: 'https://t', whatsapp: 'https://w', youtube: 'https://y', max: 'https://m' },
  faq: [{ question: 'q', answer: 'a' }],
} as unknown as ContactsData;
const send = sendContactMessage as jest.Mock;
const FORBIDDEN = /(primary|secondary|purple|indigo|blue|orange|pink|green|red|yellow|gray)-\d*|gradient|\bprimary\b/;

beforeEach(() => { send.mockReset(); params = new URLSearchParams(); });

describe('@US4-AS1 фокус на странице контактов', () => {
  it('поля и кнопка отправки имеют focus-visible:ring-sea', () => {
    render(<ContactsClientPage contactsData={data} />);
    const form = document.querySelector('form')!;
    const controls = Array.from(form.querySelectorAll<HTMLElement>('input:not(#website), textarea, button[type="submit"]'));
    expect(controls.length).toBeGreaterThanOrEqual(6);
    controls.forEach((c) => expect(c.className).toContain('focus-visible:ring-sea'));
  });
});

describe('@US4-FE4 метки и ошибки', () => {
  it('у каждого поля метка, ошибка role=alert, поле aria-invalid', () => {
    render(<ContactsClientPage contactsData={data} />);
    ['Имя', 'Email', 'Телефон или мессенджер', 'Тема', 'Сообщение'].forEach((l) =>
      expect(screen.getByLabelText(new RegExp(l))).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole('button', { name: /Отправить сообщение/ }));
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Укажите телефон, мессенджер или email');
    const phone = screen.getByLabelText(/Телефон или мессенджер/);
    expect(phone).toHaveAttribute('aria-invalid', 'true');
    expect(phone.getAttribute('aria-describedby')).toContain(alert.id);
  });
});

describe('@US4-FE5 поведение 008', () => {
  it('телефон без email уходит без email, пустые контакты не отправляются, name/honeypot/тема сохранены', async () => {
    params = new URLSearchParams('artwork=moya-rabota');
    send.mockResolvedValue({});
    render(<ContactsClientPage contactsData={data} />);
    expect((screen.getByLabelText(/Тема/) as HTMLInputElement).value).not.toBe('');
    const hp = document.getElementById('website') as HTMLInputElement;
    expect(hp).toHaveAttribute('name', 'website');
    expect(hp.closest('[aria-hidden="true"]')).not.toBeNull();
    ['name', 'email', 'phone', 'subject', 'message'].forEach((n) =>
      expect(document.getElementById(n)).toHaveAttribute('name', n),
    );
    fireEvent.change(screen.getByLabelText(/Имя/), { target: { value: 'Иван' } });
    fireEvent.change(screen.getByLabelText(/Сообщение/), { target: { value: 'Привет' } });
    fireEvent.click(screen.getByRole('button', { name: /Отправить сообщение/ }));
    expect(send).not.toHaveBeenCalled();
    expect(screen.getByText('Укажите телефон, мессенджер или email')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/Телефон или мессенджер/), { target: { value: '+79990001122' } });
    fireEvent.click(screen.getByRole('button', { name: /Отправить сообщение/ }));
    await waitFor(() => expect(send).toHaveBeenCalledTimes(1));
    expect(send.mock.calls[0][0].email).toBe('');
    expect(await screen.findByText('Сообщение успешно отправлено!')).toBeInTheDocument();
  });
});

describe('@US4-FE6 кнопка отправки и блоки', () => {
  it('Button primary bg-sea; блоки без устаревших классов', () => {
    const { container } = render(<ContactsClientPage contactsData={data} />);
    expect(screen.getByRole('button', { name: /Отправить сообщение/ }).className).toContain('bg-sea');
    expect(container.innerHTML).not.toMatch(FORBIDDEN);
  });
});
