using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using MomSite.API.Controllers;
using MomSite.API.DTOs;
using MomSite.Core.Interfaces;
using MomSite.Core.Models;
using MomSite.Core.Services;
using MomSite.Infrastructure.Data;
using MomSite.Infrastructure.Services;
using Xunit;

namespace MomSite.Tests
{
    public class CatalogTrustContentTests
    {
        private class AllowAll : IContactRateLimiter
        {
            public bool TryAcquire(string clientKey) => true;
        }

        private static (PublicController, ApplicationDbContext) Create()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;
            var context = new ApplicationDbContext(options);
            var notifiers = new List<IFeedbackNotifier>();
            var controller = new PublicController(
                context, notifiers, Mock.Of<ILogger<PublicController>>(), new AllowAll(),
                new LeadService(context, notifiers, Mock.Of<ILogger<LeadService>>()))
            {
                ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() }
            };
            return (controller, context);
        }

        private static async Task<HowToBuyDto> GetHtb(PublicController c) =>
            Assert.IsType<HowToBuyDto>(Assert.IsType<OkObjectResult>((await c.GetHowToBuy()).Result).Value);

        private static async Task<HomeData> GetHome(PublicController c) =>
            Assert.IsType<HomeData>(Assert.IsType<OkObjectResult>((await c.GetHomeData()).Result).Value);

        private static async Task<AboutData> GetAbout(PublicController c) =>
            Assert.IsType<AboutData>(Assert.IsType<OkObjectResult>((await c.GetAboutData()).Result).Value);

        private static Artwork Art(Category cat, string title, ArtworkStatus st = ArtworkStatus.Available,
            bool published = true, int ageDays = 0)
        {
            var a = new Artwork
            {
                Title = title, ImagePath = "i.jpg", ThumbnailPath = "t.jpg", Category = cat,
                IsPublished = published, CreatedAt = DateTime.UtcNow.AddDays(-ageDays)
            };
            a.ApplyStatus(st);
            return a;
        }

        [Fact, Trait("scenario", "US3-BE1")]
        public async Task US3_BE1_HowToBuy_WithoutRecord_ReturnsNulls()
        {
            var (c, _) = Create();
            var dto = await GetHtb(c);
            Assert.Null(dto.Text);
            Assert.Null(dto.UpdatedAt);
        }

        [Fact, Trait("scenario", "US3-BE2")]
        public async Task US3_BE2_HowToBuy_WithActiveRecord_ReturnsText()
        {
            var (c, ctx) = Create();
            ctx.PageContents.Add(new PageContent
            {
                PageKey = "how-to-buy", ContentKey = "body", TextContent = "Доставка СДЭК",
                IsActive = true, UpdatedAt = new DateTime(2026, 10, 1, 0, 0, 0, DateTimeKind.Utc)
            });
            await ctx.SaveChangesAsync();
            var dto = await GetHtb(c);
            Assert.Equal("Доставка СДЭК", dto.Text);
            Assert.NotNull(dto.UpdatedAt);
        }

        [Fact, Trait("scenario", "US3-BE3")]
        public async Task US3_BE3_HowToBuy_InactiveRecord_ReturnsNull()
        {
            var (c, ctx) = Create();
            ctx.PageContents.Add(new PageContent
                { PageKey = "how-to-buy", ContentKey = "body", TextContent = "x", IsActive = false });
            await ctx.SaveChangesAsync();
            Assert.Null((await GetHtb(c)).Text);
        }

        [Fact, Trait("scenario", "US8-AS1")]
        public void US8_AS1_Clean_KeepsFactLine()
        {
            const string fact = "Холст на подрамнике , масло, 80х65, Севастополь 2012г.";
            var input = fact + "\nНа представленной картине мы видим яркий натюрморт.\nХудожественный стиль:\nКартина выполнена в импрессионистской манере.";
            Assert.Equal(fact, DescriptionCleaner.Clean(input));
            Assert.Equal(fact, DescriptionCleaner.Clean(DescriptionCleaner.Clean(input)));
        }

        [Fact, Trait("scenario", "US8-AS2")]
        public void US8_AS2_Clean_AuthorTextUnchanged()
        {
            const string text = "Холст на подрамнике, масло, 90х80, 2021 год\nПисала на пленэре летом.";
            Assert.Equal(text, DescriptionCleaner.Clean(text));
            Assert.Null(DescriptionCleaner.Clean(null));
        }

        [Fact, Trait("scenario", "US8-EC1")]
        public void US8_EC1_Clean_OnlyGenerated_ReturnsNull()
        {
            var input = "На представленной картине мы видим букет.\nХудожник мастерски передал свет.\nВ целом это произведение радует.";
            Assert.Null(DescriptionCleaner.Clean(input));
        }

        [Fact, Trait("scenario", "US8-BE1")]
        public async Task US8_BE1_StartupCleanup_IsIdempotent()
        {
            var (_, ctx) = Create();
            var cat = new Category { Name = "Цветы" };
            var dirty = Art(cat, "a");
            dirty.Description = "Холст, масло, 2020\nНа картине изображен букет.";
            var clean = Art(cat, "b");
            clean.Description = "Холст, масло, 2021";
            ctx.Artworks.AddRange(dirty, clean);
            await ctx.SaveChangesAsync();
            var log = Mock.Of<ILogger>();

            Assert.Equal(1, DescriptionCleanup.Run(ctx, log));
            Assert.Equal("Холст, масло, 2020", dirty.Description);
            Assert.Equal("Холст, масло, 2021", clean.Description);
            Assert.Equal(0, DescriptionCleanup.Run(ctx, log));
        }

        [Fact, Trait("scenario", "US1-BE1")]
        public async Task US1_BE1_AvailableArtworks_Max8_NewestFirst_OnlyAvailable()
        {
            var (c, ctx) = Create();
            var cat = new Category { Name = "Цветы", ShowOnHome = true };
            for (var i = 0; i < 10; i++) ctx.Artworks.Add(Art(cat, $"av{i}", ageDays: i));
            ctx.Artworks.AddRange(Art(cat, "s1", ArtworkStatus.Sold), Art(cat, "s2", ArtworkStatus.Sold));
            await ctx.SaveChangesAsync();

            var home = await GetHome(c);

            Assert.Equal(8, home.AvailableArtworks.Count);
            Assert.All(home.AvailableArtworks, a => Assert.StartsWith("av", a.Title));
            Assert.Equal("av0", home.AvailableArtworks[0].Title);
            Assert.Equal("av7", home.AvailableArtworks[7].Title);
            Assert.NotEmpty(home.Artworks);
            Assert.NotNull(home.Contacts);
        }

        [Fact, Trait("scenario", "US1-BE2")]
        public async Task US1_BE2_AvailableArtworks_ExcludesUnpublishedSoldOffHome_AndIsEmptyNotNull()
        {
            var (c, ctx) = Create();
            var first = await GetHome(c);
            Assert.NotNull(first.AvailableArtworks);
            Assert.Empty(first.AvailableArtworks);

            var home = new Category { Name = "Цветы", ShowOnHome = true };
            var off = new Category { Name = "Скрытая", ShowOnHome = false };
            ctx.Artworks.AddRange(Art(home, "unpub", published: false), Art(home, "sold", ArtworkStatus.Sold),
                Art(off, "offhome"));
            await ctx.SaveChangesAsync();

            Assert.Empty((await GetHome(c)).AvailableArtworks);
        }

        [Fact, Trait("scenario", "US5-BE1")]
        public async Task US5_BE1_ExhibitionPhotos_Max24_OnlyPublishedFromCategory()
        {
            var (c, ctx) = Create();
            var ex = new Category { Name = "Фото с выставок" };
            var other = new Category { Name = "Цветы" };
            for (var i = 0; i < 30; i++) ctx.Artworks.Add(Art(ex, $"ex{i}", ArtworkStatus.Sold, ageDays: i));
            ctx.Artworks.AddRange(Art(ex, "unpub", published: false), Art(other, "other"));
            await ctx.SaveChangesAsync();

            var about = await GetAbout(c);

            Assert.Equal(24, about.ExhibitionPhotos.Count);
            Assert.All(about.ExhibitionPhotos, a => Assert.StartsWith("ex", a.Title));
            Assert.False(string.IsNullOrEmpty(about.Biography));
        }

        [Fact, Trait("scenario", "US5-BE2")]
        public async Task US5_BE2_ExhibitionPhotos_NoCategory_EmptyArray()
        {
            var (c, _) = Create();
            var about = await GetAbout(c);
            Assert.NotNull(about.ExhibitionPhotos);
            Assert.Empty(about.ExhibitionPhotos);
        }
    }
}
