namespace MomSite.Infrastructure.Catalog;

public enum CatalogColumn
{
    Id, Title, Price, Status, Width, Height, Year, Support, Technique,
    ShortDescription, Description, Featured, Reshoot, Comment,
    ExhibitionKeep, ExhibitionWhere
}

public static class CatalogColumnNames
{
    public static string Display(CatalogColumn c) => c switch
    {
        CatalogColumn.Id => "ID",
        CatalogColumn.Title => "Название",
        CatalogColumn.Price => "Цена, ₽",
        CatalogColumn.Status => "Статус",
        CatalogColumn.Width => "Ширина, см",
        CatalogColumn.Height => "Высота, см",
        CatalogColumn.Year => "Год",
        CatalogColumn.Support => "Основа",
        CatalogColumn.Technique => "Техника",
        CatalogColumn.ShortDescription => "Короткое описание",
        CatalogColumn.Description => "История, выставки, интересные факты",
        CatalogColumn.Featured => "Сильная работа",
        CatalogColumn.Reshoot => "Фото: переснять?",
        CatalogColumn.Comment => "Комментарий",
        CatalogColumn.ExhibitionKeep => "Оставить на сайте?",
        CatalogColumn.ExhibitionWhere => "Где и когда",
        _ => c.ToString()
    };
}
