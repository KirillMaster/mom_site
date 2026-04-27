using System.Text.Encodings.Web;
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
        private readonly ILogger<EmailService> _logger;

        public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        public async Task<bool> SendContactMessageAsync(ContactMessageDto message)
        {
            try
            {
                var enc = HtmlEncoder.Default;
                var fromAddr = Environment.GetEnvironmentVariable("EMAIL_FROM") ?? "noreply@angelamoiseenko.ru";
                var toAddr = Environment.GetEnvironmentVariable("EMAIL_TO") ?? "karangela@narod.ru";

                var email = new MimeMessage();
                email.From.Add(new MailboxAddress("Сайт Анжелы Моисеенко", fromAddr));
                email.To.Add(new MailboxAddress("Анжела Моисеенко", toAddr));
                email.Subject = $"Новое сообщение с сайта: {message.Subject}";

                // Reply-To = visitor email so the artist can reply directly
                if (!string.IsNullOrWhiteSpace(message.Email))
                {
                    email.ReplyTo.Add(new MailboxAddress(message.Name, message.Email));
                }

                // HTML-encode every interpolated user value to neutralize
                // any HTML/script that a visitor could submit through the
                // contact form (otherwise stored XSS in the recipient's
                // email client).
                var bodyBuilder = new BodyBuilder
                {
                    HtmlBody = $@"
                        <h2>Новое сообщение с сайта</h2>
                        <p><strong>Имя:</strong> {enc.Encode(message.Name)}</p>
                        <p><strong>Email:</strong> {enc.Encode(message.Email)}</p>
                        <p><strong>Тема:</strong> {enc.Encode(message.Subject)}</p>
                        <p><strong>Сообщение:</strong></p>
                        <p>{enc.Encode(message.Message).Replace("\n", "<br>")}</p>
                    ",
                    TextBody = $"Имя: {message.Name}\nEmail: {message.Email}\nТема: {message.Subject}\n\n{message.Message}"
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

                _logger.LogInformation("Contact message sent to {To} from {FromEmail}", toAddr, message.Email);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send contact message from {FromEmail}", message.Email);
                return false;
            }
        }
    }
}
