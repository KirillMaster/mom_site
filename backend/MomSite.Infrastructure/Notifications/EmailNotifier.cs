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

        var (html, text) = BuildBodies(message);
        var bodyBuilder = new BodyBuilder { HtmlBody = html, TextBody = text };
        email.Body = bodyBuilder.ToMessageBody();

        var port = int.Parse(Environment.GetEnvironmentVariable("EMAIL_SMTP_PORT") ?? "587");

        using var smtp = new SmtpClient();
        await smtp.ConnectAsync(
            Environment.GetEnvironmentVariable("EMAIL_SMTP_SERVER") ?? "smtp.gmail.com",
            port,
            SecurityForPort(port),
            cts.Token
        );

        await smtp.AuthenticateAsync(
            Environment.GetEnvironmentVariable("EMAIL_USERNAME") ?? "",
            Environment.GetEnvironmentVariable("EMAIL_PASSWORD") ?? "",
            cts.Token
        );

        await smtp.SendAsync(email, cts.Token);
        await smtp.DisconnectAsync(true, cts.Token);

        _logger.LogInformation("Contact message notification emailed to {To} from {FromEmail}", toAddr, message.Email ?? message.Phone);
    }

    public static (string Html, string Text) BuildBodies(ContactMessage message)
    {
        var enc = HtmlEncoder.Default;
        var html = $@"
                <h2>Новое сообщение с сайта</h2>
                <p><strong>Имя:</strong> {enc.Encode(message.Name)}</p>
                <p><strong>Email:</strong> {enc.Encode(LeadSource.Dash(message.Email))}</p>
                <p><strong>Телефон/мессенджер:</strong> {enc.Encode(LeadSource.Dash(message.Phone))}</p>
                <p><strong>Тема:</strong> {enc.Encode(message.Subject)}</p>
                <p><strong>Источник:</strong> {enc.Encode(LeadSource.Describe(message))}</p>
                <p><strong>Сообщение:</strong></p>
                <p>{enc.Encode(message.Message).Replace("\n", "<br>")}</p>
            ";
        var text = $"Имя: {message.Name}\nEmail: {LeadSource.Dash(message.Email)}\n" +
                   $"Телефон/мессенджер: {LeadSource.Dash(message.Phone)}\n" +
                   $"Тема: {message.Subject}\nИсточник: {LeadSource.Describe(message)}\n\n{message.Message}";
        return (html, text);
    }

    /// <summary>
    /// A server on 465 expects TLS from the first byte, while 587 starts in the
    /// clear and upgrades. Guessing wrong makes the handshake hang until the send
    /// timeout, so the port decides.
    /// </summary>
    public static SecureSocketOptions SecurityForPort(int port) =>
        port == 465 ? SecureSocketOptions.SslOnConnect : SecureSocketOptions.StartTls;
}
