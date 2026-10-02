using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace MomSite.Core.Models
{
    public class ContactMessageDto : IValidatableObject
    {
        [Required(ErrorMessage = "Имя обязательно")]
        [StringLength(200, MinimumLength = 1)]
        public string Name { get; set; } = string.Empty;

        private string? _email;
        private string? _phone;

        [EmailAddress(ErrorMessage = "Некорректный email")]
        [StringLength(200)]
        public string? Email
        {
            get => _email;
            set => _email = string.IsNullOrWhiteSpace(value) ? null : value.Trim();
        }

        [StringLength(100, ErrorMessage = "Телефон не длиннее 100 символов")]
        public string? Phone
        {
            get => _phone;
            set => _phone = string.IsNullOrWhiteSpace(value) ? null : value.Trim();
        }

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

        public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
        {
            if (Email is null && Phone is null)
            {
                yield return new ValidationResult(
                    "Укажите email или телефон",
                    new[] { nameof(Email), nameof(Phone) });
            }
        }
    }
}
