import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import RichTextEditor from './RichTextEditor';
import { cleanPastedHtml } from './cleanPastedHtml';
import { uploadBlogImage } from '@/lib/blogApi';

jest.mock('@/lib/blogApi', () => ({
  uploadBlogImage: jest.fn(),
  blogErrorMessage: (_e: unknown, fallback: string) => fallback,
}));

const mockedUpload = uploadBlogImage as jest.MockedFunction<typeof uploadBlogImage>;

describe('RichTextEditor', () => {
  it('shows exactly 7 labelled buttons and no HTML mode', () => {
    render(<RichTextEditor value="" onChange={jest.fn()} />);
    const toolbar = screen.getByRole('toolbar');
    const labels = Array.from(toolbar.querySelectorAll('button')).map((b) => b.textContent);
    expect(labels).toEqual(['Жирный', 'Курсив', 'Подзаголовок', 'Список', 'Ссылка', 'Фото', 'Отменить']);
    expect(screen.queryByText(/html/i)).toBeNull();
  });

  it('uploads a picked photo and inserts it as <img> with the url', async () => {
    mockedUpload.mockResolvedValue('https://s3.twcstorage.ru/b/blog/1.jpg');
    const onChange = jest.fn();
    render(<RichTextEditor value="<p>Текст</p>" onChange={onChange} imageAlt="Выставка" />);
    const file = new File(['x'], 'photo.jpg', { type: 'image/jpeg' });

    fireEvent.change(screen.getByTestId('editor-image-input'), { target: { files: [file] } });

    await waitFor(() => expect(onChange).toHaveBeenCalledWith(
      expect.stringContaining('<img src="https://s3.twcstorage.ru/b/blog/1.jpg" alt="Выставка">')));
    expect(mockedUpload).toHaveBeenCalledWith(file, expect.any(Function));
  });

  it('shows a plain error when upload fails', async () => {
    mockedUpload.mockRejectedValue(new Error('boom'));
    render(<RichTextEditor value="" onChange={jest.fn()} />);
    fireEvent.change(screen.getByTestId('editor-image-input'), {
      target: { files: [new File(['x'], 'a.jpg', { type: 'image/jpeg' })] },
    });
    expect(await screen.findByRole('alert')).toHaveTextContent('Не получилось загрузить фото');
  });
});

describe('cleanPastedHtml', () => {
  it('strips Word styles, spans and classes', () => {
    expect(cleanPastedHtml('<p class="MsoNormal" style="mso-x"><span style="mso-x">Текст</span><o:p></o:p></p>'))
      .toBe('<p>Текст</p>');
  });

  it('drops base64 images but keeps http ones and link hrefs', () => {
    const html = cleanPastedHtml('<img src="data:image/png;base64,AAA"><img src="https://x/1.jpg" width="5"><a href="https://vk.com" target="_blank">vk</a>');
    expect(html).toBe('<img src="https://x/1.jpg"><a href="https://vk.com">vk</a>');
  });
});
