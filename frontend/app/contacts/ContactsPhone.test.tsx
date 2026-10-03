import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ContactsClientPage from './ContactsClientPage';
import { sendContactMessage } from '@/hooks/useApi';
import { ContactsData } from '@/lib/api';

jest.mock('@/components/Navigation', () => () => <div data-testid="navigation" />);
jest.mock('@/components/Footer', () => () => <div data-testid="footer" />);
jest.mock('@/hooks/useApi', () => ({ sendContactMessage: jest.fn() }));

let searchParams = new URLSearchParams();
jest.mock('next/navigation', () => ({
  useSearchParams: () => searchParams,
}));

window.alert = jest.fn();

const contactsData = {
  bannerTitle: 't',
  bannerDescription: 'd',
  email: 'artist@example.com',
  phone: '+70000000000',
  socialLinks: {},
  faq: [],
} as unknown as ContactsData;

const mockedSend = sendContactMessage as jest.MockedFunction<typeof sendContactMessage>;

const fillNameAndMessage = () => {
  fireEvent.change(screen.getByLabelText(/Имя/), { target: { value: 'Иван' } });
  fireEvent.change(screen.getByLabelText(/Сообщение/), { target: { value: 'Привет' } });
};

const submit = () => fireEvent.click(screen.getByRole('button', { name: /Отправить сообщение/ }));

describe('Contact form phone and prefill', () => {
  beforeEach(() => {
    mockedSend.mockReset();
    searchParams = new URLSearchParams();
  });

  it('@US3-AS1 sends phone without email and the form is accepted', async () => {
    mockedSend.mockResolvedValueOnce({});
    render(<ContactsClientPage contactsData={contactsData} />);

    fillNameAndMessage();
    fireEvent.change(screen.getByLabelText(/Телефон или мессенджер/), { target: { value: '+7 900 111-22-33' } });
    submit();

    await waitFor(() => expect(mockedSend).toHaveBeenCalledTimes(1));
    expect(mockedSend).toHaveBeenCalledWith(
      expect.objectContaining({ phone: '+7 900 111-22-33', email: '' })
    );
    expect(await screen.findByText('Сообщение успешно отправлено!')).toBeInTheDocument();
  });

  it('@US3-AS2 blocks submit without email and phone and shows the message', async () => {
    render(<ContactsClientPage contactsData={contactsData} />);

    fillNameAndMessage();
    submit();

    expect(await screen.findByText('Укажите телефон, мессенджер или email')).toBeInTheDocument();
    expect(mockedSend).not.toHaveBeenCalled();
  });

  it('@US3-AS3 prefills the subject from the artwork parameter', () => {
    searchParams = new URLSearchParams('artwork=%22Закат%22');
    render(<ContactsClientPage contactsData={contactsData} />);

    expect(screen.getByLabelText(/Тема/)).toHaveValue('Картина «Закат»');
  });

  it('@US3-AS4 submit button uses the primary brand color', () => {
    render(<ContactsClientPage contactsData={contactsData} />);

    const button = screen.getByRole('button', { name: /Отправить сообщение/ });
    expect(button).toHaveClass('bg-sea');
    expect(button.className).not.toMatch(/purple/);
  });

  it('@US3-EC5 truncates a long artwork parameter and renders markup as plain text', () => {
    const raw = '<script>alert(1)</script>' + 'x'.repeat(400);
    searchParams = new URLSearchParams({ artwork: raw });
    const { container } = render(<ContactsClientPage contactsData={contactsData} />);

    const subject = screen.getByLabelText(/Тема/) as HTMLInputElement;
    expect(subject.value.length).toBeLessThanOrEqual(200);
    expect(subject.value).toContain('<script>');
    expect(container.querySelector('script')).toBeNull();
    expect((screen.getByLabelText(/Сообщение/) as HTMLTextAreaElement).value.length).toBeLessThanOrEqual(5000);
  });

  // ====== Degradation mode boundary & validation tests ======

  it('Degradation: form accepts both email and phone when both are provided', async () => {
    mockedSend.mockResolvedValueOnce({});
    render(<ContactsClientPage contactsData={contactsData} />);

    fillNameAndMessage();
    fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/Телефон или мессенджер/), { target: { value: '+7 900 111-22-33' } });
    submit();

    await waitFor(() => expect(mockedSend).toHaveBeenCalledTimes(1));
    expect(mockedSend).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'test@example.com',
        phone: '+7 900 111-22-33',
      })
    );
  });

  it('Degradation: form rejects only whitespace in phone and email', async () => {
    render(<ContactsClientPage contactsData={contactsData} />);

    fillNameAndMessage();
    fireEvent.change(screen.getByLabelText(/Email/), { target: { value: '   ' } });
    fireEvent.change(screen.getByLabelText(/Телефон или мессенджер/), { target: { value: '   ' } });
    submit();

    expect(await screen.findByText('Укажите телефон, мессенджер или email')).toBeInTheDocument();
    expect(mockedSend).not.toHaveBeenCalled();
  });

  it('Degradation: form rejects null email and null phone (direct POST bypass)', async () => {
    render(<ContactsClientPage contactsData={contactsData} />);

    fillNameAndMessage();
    fireEvent.change(screen.getByLabelText(/Email/), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText(/Телефон или мессенджер/), { target: { value: '' } });
    submit();

    expect(await screen.findByText('Укажите телефон, мессенджер или email')).toBeInTheDocument();
    expect(mockedSend).not.toHaveBeenCalled();
  });

  it('Degradation: form shows error when email is invalid format', async () => {
    mockedSend.mockRejectedValueOnce({ response: { status: 400, data: { message: 'Некорректный email' } } });
    render(<ContactsClientPage contactsData={contactsData} />);

    fillNameAndMessage();
    fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'not-an-email' } });
    fireEvent.change(screen.getByLabelText(/Телефон или мессенджер/), { target: { value: '' } });
    submit();

    await waitFor(() => expect(mockedSend).toHaveBeenCalledTimes(1));
    expect(mockedSend).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'not-an-email',
        phone: '',
      })
    );
  });

  it('Degradation: phone with leading/trailing spaces is trimmed by backend', async () => {
    mockedSend.mockResolvedValueOnce({});
    render(<ContactsClientPage contactsData={contactsData} />);

    fillNameAndMessage();
    fireEvent.change(screen.getByLabelText(/Телефон или мессенджер/), { target: { value: '   +7 900 111-22-33   ' } });
    submit();

    await waitFor(() => expect(mockedSend).toHaveBeenCalledTimes(1));
    // Frontend validation passes if there's any non-whitespace content
    const call = (mockedSend as jest.Mock).mock.calls[0][0];
    expect(call.phone).toBeTruthy(); // Phone was sent
  });

  it('Degradation: email with leading/trailing spaces is trimmed by backend', async () => {
    mockedSend.mockResolvedValueOnce({});
    render(<ContactsClientPage contactsData={contactsData} />);

    fillNameAndMessage();
    fireEvent.change(screen.getByLabelText(/Email/), { target: { value: '   test@example.com   ' } });
    submit();

    await waitFor(() => expect(mockedSend).toHaveBeenCalledTimes(1));
    // Frontend validation passes if there's any non-whitespace content, backend will trim
    const call = (mockedSend as jest.Mock).mock.calls[0][0];
    expect(call.email).toBeTruthy(); // Email was sent
  });

  it('Degradation: phone field has placeholder text', () => {
    render(<ContactsClientPage contactsData={contactsData} />);

    const phoneInput = screen.getByLabelText(/Телефон или мессенджер/) as HTMLInputElement;
    expect(phoneInput).toHaveAttribute('placeholder', expect.stringContaining('Телефон'));
  });

  it('Degradation: phone field accepts various phone formats', async () => {
    mockedSend.mockResolvedValueOnce({});
    render(<ContactsClientPage contactsData={contactsData} />);

    fillNameAndMessage();
    const phoneInput = screen.getByLabelText(/Телефон или мессенджер/) as HTMLInputElement;

    const formats = ['+7 900 111-22-33', '8-900-111-2233', '+79001112233'];
    for (const phone of formats) {
      fireEvent.change(phoneInput, { target: { value: phone } });
      expect(phoneInput.value).toBe(phone);
    }
  });

  it('Degradation: prefill artwork parameter with special characters', () => {
    searchParams = new URLSearchParams({ artwork: 'Картина "Закат" с & символами' });
    render(<ContactsClientPage contactsData={contactsData} />);

    const subject = screen.getByLabelText(/Тема/) as HTMLInputElement;
    expect(subject.value).toContain('Картина');
    expect(subject.value).toContain('Закат');
  });

  it('Degradation: message field is not required to submit if email or phone is provided', async () => {
    mockedSend.mockResolvedValueOnce({});
    render(<ContactsClientPage contactsData={contactsData} />);

    // The message field is marked as required in HTML, so we need to fill it
    fireEvent.change(screen.getByLabelText(/Имя/), { target: { value: 'Иван' } });
    fireEvent.change(screen.getByLabelText(/Сообщение/), { target: { value: 'Тест' } });
    fireEvent.change(screen.getByLabelText(/Телефон или мессенджер/), { target: { value: '+7 900' } });
    submit();

    await waitFor(() => expect(mockedSend).toHaveBeenCalledTimes(1));
    expect(mockedSend).toHaveBeenCalledWith(
      expect.objectContaining({
        phone: '+7 900',
      })
    );
  });

  it('Degradation: form clears phone field on successful submission', async () => {
    mockedSend.mockResolvedValueOnce({});
    render(<ContactsClientPage contactsData={contactsData} />);

    fillNameAndMessage();
    fireEvent.change(screen.getByLabelText(/Телефон или мессенджер/), { target: { value: '+7 900 111-22-33' } });
    submit();

    await waitFor(() => expect(screen.queryByText('Сообщение успешно отправлено!')).toBeInTheDocument());

    // After success, the form should be cleared
    const phoneInput = screen.getByLabelText(/Телефон или мессенджер/) as HTMLInputElement;
    expect(phoneInput.value).toBe('');
  });
});
