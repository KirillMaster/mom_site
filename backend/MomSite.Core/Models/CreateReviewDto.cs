using System.ComponentModel.DataAnnotations;

namespace MomSite.Core.Models
{
    /// <summary>
    /// Payload for a visitor-submitted review (POST /api/public/reviews).
    /// The resulting Review is always created with IsPublished = false —
    /// this DTO has no way to set moderation fields.
    /// </summary>
    public class CreateReviewDto
    {
        [Required(ErrorMessage = "Имя обязательно")]
        [StringLength(100, MinimumLength = 1, ErrorMessage = "Имя не должно превышать 100 символов")]
        public string AuthorName { get; set; } = string.Empty;

        [StringLength(100)]
        public string? AuthorCity { get; set; }

        [Required(ErrorMessage = "Текст отзыва обязателен")]
        [StringLength(2000, MinimumLength = 1, ErrorMessage = "Текст отзыва не должен превышать 2000 символов")]
        public string Text { get; set; } = string.Empty;

        [Range(1, 5, ErrorMessage = "Оценка должна быть от 1 до 5")]
        public int Rating { get; set; }

        public int? ArtworkId { get; set; }

        [StringLength(500)]
        public string? PhotoPath { get; set; }
    }
}
