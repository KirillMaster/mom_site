using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using MomSite.Core.Models;
using MomSite.Infrastructure.Data;
using Xunit;

namespace MomSite.Tests
{
    public class ReviewEntityTests
    {
        private static ApplicationDbContext CreateInMemoryDbContext(string dbName)
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: dbName)
                .Options;
            return new ApplicationDbContext(options);
        }

        private static Review ValidReview() => new()
        {
            AuthorName = "Ольга",
            Text = "Прекрасные работы!",
            Rating = 5
        };

        // @S1-AS1: сущность Review валидна с обязательными полями. Как и
        // остальные интеграционные тесты в этом проекте (см. Program.cs,
        // ветка Environment == "Testing"), проверка схемы идёт через
        // Sqlite + EnsureCreated: реальные checked-in миграции содержат
        // Npgsql-специфичные типы столбцов и переигрываются только поверх
        // Postgres. Наличие самой миграции, создающей таблицу Review,
        // проверяется отдельно — по списку миграций, зарегистрированных в
        // сборке (EF подбирает их по имени класса/файла).
        [Fact]
        [Trait("Scenario", "S1-AS1")]
        public void Migrations_Include_OneThatCreatesReviewsTable()
        {
            using var connection = new SqliteConnection("DataSource=:memory:");
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseSqlite(connection)
                .Options;
            using var context = new ApplicationDbContext(options);

            var migrationIds = context.Database.GetMigrations();

            Assert.Contains(migrationIds, id => id.EndsWith("_AddReviewsTable", StringComparison.Ordinal));
        }

        [Fact]
        [Trait("Scenario", "S1-AS1")]
        public async Task Review_SavesWithDefaults_OnSchemaCreatedFromCurrentModel()
        {
            using var connection = new SqliteConnection("DataSource=:memory:");
            connection.Open();
            try
            {
                var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                    .UseSqlite(connection)
                    .Options;

                using var context = new ApplicationDbContext(options);
                context.Database.EnsureCreated();

                var before = DateTime.UtcNow;
                var review = ValidReview();
                context.Reviews.Add(review);
                await context.SaveChangesAsync();
                var after = DateTime.UtcNow;

                Assert.True(review.Id > 0);
                Assert.False(review.IsPublished);
                Assert.InRange(review.CreatedAt, before.AddSeconds(-5), after.AddSeconds(5));
            }
            finally
            {
                connection.Close();
            }
        }

        // @S1-AS2: AuthorName обязателен и ограничен 100 символами.
        [Fact]
        [Trait("Scenario", "S1-AS2")]
        public void AuthorName_EmptyOrTooLong_FailsValidation()
        {
            var empty = ValidReview();
            empty.AuthorName = string.Empty;
            Assert.Contains(Validate(empty), r => r.MemberNames.Contains(nameof(Review.AuthorName)));

            var tooLong = ValidReview();
            tooLong.AuthorName = new string('a', 101);
            Assert.Contains(Validate(tooLong), r => r.MemberNames.Contains(nameof(Review.AuthorName)));
        }

        // @S1-AS3: Text обязателен и ограничен 2000 символами.
        [Fact]
        [Trait("Scenario", "S1-AS3")]
        public void Text_EmptyOrTooLong_FailsValidation()
        {
            var empty = ValidReview();
            empty.Text = string.Empty;
            Assert.Contains(Validate(empty), r => r.MemberNames.Contains(nameof(Review.Text)));

            var tooLong = ValidReview();
            tooLong.Text = new string('a', 2001);
            Assert.Contains(Validate(tooLong), r => r.MemberNames.Contains(nameof(Review.Text)));
        }

        // @S1-AS4: Rating допускает только значения 1..5.
        [Theory]
        [Trait("Scenario", "S1-AS4")]
        [InlineData(0, false)]
        [InlineData(6, false)]
        [InlineData(1, true)]
        [InlineData(5, true)]
        public void Rating_OutsideOneToFive_FailsValidation(int rating, bool expectedValid)
        {
            var review = ValidReview();
            review.Rating = rating;

            var results = Validate(review);
            var ratingHasError = results.Any(r => r.MemberNames.Contains(nameof(Review.Rating)));

            Assert.Equal(!expectedValid, ratingHasError);
        }

        // @S1-AS5: AuthorCity, ArtworkId и PhotoPath опциональны.
        [Fact]
        [Trait("Scenario", "S1-AS5")]
        public async Task OptionalFields_LeftNull_SavesSuccessfully()
        {
            using var context = CreateInMemoryDbContext(nameof(OptionalFields_LeftNull_SavesSuccessfully));

            var review = ValidReview();
            Assert.Null(review.AuthorCity);
            Assert.Null(review.ArtworkId);
            Assert.Null(review.PhotoPath);

            context.Reviews.Add(review);
            await context.SaveChangesAsync();

            var reloaded = await context.Reviews.FindAsync(review.Id);
            Assert.NotNull(reloaded);
            Assert.Null(reloaded!.AuthorCity);
            Assert.Null(reloaded.ArtworkId);
            Assert.Null(reloaded.PhotoPath);
        }

        // @S1-AS6: ArtworkId ссылается на существующую работу через navigation property.
        [Fact]
        [Trait("Scenario", "S1-AS6")]
        public async Task ArtworkRelation_ResolvesThroughNavigationProperty()
        {
            using var context = CreateInMemoryDbContext(nameof(ArtworkRelation_ResolvesThroughNavigationProperty));

            var category = new Category { Name = "Пейзажи" };
            context.Categories.Add(category);
            var artwork = new Artwork
            {
                Id = 42,
                Title = "Закат над рекой",
                ImagePath = "images/sunset.jpg",
                ThumbnailPath = "images/sunset_thumb.jpg",
                Category = category
            };
            context.Artworks.Add(artwork);
            await context.SaveChangesAsync();

            var review = ValidReview();
            review.ArtworkId = artwork.Id;
            context.Reviews.Add(review);
            await context.SaveChangesAsync();

            var reloaded = await context.Reviews
                .Include(r => r.Artwork)
                .FirstAsync(r => r.Id == review.Id);

            Assert.NotNull(reloaded.Artwork);
            Assert.Equal(artwork.Id, reloaded.Artwork!.Id);
        }

        private static List<ValidationResult> Validate(Review review)
        {
            var context = new ValidationContext(review);
            var results = new List<ValidationResult>();
            Validator.TryValidateObject(review, context, results, validateAllProperties: true);
            return results;
        }
    }
}
