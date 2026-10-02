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
    expect(button).toHaveClass('bg-primary');
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
});
