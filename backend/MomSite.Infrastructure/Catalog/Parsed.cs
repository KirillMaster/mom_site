namespace MomSite.Infrastructure.Catalog;

public enum ParseKind { Keep, Clear, Set, Warn }

public readonly record struct Parsed<T>(ParseKind Kind, T? Value = default, string? Message = null)
{
    public static Parsed<T> Keep() => new(ParseKind.Keep);
    public static Parsed<T> Clear() => new(ParseKind.Clear);
    public static Parsed<T> Set(T value) => new(ParseKind.Set, value);
    public static Parsed<T> Warn(string message) => new(ParseKind.Warn, default, message);
}
