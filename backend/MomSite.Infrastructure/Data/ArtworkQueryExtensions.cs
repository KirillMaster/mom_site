using MomSite.Core.Models;

namespace MomSite.Infrastructure.Data;

public static class ArtworkQueryExtensions
{
    /// <summary>
    /// Единый фильтр работ, видимых посетителям сайта: опубликованные и не помеченные «не моя работа».
    /// </summary>
    public static IQueryable<Artwork> Visible(this IQueryable<Artwork> query) =>
        query.Where(a => a.IsPublished && a.Status != ArtworkStatus.NotMine);
}
