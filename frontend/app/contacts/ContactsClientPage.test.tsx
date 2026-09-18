import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ContactsClientPage from './ContactsClientPage';
import { sendContactMessage } from '@/hooks/useApi';
import { ContactsData } from '@/lib/api';

jest.mock('@/components/Navigation', () => () => <div data-testid="navigation" />);
jest.mock('@/components/Footer', () => () => <div data-testid="footer" />);
jest.mock('framer-motion', () => {
  const React = require('react');
  const passthrough = (Tag: any) => ({ children, ...props }: any) => {
    const {
      initial, animate, whileInView, transition, viewport, exit, ...rest
    } = props;
    return React.createElement(Tag, rest, children);
  };
  return {
    motion: new Proxy(
      {},
      {
        get: (_target, tag: string) => passthrough(tag),
      }
    ),
    AnimatePresence: ({ children }: any) => <>{children}</>,
  };
});
jest.mock('@/hooks/useApi', () => ({
  sendContactMessage: jest.fn(),
}));

window.alert = jest.fn();

const contactsData: ContactsData = {
  bannerTitle: 'Свяжитесь со мной',
  bannerDescription: 'desc',
  email: 'artist@example.com',
  phone: '+70000000000',
  socialLinks: {},
  faq: [],
} as unknown as ContactsData;

const mockedSendContactMessage = sendContactMessage as jest.MockedFunction<typeof sendContactMessage>;

const fillRequiredFields = () => {
  fireEvent.change(screen.getByLabelText(/Имя/), { target: { value: 'Иван' } });
  fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'ivan@example.com' } });
  fireEvent.change(screen.getByLabelText(/Сообщение/), { target: { value: 'Привет' } });
};

describe('ContactsClientPage honeypot & error handling (@S3)', () => {
  beforeEach(() => {
    mockedSendContactMessage.mockReset();
  });

  it('renders a honeypot "website" field hidden from real users and not blocking focus/tab order (@S3-AS1, @S3-AS2)', () => {
    render(<ContactsClientPage contactsData={contactsData} />);

    const honeypot = document.getElementById('website') as HTMLInputElement;
    expect(honeypot).not.toBeNull();
    expect(honeypot).toHaveAttribute('tabindex', '-1');
    expect(honeypot).toHaveAttribute('autocomplete', 'off');
    expect(honeypot.value).toBe('');

    const wrapper = honeypot.closest('[aria-hidden="true"]');
    expect(wrapper).not.toBeNull();
  });

  it('submits successfully with an empty honeypot field, sending it along in the payload (@S3-AS2)', async () => {
    mockedSendContactMessage.mockResolvedValueOnce({});
    render(<ContactsClientPage contactsData={contactsData} />);

    fillRequiredFields();
    fireEvent.click(screen.getByRole('button', { name: /Отправить сообщение/ }));

    await waitFor(() => expect(mockedSendContactMessage).toHaveBeenCalledTimes(1));
    expect(mockedSendContactMessage).toHaveBeenCalledWith(
      expect.objectContaining({ website: '' })
    );
    expect(await screen.findByText('Сообщение успешно отправлено!')).toBeInTheDocument();
  });

  it('shows a rate-limit specific message when the server responds 429, not a generic error (@S3-AS3)', async () => {
    mockedSendContactMessage.mockRejectedValueOnce({ response: { status: 429 } });
    render(<ContactsClientPage contactsData={contactsData} />);

    fillRequiredFields();
    fireEvent.click(screen.getByRole('button', { name: /Отправить сообщение/ }));

    const message = await screen.findByText(/Слишком много запросов/);
    expect(message).toBeInTheDocument();
    expect(screen.queryByText('Произошла ошибка при отправке сообщения.')).not.toBeInTheDocument();
  });

  it('shows the generic error message for non-429 failures', async () => {
    mockedSendContactMessage.mockRejectedValueOnce({ response: { status: 500 } });
    render(<ContactsClientPage contactsData={contactsData} />);

    fillRequiredFields();
    fireEvent.click(screen.getByRole('button', { name: /Отправить сообщение/ }));

    expect(await screen.findByText('Произошла ошибка при отправке сообщения.')).toBeInTheDocument();
  });
});
