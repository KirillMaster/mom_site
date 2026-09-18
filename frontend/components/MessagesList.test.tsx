import { ComponentProps } from 'react';
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

// Every scenario renders the same component with the same six props; only a
// couple of them vary per test. Centralising the defaults here keeps each test
// focused on the one thing it asserts and removes the repeated prop block.
type MessagesListProps = ComponentProps<typeof MessagesList>;

const renderList = (props: Partial<MessagesListProps> = {}) =>
  render(
    <MessagesList
      messages={[]}
      unreadCount={0}
      onOpen={jest.fn()}
      onArchive={jest.fn()}
      filter="active"
      onFilterChange={jest.fn()}
      {...props}
    />
  );

describe('MessagesList', () => {
  // @S2-AS2: newest-first ordering (as delivered by the backend) is rendered
  // in the same order, and the unread badge shows the count of Status=New.
  it('@S2-AS2 renders messages in the given (newest-first) order with an unread badge', () => {
    const messages = [
      makeMessage({ id: 2, name: 'Второй', status: 'New' }),
      makeMessage({ id: 3, name: 'Третий', status: 'Read' }),
      makeMessage({ id: 1, name: 'Первый', status: 'New' }),
    ];

    renderList({ messages, unreadCount: 2 });

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

    renderList({ messages, unreadCount: 1, onOpen });

    fireEvent.click(screen.getByText('Открыть'));
    expect(onOpen).toHaveBeenCalledWith(42);
  });

  // @S2-AS4: archiving a Read message triggers onArchive with its id.
  it('@S2-AS4 calls onArchive with the message id when "Архивировать" is clicked', () => {
    const onArchive = jest.fn();
    const messages = [makeMessage({ id: 7, status: 'Read' })];

    renderList({ messages, onArchive });

    fireEvent.click(screen.getByText('Архивировать'));
    expect(onArchive).toHaveBeenCalledWith(7);
  });

  // @S2-AS5: empty list renders an empty state without error, and no badge
  // is shown when there are no unread messages.
  it('@S2-AS5 renders an empty state and hides the badge when there are no messages', () => {
    renderList();

    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    expect(screen.queryByTestId('unread-badge')).not.toBeInTheDocument();
  });

  // @S2-AS2-EXT: unread badge must be hidden when unreadCount is 0,
  // even if the message list is non-empty (e.g., all Read or Archived).
  it('@S2-AS2-EXT hides the unread badge when unreadCount is 0 but messages exist', () => {
    const messages = [
      makeMessage({ id: 1, name: 'ReadMessage', status: 'Read' }),
      makeMessage({ id: 2, name: 'AnotherRead', status: 'Read' }),
    ];

    renderList({ messages });

    // Messages should be rendered
    expect(screen.getByText('ReadMessage')).toBeInTheDocument();
    expect(screen.getByText('AnotherRead')).toBeInTheDocument();
    // Badge must not be present when count is 0
    expect(screen.queryByTestId('unread-badge')).not.toBeInTheDocument();
  });

  // @S2-AS2-EXT: unread badge must be visible and show correct count
  // when unreadCount > 0, distinguishing New from Read visually.
  it('@S2-AS2-EXT displays unread badge with count when there are unread messages', () => {
    const messages = [
      makeMessage({ id: 1, name: 'FirstNew', status: 'New' }),
      makeMessage({ id: 2, name: 'SecondRead', status: 'Read' }),
      makeMessage({ id: 3, name: 'ThirdNew', status: 'New' }),
    ];

    renderList({ messages, unreadCount: 2 });

    const badge = screen.getByTestId('unread-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('2');
  });

  // @S2-AS5-EXT: empty state for archived filter when no archived messages exist.
  it('@S2-AS5-EXT renders empty state for archived filter with no archived messages', () => {
    renderList({ filter: 'archived' });

    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
  });

  // @S2-AS3-EXT: clicking "Открыть" on a Read message still calls onOpen.
  it('@S2-AS3-EXT calls onOpen for Read messages as well as New', () => {
    const onOpen = jest.fn();
    const messages = [makeMessage({ id: 5, status: 'Read', name: 'ReadMsg' })];

    renderList({ messages, onOpen });

    fireEvent.click(screen.getByText('Открыть'));
    expect(onOpen).toHaveBeenCalledWith(5);
  });

  // @S2-AS4-EXT: archive button is not shown for Archived messages,
  // but is shown for non-archived (New and Read).
  it('@S2-AS4-EXT does not show archive button for Archived messages', () => {
    const messages = [
      makeMessage({ id: 1, status: 'New' }),
      makeMessage({ id: 2, status: 'Archived' }),
    ];

    renderList({ messages, unreadCount: 1 });

    // Both messages should have "Открыть" button
    const openButtons = screen.getAllByText('Открыть');
    expect(openButtons).toHaveLength(2);

    // Only New message should have "Архивировать" button (Archived row should not)
    const archiveButtons = screen.getAllByText('Архивировать');
    expect(archiveButtons).toHaveLength(1); // Only for the New message
  });

  // @S2-AS2-EXT: New messages should be visually distinguishable from Read ones
  // (e.g., bold text, different color, or icon).
  it('@S2-AS2-EXT renders New messages with distinct visual styling (bold and background)', () => {
    const messages = [
      makeMessage({ id: 1, name: 'NewMsg', status: 'New' }),
      makeMessage({ id: 2, name: 'ReadMsg', status: 'Read' }),
    ];

    renderList({ messages, unreadCount: 1 });

    // Find the rows
    const rows = screen.getAllByRole('row').slice(1); // skip header
    const newRow = rows[0]; // NewMsg (newest)
    const readRow = rows[1]; // ReadMsg

    // New message row should have bold font (font-semibold) and background (bg-primary-50)
    expect(newRow).toHaveClass('font-semibold');
    expect(newRow).toHaveClass('bg-primary-50');

    // Read message row should not have these classes
    expect(readRow).not.toHaveClass('font-semibold');
    expect(readRow).not.toHaveClass('bg-primary-50');
  });

  // @S2-AS5-EXT: long names, emails, and subjects are handled without breaking layout.
  it('@S2-AS5-EXT handles long message names and subjects without breaking', () => {
    const longName = 'A'.repeat(100);
    const longSubject = 'B'.repeat(100);
    const messages = [
      makeMessage({
        id: 1,
        name: longName,
        subject: longSubject,
        status: 'Read',
      }),
    ];

    renderList({ messages });

    // Should render without crashing and content should be in the document
    expect(screen.getByText(longName)).toBeInTheDocument();
    expect(screen.getByText(longSubject)).toBeInTheDocument();
  });
});
