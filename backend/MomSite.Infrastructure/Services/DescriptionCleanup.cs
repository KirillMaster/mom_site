using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using MomSite.Core.Services;
using MomSite.Infrastructure.Data;

namespace MomSite.Infrastructure.Services;

public static class DescriptionCleanup
{
    public static int Run(ApplicationDbContext db, ILogger logger)
    {
        var cleaned = 0;
        foreach (var artwork in db.Artworks.Where(a => a.Description != null).ToList())
        {
            var clean = DescriptionCleaner.Clean(artwork.Description);
            if (clean == artwork.Description) continue;
            artwork.Description = clean;
            cleaned++;
        }
        if (cleaned > 0) db.SaveChanges();
        logger.LogInformation("DescriptionCleaner: cleaned {Count} artwork descriptions", cleaned);
        return cleaned;
    }
}
