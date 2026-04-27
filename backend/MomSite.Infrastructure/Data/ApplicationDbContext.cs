using Microsoft.EntityFrameworkCore;
using MomSite.Core.Models;
using System.Diagnostics;

namespace MomSite.Infrastructure.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    public DbSet<Artwork> Artworks { get; set; }
    public DbSet<Category> Categories { get; set; }
    
    public DbSet<Video> Videos { get; set; }
    public DbSet<VideoCategory> VideoCategories { get; set; }
    public DbSet<PageContent> PageContents { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Artwork configuration
        modelBuilder.Entity<Artwork>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Title).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Description).HasMaxLength(1000);
            entity.Property(e => e.ImagePath).IsRequired().HasMaxLength(500);
            entity.Property(e => e.ThumbnailPath).IsRequired().HasMaxLength(500);
            entity.Property(e => e.Price).HasColumnType("decimal(18,2)");
            entity.HasOne(e => e.Category)
                  .WithMany(c => c.Artworks)
                  .HasForeignKey(e => e.CategoryId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // Category configuration
        modelBuilder.Entity<Category>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.HasIndex(e => e.Name).IsUnique();
        });

        

        // Video configuration
        modelBuilder.Entity<Video>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Title).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Description).HasMaxLength(1000);
            entity.Property(e => e.VideoPath).HasMaxLength(500);
            entity.Property(e => e.ThumbnailPath).HasMaxLength(500);
            entity.HasOne(e => e.VideoCategory)
                  .WithMany(vc => vc.Videos)
                  .HasForeignKey(e => e.VideoCategoryId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // VideoCategory configuration
        modelBuilder.Entity<VideoCategory>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.HasIndex(e => e.Name).IsUnique();
        });

        // PageContent configuration
        modelBuilder.Entity<PageContent>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.PageKey).IsRequired().HasMaxLength(100);
            entity.Property(e => e.ContentKey).IsRequired().HasMaxLength(100);
            entity.Property(e => e.TextContent).HasMaxLength(2000);
            entity.Property(e => e.ImagePath).HasMaxLength(500);
            entity.Property(e => e.LinkUrl).HasMaxLength(500);
            entity.HasIndex(e => new { e.PageKey, e.ContentKey }).IsUnique();
        });

        // Seed data was removed in migration 20260427120500_RemoveSeedData.
        // The rows from the original seed have long since been edited
        // through the admin UI and are now real production content; we no
        // longer want EF to manage them. New deployments still get the
        // schema, just no seeded rows.
    }

    public override int SaveChanges()
    {
        LogChanges();
        return base.SaveChanges();
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        LogChanges();
        return await base.SaveChangesAsync(cancellationToken);
    }

    private void LogChanges()
    {
        foreach (var entry in ChangeTracker.Entries())
        {
            Debug.WriteLine($"Entity: {entry.Entity.GetType().Name}, State: {entry.State}");
            if (entry.State == EntityState.Added || entry.State == EntityState.Modified)
            {
                foreach (var property in entry.Properties)
                {
                    Debug.WriteLine($"  Property: {property.Metadata.Name}, CurrentValue: {property.CurrentValue}");
                }
            }
        }
    }
}