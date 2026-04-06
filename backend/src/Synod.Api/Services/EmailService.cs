using MailKit.Net.Smtp;
using MimeKit;

namespace Synod.Api.Services;

public interface IEmailService
{
    Task SendInvitationEmailAsync(string toEmail, string inviterName, string orgName, string token);
    Task SendEmailAsync(string toEmail, string subject, string htmlBody);
}

public class EmailService : IEmailService
{
    private readonly IConfiguration _config;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IConfiguration config, ILogger<EmailService> logger)
    {
        _config = config;
        _logger = logger;
    }

    public async Task SendInvitationEmailAsync(string toEmail, string inviterName, string orgName, string token)
    {
        var appUrl = _config["AllowedOrigins"] ?? "http://localhost:3000";
        var acceptUrl = appUrl + "/invite/" + token;

        var subject = "You're invited to join " + orgName + " on Synod";
        var htmlBody = GetInvitationEmailHtml(inviterName, orgName, acceptUrl);

        await SendEmailAsync(toEmail, subject, htmlBody);
    }

    public async Task SendEmailAsync(string toEmail, string subject, string htmlBody)
    {
        try
        {
            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(
                _config["Email:FromName"] ?? "Synod",
                _config["Email:FromAddress"] ?? "noreply@synod.dev"
            ));
            message.To.Add(MailboxAddress.Parse(toEmail));
            message.Subject = subject;

            var builder = new BodyBuilder { HtmlBody = htmlBody };
            message.Body = builder.ToMessageBody();

            using var client = new SmtpClient();
            await client.ConnectAsync(
                _config["Email:SmtpHost"] ?? "localhost",
                int.Parse(_config["Email:SmtpPort"] ?? "1025"),
                false
            );

            var username = _config["Email:Username"];
            var password = _config["Email:Password"];
            if (!string.IsNullOrEmpty(username) && !string.IsNullOrEmpty(password))
            {
                await client.AuthenticateAsync(username, password);
            }

            await client.SendAsync(message);
            await client.DisconnectAsync(true);

            _logger.LogInformation("Email sent to {Email}: {Subject}", toEmail, subject);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email to {Email}", toEmail);
            throw;
        }
    }

    private static string GetInvitationEmailHtml(string inviterName, string orgName, string acceptUrl)
    {
        return @"
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
</head>
<body style='font-family: -apple-system, BlinkMacSystemFont, ""Segoe UI"", Roboto, sans-serif; background-color: #050505; color: #a1a1aa; padding: 40px 20px;'>
    <div style='max-width: 480px; margin: 0 auto; background-color: #18181b; border: 1px solid #27272a; border-radius: 8px; padding: 40px;'>
        <h1 style='color: #ffffff; font-size: 24px; margin: 0 0 8px 0;'>You're invited to join Synod</h1>
        <p style='margin: 0 0 24px 0; color: #71717a;'>" + inviterName + @" has invited you to join <strong style='color: #ffffff;'>" + orgName + @"</strong> as a leader.</p>
        <a href='" + acceptUrl + @"' style='display: inline-block; background-color: #ffffff; color: #000000; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 500;'>Accept Invitation</a>
        <p style='margin: 24px 0 0 0; font-size: 14px; color: #52525b;'>This invitation expires in 7 days. If you didn't expect this, you can ignore this email.</p>
    </div>
</body>
</html>";
    }
}
