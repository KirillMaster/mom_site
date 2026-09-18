using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace MomSite.Core.Models
{
    public class ContactMessageDto
    {
        [Required(ErrorMessage = "Имя обязательно")]
        [StringLength(200, MinimumLength = 1)]
        public string Name { get; set; } = string.Empty;

        [Required(ErrorMessage = "Email обязателен")]
        [EmailAddress(ErrorMessage = "Некорректный email")]
        [StringLength(200)]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "Тема обязательна")]
        [StringLength(200, MinimumLength = 1)]
        public string Subject { get; set; } = string.Empty;

        [Required(ErrorMessage = "Сообщение обязательно")]
        [StringLength(5000, MinimumLength = 1)]
        public string Message { get; set; } = string.Empty;

        [JsonPropertyName("utm_source")]
        [StringLength(200)]
        public string? UtmSource { get; set; }

        [JsonPropertyName("utm_medium")]
        [StringLength(200)]
        public string? UtmMedium { get; set; }

        [JsonPropertyName("utm_campaign")]
        [StringLength(200)]
        public string? UtmCampaign { get; set; }

        /// <summary>
        /// Honeypot anti-spam field. Legitimate human visitors never see or
        /// fill this field (hidden off-screen in the form), so any non-empty
        /// value marks the submission as a bot and it is silently discarded
        /// by the server (200 response, no persistence, no notifications).
        /// </summary>
        [JsonPropertyName("website")]
        public string? Website { get; set; }
    }
}
