using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Time.Testing;
using MomSite.API.Controllers;
using MomSite.API.DTOs;
using MomSite.Core.Interfaces;
using MomSite.Core.Models;
using MomSite.Infrastructure.Data;
using MomSite.Infrastructure.Services;
using Moq;
using Xunit;

namespace MomSite.Tests
{
    // Slice 2 — public reviews API: the published list visitors read and the
    // submission form they write through.
    public class PublicReviewsControllerTests
    {
        private static ApplicationDbContext CreateDbContext(string dbName)
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: dbName)
                .Options;
            return new ApplicationDbContext(options);
        }

        private class AlwaysAllowRateLimiter : IContactRateLimiter
        {
            public bool TryAcquire(string clientKey) => true;
        }

        private static PublicController CreateController(
            ApplicationDbContext context,
            IEnumerable<IFeedbackNotifier>? notifiers = null,
            IContactRateLimiter? rateLimiter = null)
        {
            var httpContext = new DefaultHttpContext();
            httpContext.Connection.RemoteIpAddress = System.Net.IPAddress.Parse("203.0.113.42");

            var controller = new PublicController(
                context,
                notifiers ?? Array.Empty<IFeedbackNotifier>(),
                Mock.Of<ILogger<PublicController>>(),
                rateLimiter ?? new AlwaysAllowRateLimiter());
            controller.ControllerContext = new ControllerContext { HttpContext = httpContext };
            return controller;
        }

        private static Review Published(string name, int sortOrder) => new()
        {
            AuthorName = name,
            Text = $"Отзыв {name}",
            Rating = 5,
            IsPublished = true,
            PublishedAt = DateTime.UtcNow,
            SortOrder = sortOrder,
            CreatedAt = DateTime.UtcNow
        };

        private static CreateReviewDto ValidReview() => new()
        {
            AuthorName = "Мария",
            Text = "Картина великолепна, спасибо!",
            Rating = 5
        };

        private static Mock<IFeedbackNotifier> EnabledNotifier()
        {
            var mock = new Mock<IFeedbackNotifier>();
            mock.SetupGet(n => n.IsEnabled).Returns(true);
            mock.Setup(n => n.NotifyAsync(It.IsAny<Review>(), It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);
            return mock;
        }

        private static List<ReviewDto> ReviewsOf(ActionResult<List<ReviewDto>> result)
        {
            var ok = Assert.IsType<OkObjectResult>(result.Result);
            return Assert.IsType<List<ReviewDto>>(ok.Value);
        }

        private static List<ValidationResult> Validate(CreateReviewDto dto)
        {
            var results = new List<ValidationResult>();
            Validator.TryValidateObject(dto, new ValidationContext(dto), results, validateAllProperties: true);
            return results;
        }

        [Fact]
        [Trait("Scenario", "S2-AS1")]
        public async Task GetReviews_ReturnsOnlyPublishedOnes()
        {
            using var context = CreateDbContext(nameof(GetReviews_ReturnsOnlyPublishedOnes));
            context.Reviews.Add(Published("A", 1));
            context.Reviews.Add(new Review
            {
                AuthorName = "B",
                Text = "Ещё не проверен",
                Rating = 4,
                IsPublished = false,
                SortOrder = 0,
                CreatedAt = DateTime.UtcNow
            });
            await context.SaveChangesAsync();

            var reviews = ReviewsOf(await CreateController(context).GetReviews());

            Assert.Equal(new[] { "A" }, reviews.Select(r => r.AuthorName));
        }

        [Fact]
        [Trait("Scenario", "S2-AS2")]
        public async Task GetReviews_OrdersBySortOrder()
        {
            using var context = CreateDbContext(nameof(GetReviews_OrdersBySortOrder));
            context.Reviews.Add(Published("X", 2));
            context.Reviews.Add(Published("Y", 1));
            await context.SaveChangesAsync();

            var reviews = ReviewsOf(await CreateController(context).GetReviews());

            Assert.Equal(new[] { "Y", "X" }, reviews.Select(r => r.AuthorName));
        }

        [Fact]
        [Trait("Scenario", "S2-AS3")]
        public async Task GetReviews_WithNothingPublished_ReturnsEmptyList()
        {
            using var context = CreateDbContext(nameof(GetReviews_WithNothingPublished_ReturnsEmptyList));

            var reviews = ReviewsOf(await CreateController(context).GetReviews());

            Assert.Empty(reviews);
        }

        [Fact]
        [Trait("Scenario", "S2-AS4")]
        public async Task CreateReview_StoresUnpublishedReviewAndNotifiesOwner()
        {
            using var context = CreateDbContext(nameof(CreateReview_StoresUnpublishedReviewAndNotifiesOwner));
            var telegram = EnabledNotifier();
            var controller = CreateController(context, new[] { telegram.Object });

            var result = await controller.CreateReview(ValidReview());

            Assert.IsType<OkObjectResult>(result);
            var stored = Assert.Single(context.Reviews);
            Assert.False(stored.IsPublished);
            Assert.Equal("Мария", stored.AuthorName);
            telegram.Verify(
                n => n.NotifyAsync(It.Is<Review>(r => r.AuthorName == "Мария"), It.IsAny<CancellationToken>()),
                Times.Once);
        }

        [Fact]
        [Trait("Scenario", "S2-AS4")]
        public async Task CreateReview_WhenNotifierFails_StillAcceptsTheReview()
        {
            using var context = CreateDbContext(nameof(CreateReview_WhenNotifierFails_StillAcceptsTheReview));
            var telegram = EnabledNotifier();
            telegram.Setup(n => n.NotifyAsync(It.IsAny<Review>(), It.IsAny<CancellationToken>()))
                .ThrowsAsync(new InvalidOperationException("channel failure"));
            var controller = CreateController(context, new[] { telegram.Object });

            var result = await controller.CreateReview(ValidReview());

            Assert.IsType<OkObjectResult>(result);
            Assert.Single(context.Reviews);
        }

        [Fact]
        [Trait("Scenario", "S2-AS4")]
        public async Task CreateReview_DoesNotCallDisabledNotifiers()
        {
            using var context = CreateDbContext(nameof(CreateReview_DoesNotCallDisabledNotifiers));
            var disabled = new Mock<IFeedbackNotifier>();
            disabled.SetupGet(n => n.IsEnabled).Returns(false);
            var controller = CreateController(context, new[] { disabled.Object });

            await controller.CreateReview(ValidReview());

            disabled.Verify(n => n.NotifyAsync(It.IsAny<Review>(), It.IsAny<CancellationToken>()), Times.Never);
        }

        [Fact]
        [Trait("Scenario", "S2-AS5")]
        public void CreateReviewDto_WithEmptyAuthorName_FailsValidation()
        {
            var dto = ValidReview();
            dto.AuthorName = "";

            Assert.Contains(Validate(dto), r => r.MemberNames.Contains(nameof(CreateReviewDto.AuthorName)));
        }

        [Fact]
        [Trait("Scenario", "S2-AS5")]
        public async Task CreateReview_WithInvalidModelState_ReturnsBadRequestAndStoresNothing()
        {
            using var context = CreateDbContext(nameof(CreateReview_WithInvalidModelState_ReturnsBadRequestAndStoresNothing));
            var controller = CreateController(context);
            controller.ModelState.AddModelError(nameof(CreateReviewDto.AuthorName), "Имя обязательно");

            var result = await controller.CreateReview(ValidReview());

            Assert.IsType<BadRequestObjectResult>(result);
            Assert.Empty(context.Reviews);
        }

        [Theory]
        [InlineData(0)]
        [InlineData(7)]
        [Trait("Scenario", "S2-AS6")]
        public void CreateReviewDto_WithRatingOutsideOneToFive_FailsValidation(int rating)
        {
            var dto = ValidReview();
            dto.Rating = rating;

            Assert.Contains(Validate(dto), r => r.MemberNames.Contains(nameof(CreateReviewDto.Rating)));
        }

        [Theory]
        [InlineData(1)]
        [InlineData(5)]
        [Trait("Scenario", "S2-AS6")]
        public void CreateReviewDto_WithRatingAtTheEdges_PassesValidation(int rating)
        {
            var dto = ValidReview();
            dto.Rating = rating;

            Assert.Empty(Validate(dto));
        }

        [Fact]
        [Trait("Scenario", "S2-AS7")]
        public void CreateReviewDto_WithTextOverTheLimit_FailsValidation()
        {
            var dto = ValidReview();
            dto.Text = new string('a', 2001);

            Assert.Contains(Validate(dto), r => r.MemberNames.Contains(nameof(CreateReviewDto.Text)));
        }

        [Fact]
        [Trait("Scenario", "S2-AS8")]
        public async Task CreateReview_ExceedingTheRateLimit_Returns429AndStoresNothingExtra()
        {
            using var context = CreateDbContext(nameof(CreateReview_ExceedingTheRateLimit_Returns429AndStoresNothingExtra));
            var timeProvider = new FakeTimeProvider();
            var limiter = new FixedWindowContactRateLimiter(
                new ContactRateLimiterOptions { PermitLimit = 1, WindowMinutes = 10 },
                timeProvider);
            var controller = CreateController(context, rateLimiter: limiter);

            Assert.IsType<OkObjectResult>(await controller.CreateReview(ValidReview()));

            var blocked = await controller.CreateReview(ValidReview());

            Assert.Equal(StatusCodes.Status429TooManyRequests, Assert.IsType<ObjectResult>(blocked).StatusCode);
            Assert.Single(context.Reviews);
        }

        [Fact]
        [Trait("Scenario", "S2-AS9")]
        public async Task CreateReview_WithoutArtworkOrPhoto_IsAccepted()
        {
            using var context = CreateDbContext(nameof(CreateReview_WithoutArtworkOrPhoto_IsAccepted));
            var controller = CreateController(context);

            var result = await controller.CreateReview(ValidReview());

            Assert.IsType<OkObjectResult>(result);
            var stored = Assert.Single(context.Reviews);
            Assert.Null(stored.ArtworkId);
            Assert.Null(stored.PhotoPath);
        }
    }
}
