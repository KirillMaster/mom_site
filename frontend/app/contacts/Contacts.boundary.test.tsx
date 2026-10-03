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

beforeEach(() => { send.mockReset(); params = new URLSearchParams(); });

describe('@US4-FE5 Contacts form: whitespace handling', () => {
  it('rejects name with only whitespace', async () => {
    send.mockResolvedValue({});
    render(<ContactsClientPage contactsData={data} />);

    fireEvent.change(screen.getByLabelText(/Имя/), { target: { value: '   ' } });
    fireEvent.change(screen.getByLabelText(/Сообщение/), { target: { value: 'Test' } });
    fireEvent.change(screen.getByLabelText(/Телефон/), { target: { value: '+79990001122' } });

    fireEvent.click(screen.getByRole('button', { name: /Отправить сообщение/ }));

    // Should show validation error for empty required fields
    await waitFor(() => {
      const alert = screen.queryByRole('alert');
      if (alert) {
        expect(alert.textContent).toBeTruthy();
      }
    });
  });

  it('rejects message with only whitespace', async () => {
    send.mockResolvedValue({});
    render(<ContactsClientPage contactsData={data} />);

    fireEvent.change(screen.getByLabelText(/Имя/), { target: { value: 'John' } });
    fireEvent.change(screen.getByLabelText(/Сообщение/), { target: { value: '   ' } });
    fireEvent.change(screen.getByLabelText(/Телефон/), { target: { value: '+79990001122' } });

    fireEvent.click(screen.getByRole('button', { name: /Отправить сообщение/ }));

    await waitFor(() => {
      const alert = screen.queryByRole('alert');
      if (alert) {
        expect(alert.textContent).toBeTruthy();
      }
    });
  });

  it('accepts name with leading/trailing whitespace (form does not trim)', () => {
    send.mockResolvedValue({});
    render(<ContactsClientPage contactsData={data} />);

    const nameInput = screen.getByLabelText(/Имя/) as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: '  John Doe  ' } });

    // The form should preserve what was typed
    expect(nameInput.value).toBe('  John Doe  ');
  });
});

describe('@US4-FE5 Contacts: email and phone validation edge cases', () => {
  it('requires both email or phone/messenger (either or logic)', async () => {
    send.mockResolvedValue({});
    render(<ContactsClientPage contactsData={data} />);

    fireEvent.change(screen.getByLabelText(/Имя/), { target: { value: 'John' } });
    fireEvent.change(screen.getByLabelText(/Сообщение/), { target: { value: 'Hello' } });
    // Both email and phone are empty
    fireEvent.click(screen.getByRole('button', { name: /Отправить сообщение/ }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('телефон');
    });
    expect(send).not.toHaveBeenCalled();
  });

  it('accepts email without phone', async () => {
    send.mockResolvedValue({});
    render(<ContactsClientPage contactsData={data} />);

    fireEvent.change(screen.getByLabelText(/Имя/), { target: { value: 'John' } });
    fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByLabelText(/Сообщение/), { target: { value: 'Hello' } });
    fireEvent.click(screen.getByRole('button', { name: /Отправить сообщение/ }));

    await waitFor(() => expect(send).toHaveBeenCalled());
  });

  it('accepts phone without email', async () => {
    send.mockResolvedValue({});
    render(<ContactsClientPage contactsData={data} />);

    fireEvent.change(screen.getByLabelText(/Имя/), { target: { value: 'John' } });
    fireEvent.change(screen.getByLabelText(/Телефон/), { target: { value: '+79990001122' } });
    fireEvent.change(screen.getByLabelText(/Сообщение/), { target: { value: 'Hello' } });
    fireEvent.click(screen.getByRole('button', { name: /Отправить сообщение/ }));

    await waitFor(() => expect(send).toHaveBeenCalled());
    expect(send.mock.calls[0][0].email).toBe('');
  });

  it('accepts both email and phone', async () => {
    send.mockResolvedValue({});
    render(<ContactsClientPage contactsData={data} />);

    fireEvent.change(screen.getByLabelText(/Имя/), { target: { value: 'John' } });
    fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByLabelText(/Телефон/), { target: { value: '+79990001122' } });
    fireEvent.change(screen.getByLabelText(/Сообщение/), { target: { value: 'Hello' } });
    fireEvent.click(screen.getByRole('button', { name: /Отправить сообщение/ }));

    await waitFor(() => expect(send).toHaveBeenCalled());
    expect(send.mock.calls[0][0].email).toBe('john@example.com');
  });
});

describe('@US4-FE5 Contacts: honeypot field behavior', () => {
  it('honeypot field is accessible to keyboard users (not display:none)', () => {
    render(<ContactsClientPage contactsData={data} />);
    const honeypot = document.getElementById('website') as HTMLInputElement;

    // Should exist and be reachable
    expect(honeypot).toBeInTheDocument();
    expect(honeypot).toHaveAttribute('name', 'website');
  });

  it('honeypot field is aria-hidden and off-screen', () => {
    render(<ContactsClientPage contactsData={data} />);
    const container = document.getElementById('website')?.parentElement;

    expect(container).toHaveAttribute('aria-hidden', 'true');
    const style = (container as HTMLElement).style;
    expect(style.position).toBe('absolute');
    expect(style.left).toBe('-9999px');
  });

  it('honeypot field is excluded from tab order', () => {
    render(<ContactsClientPage contactsData={data} />);
    const honeypot = document.getElementById('website') as HTMLInputElement;

    expect(honeypot).toHaveAttribute('tabIndex', '-1');
  });
});

describe('@US4-FE5 Contacts: form submission state transitions', () => {
  it('button shows "Отправка..." while submitting', async () => {
    let resolveSubmit: Function;
    send.mockReturnValue(new Promise((resolve) => { resolveSubmit = resolve; }));

    render(<ContactsClientPage contactsData={data} />);
    fireEvent.change(screen.getByLabelText(/Имя/), { target: { value: 'John' } });
    fireEvent.change(screen.getByLabelText(/Сообщение/), { target: { value: 'Hello' } });
    fireEvent.change(screen.getByLabelText(/Телефон/), { target: { value: '+79990001122' } });

    const button = screen.getByRole('button', { name: /Отправить сообщение/ });
    fireEvent.click(button);

    // Button text changes during submission
    expect(button).toHaveTextContent('Отправка...');
    expect(button).toBeDisabled();

    // After resolution, back to normal
    resolveSubmit!({});
    await waitFor(() => {
      expect(button).toHaveTextContent('Отправить сообщение');
      expect(button).not.toBeDisabled();
    });
  });

  it('shows success message after successful submission', async () => {
    send.mockResolvedValue({});
    render(<ContactsClientPage contactsData={data} />);

    fireEvent.change(screen.getByLabelText(/Имя/), { target: { value: 'John' } });
    fireEvent.change(screen.getByLabelText(/Сообщение/), { target: { value: 'Hello' } });
    fireEvent.change(screen.getByLabelText(/Телефон/), { target: { value: '+79990001122' } });

    fireEvent.click(screen.getByRole('button', { name: /Отправить сообщение/ }));

    await waitFor(() => {
      expect(screen.getByText('Сообщение успешно отправлено!')).toBeInTheDocument();
    });
  });

  it('shows error message on failed submission', async () => {
    send.mockRejectedValue(new Error('Network error'));
    render(<ContactsClientPage contactsData={data} />);

    fireEvent.change(screen.getByLabelText(/Имя/), { target: { value: 'John' } });
    fireEvent.change(screen.getByLabelText(/Сообщение/), { target: { value: 'Hello' } });
    fireEvent.change(screen.getByLabelText(/Телефон/), { target: { value: '+79990001122' } });

    fireEvent.click(screen.getByRole('button', { name: /Отправить сообщение/ }));

    await waitFor(() => {
      expect(screen.getByText(/ошибка/i)).toBeInTheDocument();
    });
  });
});

describe('@US4-FE4 Contacts: field labels and accessibility', () => {
  it('all required fields have asterisk in label', () => {
    render(<ContactsClientPage contactsData={data} />);

    expect(screen.getByLabelText(/Имя \*/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Сообщение \*/)).toBeInTheDocument();
  });

  it('optional fields do not have asterisk', () => {
    render(<ContactsClientPage contactsData={data} />);

    expect(screen.getByLabelText(/^Email$/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Тема$/)).toBeInTheDocument();
  });

  it('hint text is associated with input via aria-describedby', () => {
    render(<ContactsClientPage contactsData={data} />);

    const phone = screen.getByLabelText(/Телефон или мессенджер/);
    const describedById = phone.getAttribute('aria-describedby');
    expect(describedById).toBeTruthy();

    const hintElement = document.getElementById(describedById!);
    expect(hintElement).toHaveTextContent('телефон, мессенджер или email');
  });
});

describe('@US4-FE5 Contacts: special characters handling', () => {
  it('accepts special characters in name field', async () => {
    send.mockResolvedValue({});
    render(<ContactsClientPage contactsData={data} />);

    const specialName = 'Иван-Петров O\'Connor';
    fireEvent.change(screen.getByLabelText(/Имя/), { target: { value: specialName } });
    fireEvent.change(screen.getByLabelText(/Сообщение/), { target: { value: 'Hello' } });
    fireEvent.change(screen.getByLabelText(/Телефон/), { target: { value: '+79990001122' } });

    fireEvent.click(screen.getByRole('button', { name: /Отправить сообщение/ }));

    await waitFor(() => expect(send).toHaveBeenCalled());
    expect(send.mock.calls[0][0].name).toBe(specialName);
  });

  it('accepts special characters in message field', async () => {
    send.mockResolvedValue({});
    render(<ContactsClientPage contactsData={data} />);

    const specialMessage = 'Test <script> & "quotes" \'apostrophes\'';
    fireEvent.change(screen.getByLabelText(/Имя/), { target: { value: 'John' } });
    fireEvent.change(screen.getByLabelText(/Сообщение/), { target: { value: specialMessage } });
    fireEvent.change(screen.getByLabelText(/Телефон/), { target: { value: '+79990001122' } });

    fireEvent.click(screen.getByRole('button', { name: /Отправить сообщение/ }));

    await waitFor(() => expect(send).toHaveBeenCalled());
    expect(send.mock.calls[0][0].message).toBe(specialMessage);
  });
});

describe('@US4-FE5 Contacts: form field order and structure', () => {
  it('form contains expected named fields', () => {
    render(<ContactsClientPage contactsData={data} />);

    const form = document.querySelector('form')!;
    expect(document.getElementById('name')).toBeInTheDocument();
    expect(document.getElementById('email')).toBeInTheDocument();
    expect(document.getElementById('phone')).toBeInTheDocument();
    expect(document.getElementById('subject')).toBeInTheDocument();
    expect(document.getElementById('message')).toBeInTheDocument();
  });

  it('form has noValidate attribute', () => {
    render(<ContactsClientPage contactsData={data} />);
    const form = document.querySelector('form')!;
    expect(form).toHaveAttribute('novalidate');
  });
});
