using Microsoft.AspNetCore.Http;

namespace MomSite.Infrastructure.Blog;

/// <summary>IFormFile поверх готового потока — чтобы отдать обработанное фото в IImageService.SaveImageAsync.</summary>
internal sealed class InMemoryFormFile : IFormFile
{
    private readonly byte[] _bytes;

    public InMemoryFormFile(byte[] bytes, string fileName, string contentType)
    {
        _bytes = bytes;
        FileName = fileName;
        ContentType = contentType;
    }

    public string ContentType { get; }
    public string ContentDisposition => $"form-data; name=\"{Name}\"; filename=\"{FileName}\"";
    public IHeaderDictionary Headers { get; } = new HeaderDictionary();
    public long Length => _bytes.Length;
    public string Name => "file";
    public string FileName { get; }

    public Stream OpenReadStream() => new MemoryStream(_bytes, writable: false);
    public void CopyTo(Stream target) => target.Write(_bytes);
    public Task CopyToAsync(Stream target, CancellationToken cancellationToken = default) =>
        target.WriteAsync(_bytes, cancellationToken).AsTask();
}
