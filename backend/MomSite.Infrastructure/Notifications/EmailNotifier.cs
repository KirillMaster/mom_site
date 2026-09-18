using System.Text.Encodings.Web;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Logging;
using MimeKit;
using MomSite.Core.Interfaces;
using MomSite.Core.Models;

namespace MomSite.Infrastructure.Notifications;

/// <summary>
/// Sends a new-contact-message notification by email via SMTP (MailKit).
/// Enabled only when EMAIL_USERNAME/EMAIL_PASSWORD are configured; a send
/// failure (e.g. bad credentials) throws and is left for the caller to
/// catch and log — it must never surface as a 500 to the API caller.
/// </summary>
public class EmailNotifier : IFeedbackNotifier
{
    private static readonly TimeSpan SendTimeout = TimeSpan.FromSeconds(10);

    private readonly ILogger<EmailNotifier> _logger;

    public EmailNotifier(ILogger<EmailNotifier> logger)
    {
        _logger = logger;
    }

    public bool IsEnabled =>
        !string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("EMAIL_USERNAME")) &&
        !string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("EMAIL_PASSWORD"));

    public async Task NotifyAsync(ContactMessage message, CancellationToken cancellationToken = default)
    {
        using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        cts.CancelAfter(SendTimeout);

        var enc = HtmlEncoder.Default;
        var fromAddr = Environment.GetEnvironmentVariable("EMAIL_FROM") ?? "noreply@angelamoiseenko.ru";
        var toAddr = Environment.GetEnvironmentVariable("EMAIL_TO") ?? "karangela@narod.ru";

        var email = new MimeMessage();
        email.From.Add(new MailboxAddress("Сайт Анжелы Моисеенко", fromAddr));
        email.To.Add(new MailboxAddress("Анжела Моисеенко", toAddr));
        email.Subject = $"Новое сообщение с сайта: {message.Subject}";

        if (!string.IsNullOrWhiteSpace(message.Email))
        {
            email.ReplyTo.Add(new MailboxAddress(message.Name, message.Email));
        }

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
            SecureSocketOptions.StartTls,
            cts.Token
        );

        await smtp.AuthenticateAsync(
            Environment.GetEnvironmentVariable("EMAIL_USERNAME") ?? "",
            Environment.GetEnvironmentVariable("EMAIL_PASSWORD") ?? "",
            cts.Token
        );

        await smtp.SendAsync(email, cts.Token);
        await smtp.DisconnectAsync(true, cts.Token);

        _logger.LogInformation("Contact message notification emailed to {To} from {FromEmail}", toAddr, message.Email);
    }
}
