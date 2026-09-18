import { render, screen, fireEvent } from '@testing-library/react';
import MessagesList from './MessagesList';
import { ContactMessageAdmin } from '@/lib/api';

const makeMessage = (overrides: Partial<ContactMessageAdmin>): ContactMessageAdmin => ({
  id: 1,
  name: 'Иван Иванов',
  email: 'ivan@example.com',
  subject: 'Хочу картину',
  message: 'Расскажите про доставку',
  createdAt: '2026-01-01T10:00:00Z',
  status: 'New',
  ...overrides,
});

describe('MessagesList', () => {
  // @S2-AS2: newest-first ordering (as delivered by the backend) is rendered
  // in the same order, and the unread badge shows the count of Status=New.
  it('@S2-AS2 renders messages in the given (newest-first) order with an unread badge', () => {
    const messages = [
      makeMessage({ id: 2, name: 'Второй', status: 'New' }),
      makeMessage({ id: 3, name: 'Третий', status: 'Read' }),
      makeMessage({ id: 1, name: 'Первый', status: 'New' }),
    ];

    render(
      <MessagesList
        messages={messages}
        unreadCount={2}
        onOpen={jest.fn()}
        onArchive={jest.fn()}
        filter="active"
        onFilterChange={jest.fn()}
      />
    );

    const rows = screen.getAllByRole('row').slice(1); // skip header row
    expect(rows[0]).toHaveTextContent('Второй');
    expect(rows[1]).toHaveTextContent('Третий');
    expect(rows[2]).toHaveTextContent('Первый');

    expect(screen.getByTestId('unread-badge')).toHaveTextContent('2');
  });

  // @S2-AS3: opening a message triggers onOpen with its id (page wires this
  // to the API call that flips Status New -> Read).
  it('@S2-AS3 calls onOpen with the message id when "Открыть" is clicked', () => {
    const onOpen = jest.fn();
    const messages = [makeMessage({ id: 42, status: 'New' })];

    render(
      <MessagesList
        messages={messages}
        unreadCount={1}
        onOpen={onOpen}
        onArchive={jest.fn()}
        filter="active"
        onFilterChange={jest.fn()}
      />
    );

    fireEvent.click(screen.getByText('Открыть'));
    expect(onOpen).toHaveBeenCalledWith(42);
  });

  // @S2-AS4: archiving a Read message triggers onArchive with its id.
  it('@S2-AS4 calls onArchive with the message id when "Архивировать" is clicked', () => {
    const onArchive = jest.fn();
    const messages = [makeMessage({ id: 7, status: 'Read' })];

    render(
      <MessagesList
        messages={messages}
        unreadCount={0}
        onOpen={jest.fn()}
        onArchive={onArchive}
        filter="active"
        onFilterChange={jest.fn()}
      />
    );

    fireEvent.click(screen.getByText('Архивировать'));
    expect(onArchive).toHaveBeenCalledWith(7);
  });

  // @S2-AS5: empty list renders an empty state without error, and no badge
  // is shown when there are no unread messages.
  it('@S2-AS5 renders an empty state and hides the badge when there are no messages', () => {
    render(
      <MessagesList
        messages={[]}
        unreadCount={0}
        onOpen={jest.fn()}
        onArchive={jest.fn()}
        filter="active"
        onFilterChange={jest.fn()}
      />
    );

    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    expect(screen.queryByTestId('unread-badge')).not.toBeInTheDocument();
  });
});
