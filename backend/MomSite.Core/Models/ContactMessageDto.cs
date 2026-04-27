using System.ComponentModel.DataAnnotations;

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
    }
}
