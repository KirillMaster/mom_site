using System.Globalization;
using MomSite.Core.Models;

namespace MomSite.Infrastructure.Catalog;

/// <summary>Единая таблица полей: строковое представление для сравнения, отчёта, снимка и отката.</summary>
public static class ArtworkFields
{
    public const string Title = "Title", Price = "Price", Status = "Status", Width = "WidthCm", Height = "HeightCm",
        Year = "Year", Support = "Support", Technique = "Technique", ShortDescription = "ShortDescription",
        Description = "Description", Featured = "IsFeatured", Reshoot = "NeedsReshoot", Published = "IsPublished";

    private static readonly CultureInfo Inv = CultureInfo.InvariantCulture;

    public static string? Get(Artwork a, string field) => field switch
    {
        Title => a.Title,
        Price => a.Price?.ToString("0.##", Inv),
        Status => a.Status.ToString(),
        Width => a.WidthCm?.ToString("0.#", Inv),
        Height => a.HeightCm?.ToString("0.#", Inv),
        Year => a.Year?.ToString(Inv),
        Support => a.Support,
        Technique => a.Technique,
        ShortDescription => a.ShortDescription,
        Description => a.Description,
        Featured => B(a.IsFeatured),
        Reshoot => B(a.NeedsReshoot),
        Published => B(a.IsPublished),
        _ => throw new ArgumentException($"Unknown field {field}")
    };

    public static void Set(Artwork a, string field, string? v)
    {
        switch (field)
        {
            case Title: a.Title = v ?? a.Title; break;
            case Price: a.Price = v is null ? null : decimal.Parse(v, Inv); break;
            case Status: if (v is not null) a.ApplyStatus(Enum.Parse<ArtworkStatus>(v)); break;
            case Width: a.WidthCm = v is null ? null : decimal.Parse(v, Inv); break;
            case Height: a.HeightCm = v is null ? null : decimal.Parse(v, Inv); break;
            case Year: a.Year = v is null ? null : int.Parse(v, Inv); break;
            case Support: a.Support = v; break;
            case Technique: a.Technique = v; break;
            case ShortDescription: a.ShortDescription = v; break;
            case Description: a.Description = v; break;
            case Featured: a.IsFeatured = v == "true"; break;
            case Reshoot: a.NeedsReshoot = v == "true"; break;
            case Published: a.IsPublished = v != "false"; break;
            default: throw new ArgumentException($"Unknown field {field}");
        }
    }

    public static Dictionary<string, string?> Snapshot(Artwork a) =>
        All.ToDictionary(f => f, f => Get(a, f));

    public static readonly string[] All =
    {
        Title, Price, Status, Width, Height, Year, Support, Technique, ShortDescription,
        Description, Featured, Reshoot, Published
    };

    private static string B(bool v) => v ? "true" : "false";
}
