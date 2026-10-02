import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ArtworkImagesManager from '@/components/admin/ArtworkImagesManager';
import { deleteArtworkImage, reorderArtworkImages } from '@/lib/artworkImagesApi';

jest.mock('@/lib/artworkImagesApi');
jest.mock('@/hooks/useApi', () => ({ getImageUrl: (p: string) => p }));

const mk = (n: number) => Array.from({ length: n }, (_, i) => ({ id: i + 1, imagePath: `p${i}`, thumbnailPath: `t${i}`, sortOrder: i }));
const reorder = reorderArtworkImages as jest.Mock;
const del = deleteArtworkImage as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('@US1-AS2 смена порядка', () => {
  it('drag and drop saves new order', async () => {
    const onChange = jest.fn();
    reorder.mockResolvedValue(mk(4));
    render(<ArtworkImagesManager artworkId={7} images={mk(4)} onChange={onChange} />);
    const items = screen.getAllByTestId('managed-image');
    fireEvent.dragStart(items[0]);
    fireEvent.drop(items[2]);
    await waitFor(() => expect(reorder).toHaveBeenCalledWith(7, [2, 3, 1, 4]));
    expect(onChange).toHaveBeenCalled();
  });

  it('arrow buttons move photos', async () => {
    reorder.mockResolvedValue(mk(4));
    render(<ArtworkImagesManager artworkId={7} images={mk(4)} onChange={jest.fn()} />);
    fireEvent.click(screen.getByLabelText('Переместить фото 2 вправо'));
    await waitFor(() => expect(reorder).toHaveBeenCalledWith(7, [1, 3, 2, 4]));
    expect(screen.getByLabelText('Переместить фото 1 влево')).toBeDisabled();
  });
});

describe('@US1-AS3 «Сделать обложкой»', () => {
  it('moves third photo to first and first is badged', async () => {
    reorder.mockResolvedValue(mk(4));
    render(<ArtworkImagesManager artworkId={7} images={mk(4)} onChange={jest.fn()} />);
    expect(screen.getAllByText('Обложка')).toHaveLength(1);
    fireEvent.click(screen.getByLabelText('Сделать обложкой фото 3'));
    await waitFor(() => expect(reorder).toHaveBeenCalledWith(7, [3, 1, 2, 4]));
  });
});

describe('@US1-AS4 удаление с подтверждением', () => {
  it('deletes after confirm', async () => {
    jest.spyOn(window, 'confirm').mockReturnValue(true);
    del.mockResolvedValue(mk(3));
    const onChange = jest.fn();
    render(<ArtworkImagesManager artworkId={7} images={mk(4)} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('Удалить фото 2'));
    await waitFor(() => expect(del).toHaveBeenCalledWith(7, 2));
    expect(onChange).toHaveBeenCalledWith(mk(3));
  });

  it('keeps photo when confirm is cancelled', () => {
    jest.spyOn(window, 'confirm').mockReturnValue(false);
    render(<ArtworkImagesManager artworkId={7} images={mk(4)} onChange={jest.fn()} />);
    fireEvent.click(screen.getByLabelText('Удалить фото 2'));
    expect(del).not.toHaveBeenCalled();
  });
});

describe('@US1-EC9 единственное фото нельзя удалить', () => {
  it('hides delete for the only photo', () => {
    render(<ArtworkImagesManager artworkId={7} images={mk(1)} onChange={jest.fn()} />);
    expect(screen.queryByLabelText('Удалить фото 1')).toBeNull();
  });
});
