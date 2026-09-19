import { render, screen, fireEvent } from '@testing-library/react';
import ReviewsList from './ReviewsList';
import { ReviewAdmin } from '@/lib/api';

const published: ReviewAdmin = {
  id: 1,
  authorName: 'Ольга',
  text: 'Прекрасные работы',
  rating: 5,
  createdAt: '2026-01-01T00:00:00Z',
  isPublished: true,
  sortOrder: 0,
};

const unpublished: ReviewAdmin = {
  id: 2,
  authorName: 'Иван',
  text: 'Хорошая выставка',
  rating: 4,
  createdAt: '2026-01-02T00:00:00Z',
  isPublished: false,
  sortOrder: 1,
};

const toDelete: ReviewAdmin = {
  id: 3,
  authorName: 'C',
  text: 'Удалить меня',
  rating: 3,
  createdAt: '2026-01-03T00:00:00Z',
  isPublished: false,
  sortOrder: 2,
};

const noop = () => {};

describe('ReviewsList', () => {
  // @S5-AS2: both a published and an unpublished review render with a
  // visible, distinct status indicator.
  it('[S5-AS2] shows both reviews with an explicit publication status indicator', () => {
    render(
      <ReviewsList reviews={[published, unpublished]} onPublish={noop} onUnpublish={noop} onEdit={noop} onDelete={noop} />
    );

    expect(screen.getByText('Ольга')).toBeInTheDocument();
    expect(screen.getByText('Иван')).toBeInTheDocument();
    expect(screen.getByTestId('review-status-1')).toHaveTextContent('Опубликован');
    expect(screen.getByTestId('review-status-2')).toHaveTextContent('Не опубликован');
  });

  // @S5-AS3: clicking "Опубликовать" on an unpublished review notifies the
  // parent with that review's id so it can call the publish API.
  it('[S5-AS3] clicking "Опубликовать" invokes onPublish with the review id', () => {
    const onPublish = jest.fn();
    render(
      <ReviewsList reviews={[unpublished]} onPublish={onPublish} onUnpublish={noop} onEdit={noop} onDelete={noop} />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Опубликовать' }));

    expect(onPublish).toHaveBeenCalledWith(2);
  });

  // @S5-AS3: once the parent's state reflects the publish (re-render with
  // isPublished: true), the status badge flips without any full page reload
  // being necessary — the component alone re-renders from new props.
  it('[S5-AS3] reflects the updated status after props change, without a reload', () => {
    const { rerender } = render(
      <ReviewsList reviews={[unpublished]} onPublish={noop} onUnpublish={noop} onEdit={noop} onDelete={noop} />
    );
    expect(screen.getByTestId('review-status-2')).toHaveTextContent('Не опубликован');

    rerender(
      <ReviewsList
        reviews={[{ ...unpublished, isPublished: true, publishedAt: '2026-01-05T00:00:00Z' }]}
        onPublish={noop}
        onUnpublish={noop}
        onEdit={noop}
        onDelete={noop}
      />
    );

    // The status flips from an ordinary props update — no navigation or
    // window.location.reload() call is involved anywhere in this path.
    expect(screen.getByTestId('review-status-2')).toHaveTextContent('Опубликован');
  });

  // @S5-AS4: clicking "Снять с публикации" on a published review notifies
  // the parent with that review's id.
  it('[S5-AS4] clicking "Снять с публикации" invokes onUnpublish and the badge flips to unpublished', () => {
    const onUnpublish = jest.fn();
    const { rerender } = render(
      <ReviewsList reviews={[published]} onPublish={noop} onUnpublish={onUnpublish} onEdit={noop} onDelete={noop} />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Снять с публикации' }));
    expect(onUnpublish).toHaveBeenCalledWith(1);

    rerender(
      <ReviewsList
        reviews={[{ ...published, isPublished: false }]}
        onPublish={noop}
        onUnpublish={onUnpublish}
        onEdit={noop}
        onDelete={noop}
      />
    );

    expect(screen.getByTestId('review-status-1')).toHaveTextContent('Не опубликован');
  });

  // @S5-AS5: clicking "Редактировать" hands the parent the whole review so
  // it can open an edit form pre-filled with the current text.
  it('[S5-AS5] clicking "Редактировать" invokes onEdit with the full review', () => {
    const onEdit = jest.fn();
    render(<ReviewsList reviews={[published]} onPublish={noop} onUnpublish={noop} onEdit={onEdit} onDelete={noop} />);

    fireEvent.click(screen.getByRole('button', { name: 'Редактировать' }));

    expect(onEdit).toHaveBeenCalledWith(published);
  });

  // @S5-AS6: deletion requires confirmation — the first click only reveals
  // a confirm prompt, and onDelete fires only once that is confirmed.
  it('[S5-AS6] requires confirmation before calling onDelete, then removes the row', () => {
    const onDelete = jest.fn();
    const { rerender } = render(
      <ReviewsList reviews={[toDelete]} onPublish={noop} onUnpublish={noop} onEdit={noop} onDelete={onDelete} />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Удалить' }));
    expect(onDelete).not.toHaveBeenCalled();
    expect(screen.getByText('Удалить?')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Да' }));
    expect(onDelete).toHaveBeenCalledWith(3);

    rerender(<ReviewsList reviews={[]} onPublish={noop} onUnpublish={noop} onEdit={noop} onDelete={onDelete} />);
    expect(screen.queryByText('Удалить меня')).not.toBeInTheDocument();
  });
});
