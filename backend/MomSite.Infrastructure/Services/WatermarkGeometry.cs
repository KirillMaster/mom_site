namespace MomSite.Infrastructure.Services;

public record WatermarkLayout(float FontSize, float Padding, float OriginX, float OriginY, byte Alpha);

public static class WatermarkGeometry
{
    public const float TextHeightRatio = 0.03f;
    public const float PaddingRatio = 0.02f;
    public const float MinFontSize = 12f;
    public const byte MaxAlpha = 102; // 0.4 * 255

    public static WatermarkLayout Compute(int width, int height)
    {
        var shorter = Math.Min(width, height);
        var fontSize = Math.Max(MinFontSize, MathF.Round(shorter * TextHeightRatio));
        var padding = Math.Max(4f, MathF.Round(shorter * PaddingRatio));
        return new WatermarkLayout(fontSize, padding, width - padding, height - padding, MaxAlpha);
    }
}
