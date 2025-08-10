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

        // Seed data
        SeedData(modelBuilder);
    }

    private void SeedData(ModelBuilder modelBuilder)
    {
        // Seed categories
        modelBuilder.Entity<Category>().HasData(
            new Category { Id = 1, Name = "Театральные работы", Description = "Картины на театральную тематику", DisplayOrder = 1 },
            new Category { Id = 2, Name = "Натюрморты", Description = "Классические натюрморты", DisplayOrder = 2 },
            new Category { Id = 3, Name = "Пейзажи", Description = "Природные пейзажи", DisplayOrder = 3 }
        );

        // Seed video categories
        modelBuilder.Entity<VideoCategory>().HasData(
            new VideoCategory { Id = 1, Name = "Процесс создания", Description = "Видео процесса создания картин", DisplayOrder = 1 },
            new VideoCategory { Id = 2, Name = "Выставки", Description = "Видео с выставок", DisplayOrder = 2 },
            new VideoCategory { Id = 3, Name = "Интервью", Description = "Интервью и рассказы о творчестве", DisplayOrder = 3 }
        );

        // Seed page content
        modelBuilder.Entity<PageContent>().HasData(
            new PageContent { Id = 1, PageKey = "home", ContentKey = "welcome_message", TextContent = "Добро пожаловать в мир искусства! Здесь вы найдете уникальные работы в стиле импрессионизма, созданные с любовью и вдохновением.", DisplayOrder = 1 },
            new PageContent { Id = 2, PageKey = "home", ContentKey = "banner_image", ImagePath = "/images/banner-default.jpg", DisplayOrder = 2 },
            new PageContent { Id = 3, PageKey = "about", ContentKey = "biography", TextContent = "Я художник-импрессионист, вдохновленный красотой окружающего мира. Мои работы отражают любовь к театральному искусству и классическим натюрмортам.", DisplayOrder = 1 },
            new PageContent { Id = 4, PageKey = "about", ContentKey = "artist_photo", ImagePath = "/images/artist-default.jpg", DisplayOrder = 2 },
            new PageContent { Id = 5, PageKey = "contacts", ContentKey = "instagram", LinkUrl = "https://instagram.com/", DisplayOrder = 1 },
            new PageContent { Id = 6, PageKey = "contacts", ContentKey = "vk", LinkUrl = "https://vk.com/", DisplayOrder = 2 },
            new PageContent { Id = 7, PageKey = "contacts", ContentKey = "telegram", LinkUrl = "https://t.me/", DisplayOrder = 3 },
            new PageContent { Id = 8, PageKey = "contacts", ContentKey = "whatsapp", LinkUrl = "https://wa.me/", DisplayOrder = 4 },
            new PageContent { Id = 9, PageKey = "contacts", ContentKey = "youtube", LinkUrl = "https://youtube.com/", DisplayOrder = 5 },
            new PageContent { Id = 10, PageKey = "contacts", ContentKey = "email", TextContent = "info@angelamoiseenko.ru", DisplayOrder = 6 }
        );

        
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