namespace MomSite.Core.Models;

public static class ArtworkFieldRules
{
    public const int TitleMax = 200;
    public const int DescriptionMax = 5000;
    public const int ShortDescriptionMax = 300;
    public const int SupportMax = 100;
    public const int TechniqueMax = 100;
    public const decimal SizeMin = 1m;
    public const decimal SizeMax = 1000m;
    public const int YearMin = 1950;

    public static bool IsYearValid(int year, DateTime now) => year >= YearMin && year <= now.Year;

    public static bool IsSizeValid(decimal size) => size >= SizeMin && size <= SizeMax;
}
