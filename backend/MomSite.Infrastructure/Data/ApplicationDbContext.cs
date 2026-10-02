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
    public DbSet<ArtworkImage> ArtworkImages { get; set; }
    public DbSet<Category> Categories { get; set; }
    
    public DbSet<Video> Videos { get; set; }
    public DbSet<VideoCategory> VideoCategories { get; set; }
    public DbSet<PageContent> PageContents { get; set; }
    public DbSet<ContactMessage> ContactMessages { get; set; }
    public DbSet<Review> Reviews { get; set; }
    public DbSet<BlogPost> BlogPosts { get; set; }
    public DbSet<BlogCategory> BlogCategories { get; set; }
    public DbSet<BlogPostArtwork> BlogPostArtworks { get; set; }

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

        // ArtworkImage configuration
        modelBuilder.Entity<ArtworkImage>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.ImagePath).IsRequired().HasMaxLength(500);
            entity.Property(e => e.ThumbnailPath).IsRequired().HasMaxLength(500);
            entity.HasOne(e => e.Artwork)
                  .WithMany(a => a.Images)
                  .HasForeignKey(e => e.ArtworkId)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(e => new { e.ArtworkId, e.SortOrder });
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

        // ContactMessage configuration
        modelBuilder.Entity<ContactMessage>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Email).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Subject).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Message).IsRequired().HasMaxLength(5000);
            entity.Property(e => e.IpAddress).HasMaxLength(64);
            entity.Property(e => e.UserAgent).HasMaxLength(512);
            entity.Property(e => e.UtmSource).HasMaxLength(200);
            entity.Property(e => e.UtmMedium).HasMaxLength(200);
            entity.Property(e => e.UtmCampaign).HasMaxLength(200);
            entity.Property(e => e.Status).HasConversion<string>().HasMaxLength(20);
            entity.HasIndex(e => e.CreatedAt);
            entity.HasIndex(e => e.Status);
        });

        // Review configuration
        modelBuilder.Entity<Review>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.AuthorName).IsRequired().HasMaxLength(100);
            entity.Property(e => e.AuthorCity).HasMaxLength(100);
            entity.Property(e => e.Text).IsRequired().HasMaxLength(2000);
            entity.Property(e => e.PhotoPath).HasMaxLength(500);
            entity.HasOne(e => e.Artwork)
                  .WithMany()
                  .HasForeignKey(e => e.ArtworkId)
                  .OnDelete(DeleteBehavior.SetNull);
            entity.HasIndex(e => e.IsPublished);
            entity.HasIndex(e => e.SortOrder);
        });

        ConfigureBlog(modelBuilder);

        // Seed data was removed in migration 20260427120500_RemoveSeedData.
        // The rows from the original seed have long since been edited
        // through the admin UI and are now real production content; we no
        // longer want EF to manage them. New deployments still get the
        // schema, just no seeded rows.
    }

    private static void ConfigureBlog(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<BlogCategory>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Slug).IsRequired().HasMaxLength(80);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Description).HasMaxLength(1000);
            entity.HasIndex(e => e.Slug).IsUnique();
        });

        modelBuilder.Entity<BlogPost>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Slug).IsRequired().HasMaxLength(120);
            entity.Property(e => e.Title).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Excerpt).HasMaxLength(300);
            entity.Property(e => e.BodyHtml).IsRequired();
            entity.Property(e => e.CoverImagePath).HasMaxLength(500);
            entity.Property(e => e.CoverAlt).HasMaxLength(200);
            entity.Property(e => e.SeoTitle).HasMaxLength(70);
            entity.Property(e => e.SeoDescription).HasMaxLength(200);
            entity.HasIndex(e => e.Slug).IsUnique();
            entity.HasIndex(e => e.PublishedAt);
            entity.HasOne(e => e.BlogCategory)
                  .WithMany(c => c.Posts)
                  .HasForeignKey(e => e.BlogCategoryId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<BlogPostArtwork>(entity =>
        {
            entity.HasKey(e => new { e.BlogPostId, e.ArtworkId });
            entity.HasOne(e => e.BlogPost)
                  .WithMany(p => p.Artworks)
                  .HasForeignKey(e => e.BlogPostId)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Artwork)
                  .WithMany()
                  .HasForeignKey(e => e.ArtworkId)
                  .OnDelete(DeleteBehavior.Cascade);
        });
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