using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;
using MomSite.Core.Models;

namespace MomSite.API.Services
{
    public interface IEmailService
    {
        Task<bool> SendContactMessageAsync(ContactMessageDto message);
    }

    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;

        public EmailService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public async Task<bool> SendContactMessageAsync(ContactMessageDto message)
        {
            try
            {
                var email = new MimeMessage();
                email.From.Add(new MailboxAddress("Сайт Анжелы Моисеенко", Environment.GetEnvironmentVariable("EMAIL_FROM") ?? "noreply@angelamoiseenko.ru"));
                email.To.Add(new MailboxAddress("Анжела Моисеенко", Environment.GetEnvironmentVariable("EMAIL_TO") ?? "karangela@narod.ru"));
                email.Subject = $"Новое сообщение с сайта: {message.Subject}";

                var bodyBuilder = new BodyBuilder
                {
                    HtmlBody = $@"
                        <h2>Новое сообщение с сайта</h2>
                        <p><strong>Имя:</strong> {message.Name}</p>
                        <p><strong>Email:</strong> {message.Email}</p>
                        <p><strong>Тема:</strong> {message.Subject}</p>
                        <p><strong>Сообщение:</strong></p>
                        <p>{message.Message.Replace("\n", "<br>")}</p>
                    "
                };

                email.Body = bodyBuilder.ToMessageBody();

                using var smtp = new SmtpClient();
                await smtp.ConnectAsync(
                    Environment.GetEnvironmentVariable("EMAIL_SMTP_SERVER") ?? "smtp.gmail.com",
                    int.Parse(Environment.GetEnvironmentVariable("EMAIL_SMTP_PORT") ?? "587"),
                    SecureSocketOptions.StartTls
                );

                await smtp.AuthenticateAsync(
                    Environment.GetEnvironmentVariable("EMAIL_USERNAME") ?? "",
                    Environment.GetEnvironmentVariable("EMAIL_PASSWORD") ?? ""
                );

                await smtp.SendAsync(email);
                await smtp.DisconnectAsync(true);

                return true;
            }
            catch (Exception ex)
            {
                // В продакшене лучше использовать логгер
                Console.WriteLine($"Error sending email: {ex.Message}");
                return false;
            }
        }
    }
}
