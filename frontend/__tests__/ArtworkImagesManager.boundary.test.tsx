import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ArtworkImagesManager from '@/components/admin/ArtworkImagesManager';
import { deleteArtworkImage, reorderArtworkImages } from '@/lib/artworkImagesApi';

jest.mock('@/lib/artworkImagesApi');
jest.mock('@/hooks/useApi', () => ({ getImageUrl: (p: string) => p }));

const mk = (n: number) => Array.from({ length: n }, (_, i) => ({ id: i + 1, imagePath: `p${i}`, thumbnailPath: `t${i}`, sortOrder: i }));
const reorder = reorderArtworkImages as jest.Mock;
const del = deleteArtworkImage as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('@US1-AS2 граничные перемещения', () => {
  it('first photo cannot move left', async () => {
    render(<ArtworkImagesManager artworkId={7} images={mk(3)} onChange={jest.fn()} />);
    const leftBtn = screen.getByLabelText('Переместить фото 1 влево');
    expect(leftBtn).toBeDisabled();
    fireEvent.click(leftBtn);
    expect(reorder).not.toHaveBeenCalled();
  });

  it('last photo cannot move right', async () => {
    render(<ArtworkImagesManager artworkId={7} images={mk(3)} onChange={jest.fn()} />);
    const rightBtn = screen.getByLabelText('Переместить фото 3 вправо');
    expect(rightBtn).toBeDisabled();
    fireEvent.click(rightBtn);
    expect(reorder).not.toHaveBeenCalled();
  });

  it('moves first photo to position 1 (left boundary adjacent)', async () => {
    reorder.mockResolvedValue(mk(3));
    render(<ArtworkImagesManager artworkId={7} images={mk(3)} onChange={jest.fn()} />);
    fireEvent.click(screen.getByLabelText('Переместить фото 2 влево'));
    await waitFor(() => expect(reorder).toHaveBeenCalledWith(7, [2, 1, 3]));
  });

  it('moves last photo to penultimate position (right boundary adjacent)', async () => {
    reorder.mockResolvedValue(mk(3));
    render(<ArtworkImagesManager artworkId={7} images={mk(3)} onChange={jest.fn()} />);
    fireEvent.click(screen.getByLabelText('Переместить фото 2 вправо'));
    await waitFor(() => expect(reorder).toHaveBeenCalledWith(7, [1, 3, 2]));
  });

  it('makes middle photo cover (moves to 0)', async () => {
    reorder.mockResolvedValue(mk(5));
    render(<ArtworkImagesManager artworkId={7} images={mk(5)} onChange={jest.fn()} />);
    fireEvent.click(screen.getByLabelText('Сделать обложкой фото 3'));
    await waitFor(() => expect(reorder).toHaveBeenCalledWith(7, [3, 1, 2, 4, 5]));
  });

  it('makes last photo cover (moves from index 4 to 0)', async () => {
    reorder.mockResolvedValue(mk(5));
    render(<ArtworkImagesManager artworkId={7} images={mk(5)} onChange={jest.fn()} />);
    fireEvent.click(screen.getByLabelText('Сделать обложкой фото 5'));
    await waitFor(() => expect(reorder).toHaveBeenCalledWith(7, [5, 1, 2, 3, 4]));
  });

  it('star button hidden for first photo (already cover)', () => {
    render(<ArtworkImagesManager artworkId={7} images={mk(3)} onChange={jest.fn()} />);
    expect(screen.queryByLabelText('Сделать обложкой фото 1')).toBeNull();
    expect(screen.getByLabelText('Сделать обложкой фото 2')).toBeInTheDocument();
  });
});

describe('@US1-AS2 два фото граничные случаи', () => {
  it('with 2 images: first can move right, second can move left', async () => {
    reorder.mockResolvedValue(mk(2));
    render(<ArtworkImagesManager artworkId={7} images={mk(2)} onChange={jest.fn()} />);

    // First can move right
    fireEvent.click(screen.getByLabelText('Переместить фото 1 вправо'));
    await waitFor(() => expect(reorder).toHaveBeenCalledWith(7, [2, 1]));

    reorder.mockClear();
    reorder.mockResolvedValue(mk(2));

    // Second can move left
    fireEvent.click(screen.getByLabelText('Переместить фото 2 влево'));
    await waitFor(() => expect(reorder).toHaveBeenCalledWith(7, [2, 1]));
  });

  it('with 2 images: second photo can be made cover', async () => {
    reorder.mockResolvedValue(mk(2));
    render(<ArtworkImagesManager artworkId={7} images={mk(2)} onChange={jest.fn()} />);
    fireEvent.click(screen.getByLabelText('Сделать обложкой фото 2'));
    await waitFor(() => expect(reorder).toHaveBeenCalledWith(7, [2, 1]));
  });
});

describe('@US1-EC9 удаление граничные случаи', () => {
  it('delete button hidden for single photo', () => {
    render(<ArtworkImagesManager artworkId={7} images={mk(1)} onChange={jest.fn()} />);
    expect(screen.queryByLabelText('Удалить фото 1')).toBeNull();
  });

  it('delete button visible for 2 photos', () => {
    render(<ArtworkImagesManager artworkId={7} images={mk(2)} onChange={jest.fn()} />);
    expect(screen.getByLabelText('Удалить фото 1')).toBeInTheDocument();
    expect(screen.getByLabelText('Удалить фото 2')).toBeInTheDocument();
  });

  it('delete first photo with confirmation', async () => {
    jest.spyOn(window, 'confirm').mockReturnValue(true);
    del.mockResolvedValue(mk(1));
    const onChange = jest.fn();
    render(<ArtworkImagesManager artworkId={7} images={mk(2)} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('Удалить фото 1'));
    await waitFor(() => expect(del).toHaveBeenCalledWith(7, 1));
    expect(onChange).toHaveBeenCalled();
  });

  it('delete last photo with confirmation', async () => {
    jest.spyOn(window, 'confirm').mockReturnValue(true);
    del.mockResolvedValue(mk(1));
    render(<ArtworkImagesManager artworkId={7} images={mk(2)} onChange={jest.fn()} />);
    fireEvent.click(screen.getByLabelText('Удалить фото 2'));
    await waitFor(() => expect(del).toHaveBeenCalledWith(7, 2));
  });

  it('delete many photos (calls API for each individually)', async () => {
    jest.spyOn(window, 'confirm').mockReturnValue(true);
    del.mockResolvedValue(mk(8));
    render(<ArtworkImagesManager artworkId={7} images={mk(9)} onChange={jest.fn()} />);

    fireEvent.click(screen.getByLabelText('Удалить фото 5'));
    await waitFor(() => expect(del).toHaveBeenCalledWith(7, 5));
    expect(del).toHaveBeenCalledTimes(1);
  });
});

describe('@US1 drag-and-drop граничные случаи', () => {
  it('drag first to last position', async () => {
    reorder.mockResolvedValue(mk(4));
    render(<ArtworkImagesManager artworkId={7} images={mk(4)} onChange={jest.fn()} />);
    const items = screen.getAllByTestId('managed-image');
    fireEvent.dragStart(items[0]);
    fireEvent.drop(items[3]);
    await waitFor(() => expect(reorder).toHaveBeenCalledWith(7, [2, 3, 4, 1]));
  });

  it('drag last to first position', async () => {
    reorder.mockResolvedValue(mk(4));
    render(<ArtworkImagesManager artworkId={7} images={mk(4)} onChange={jest.fn()} />);
    const items = screen.getAllByTestId('managed-image');
    fireEvent.dragStart(items[3]);
    fireEvent.drop(items[0]);
    await waitFor(() => expect(reorder).toHaveBeenCalledWith(7, [4, 1, 2, 3]));
  });

  it('drag item onto itself (from === to) does not call API', async () => {
    reorder.mockResolvedValue(mk(3));
    render(<ArtworkImagesManager artworkId={7} images={mk(3)} onChange={jest.fn()} />);
    const items = screen.getAllByTestId('managed-image');
    fireEvent.dragStart(items[1]);
    fireEvent.drop(items[1]);
    expect(reorder).not.toHaveBeenCalled();
  });

  it('drag adjacent items swaps them', async () => {
    reorder.mockResolvedValue(mk(3));
    render(<ArtworkImagesManager artworkId={7} images={mk(3)} onChange={jest.fn()} />);
    const items = screen.getAllByTestId('managed-image');
    fireEvent.dragStart(items[0]);
    fireEvent.drop(items[1]);
    await waitFor(() => expect(reorder).toHaveBeenCalledWith(7, [2, 1, 3]));
  });

  it('clears dragIndex after drop', async () => {
    reorder.mockResolvedValue(mk(2));
    render(<ArtworkImagesManager artworkId={7} images={mk(2)} onChange={jest.fn()} />);
    const items = screen.getAllByTestId('managed-image');
    fireEvent.dragStart(items[0]);
    fireEvent.drop(items[1]);
    await waitFor(() => expect(reorder).toHaveBeenCalled());

    // Second drop should not use stale dragIndex
    reorder.mockClear();
    reorder.mockResolvedValue(mk(2));
    fireEvent.drop(items[1]);
    expect(reorder).not.toHaveBeenCalled();
  });
});

describe('@US1-EC8 API error handling', () => {
  it('shows server error on reorder failure', async () => {
    reorder.mockRejectedValue({ response: { data: 'Ошибка БД' } });
    render(<ArtworkImagesManager artworkId={7} images={mk(3)} onChange={jest.fn()} />);
    const items = screen.getAllByTestId('managed-image');
    fireEvent.dragStart(items[0]);
    fireEvent.drop(items[1]);
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Ошибка БД');
    });
  });

  it('shows fallback error on reorder failure without response', async () => {
    reorder.mockRejectedValue({ message: 'Network error' });
    render(<ArtworkImagesManager artworkId={7} images={mk(3)} onChange={jest.fn()} />);
    const items = screen.getAllByTestId('managed-image');
    fireEvent.dragStart(items[0]);
    fireEvent.drop(items[1]);
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Не удалось сохранить порядок');
    });
  });

  it('shows server error on delete failure', async () => {
    jest.spyOn(window, 'confirm').mockReturnValue(true);
    del.mockRejectedValue({ response: { data: { message: 'Невозможно удалить' } } });
    render(<ArtworkImagesManager artworkId={7} images={mk(2)} onChange={jest.fn()} />);
    fireEvent.click(screen.getByLabelText('Удалить фото 1'));
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Невозможно удалить');
    });
  });

  it('shows fallback error on delete failure', async () => {
    jest.spyOn(window, 'confirm').mockReturnValue(true);
    del.mockRejectedValue(new Error('Unknown'));
    render(<ArtworkImagesManager artworkId={7} images={mk(2)} onChange={jest.fn()} />);
    fireEvent.click(screen.getByLabelText('Удалить фото 1'));
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Не удалось удалить');
    });
  });

  it('error clears before next operation', async () => {
    jest.spyOn(window, 'confirm').mockReturnValue(true);
    del.mockRejectedValueOnce({ response: { data: 'First error' } });
    del.mockResolvedValueOnce(mk(1));

    render(<ArtworkImagesManager artworkId={7} images={mk(2)} onChange={jest.fn()} />);
    fireEvent.click(screen.getByLabelText('Удалить фото 1'));
    await waitFor(() => {
      expect(screen.getByText('First error')).toBeInTheDocument();
    });

    del.mockClear();
    jest.spyOn(window, 'confirm').mockReturnValue(true);
    del.mockResolvedValue(mk(0));
    fireEvent.click(screen.getByLabelText('Удалить фото 2'));
    await waitFor(() => {
      expect(screen.queryByText('First error')).toBeNull();
    });
  });

  it('does not update state on error', async () => {
    reorder.mockRejectedValue({ response: { data: 'Error' } });
    const onChange = jest.fn();
    render(<ArtworkImagesManager artworkId={7} images={mk(3)} onChange={onChange} />);
    const items = screen.getAllByTestId('managed-image');
    fireEvent.dragStart(items[0]);
    fireEvent.drop(items[1]);
    await waitFor(() => {
      expect(onChange).not.toHaveBeenCalled();
    });
  });
});

describe('@US1 empty and boundary image lists', () => {
  it('handles rendering with 1 image (special case)', () => {
    render(<ArtworkImagesManager artworkId={7} images={mk(1)} onChange={jest.fn()} />);
    expect(screen.getByAltText('Фото 1')).toBeInTheDocument();
    expect(screen.getAllByTestId('managed-image')).toHaveLength(1);
  });

  it('handles rendering with 10 images (max)', () => {
    render(<ArtworkImagesManager artworkId={7} images={mk(10)} onChange={jest.fn()} />);
    expect(screen.getAllByTestId('managed-image')).toHaveLength(10);
    expect(screen.getByText('Обложка')).toBeInTheDocument();
  });

  it('button labels increment correctly', () => {
    render(<ArtworkImagesManager artworkId={7} images={mk(3)} onChange={jest.fn()} />);
    expect(screen.getByLabelText('Переместить фото 1 влево')).toBeInTheDocument();
    expect(screen.getByLabelText('Переместить фото 2 влево')).toBeInTheDocument();
    expect(screen.getByLabelText('Переместить фото 3 вправо')).toBeInTheDocument();
  });
});

describe('@US1-AS3 cover badge', () => {
  it('only first photo has cover badge', () => {
    render(<ArtworkImagesManager artworkId={7} images={mk(5)} onChange={jest.fn()} />);
    const badges = screen.getAllByText('Обложка');
    expect(badges).toHaveLength(1);
  });

  it('badge persists after reorder', async () => {
    reorder.mockResolvedValue(mk(3));
    render(<ArtworkImagesManager artworkId={7} images={mk(3)} onChange={jest.fn()} />);
    fireEvent.click(screen.getByLabelText('Сделать обложкой фото 2'));
    await waitFor(() => {
      const badges = screen.getAllByText('Обложка');
      expect(badges).toHaveLength(1);
    });
  });
});

describe('@US1-AS2 arrow button disabling logic', () => {
  it('middle photo has both left and right arrows enabled', () => {
    render(<ArtworkImagesManager artworkId={7} images={mk(5)} onChange={jest.fn()} />);
    const leftBtn = screen.getByLabelText('Переместить фото 3 влево');
    const rightBtn = screen.getByLabelText('Переместить фото 3 вправо');
    expect(leftBtn).not.toBeDisabled();
    expect(rightBtn).not.toBeDisabled();
  });

  it('middle photo left button disabled if it becomes first', async () => {
    reorder.mockResolvedValue(mk(2));
    render(<ArtworkImagesManager artworkId={7} images={mk(2)} onChange={jest.fn()} />);
    const leftBtn = screen.getByLabelText('Переместить фото 2 влево');
    expect(leftBtn).not.toBeDisabled();
  });
});

describe('@US1 onChange callback', () => {
  it('calls onChange after successful reorder', async () => {
    const onChange = jest.fn();
    const newImages = mk(2);
    reorder.mockResolvedValue(newImages);
    render(<ArtworkImagesManager artworkId={7} images={mk(2)} onChange={onChange} />);
    const items = screen.getAllByTestId('managed-image');
    fireEvent.dragStart(items[0]);
    fireEvent.drop(items[1]);
    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(newImages);
    });
  });

  it('calls onChange after successful delete', async () => {
    jest.spyOn(window, 'confirm').mockReturnValue(true);
    const onChange = jest.fn();
    const newImages = mk(1);
    del.mockResolvedValue(newImages);
    render(<ArtworkImagesManager artworkId={7} images={mk(2)} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('Удалить фото 1'));
    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(newImages);
    });
  });

  it('does not call onChange on cancelled delete', async () => {
    jest.spyOn(window, 'confirm').mockReturnValue(false);
    const onChange = jest.fn();
    render(<ArtworkImagesManager artworkId={7} images={mk(2)} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('Удалить фото 1'));
    expect(onChange).not.toHaveBeenCalled();
  });
});
