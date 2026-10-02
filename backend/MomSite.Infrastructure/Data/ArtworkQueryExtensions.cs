using MomSite.Core.Models;

namespace MomSite.Infrastructure.Data;

public static class ArtworkQueryExtensions
{
    /// <summary>
    /// Единый фильтр работ, видимых посетителям сайта.
    /// Пока показываются все работы; 005 добавит сюда условие публикации (IsPublished).
    /// </summary>
    public static IQueryable<Artwork> Visible(this IQueryable<Artwork> query) => query;
}
