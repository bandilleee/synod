using MailKit.Net.Smtp;
using MimeKit;

namespace Synod.Api.Services;

public interface IEmailService
{
    // Invitation & Welcome
    Task SendInvitationEmailAsync(string toEmail, string inviterName, string orgName, string token);
    Task SendWelcomeEmailAsync(string toEmail, string userName, string orgName);

    // Forms
    Task SendFormCreatedEmailAsync(IEnumerable<string> leaderEmails, string creatorName, string formTitle);
    Task SendFormUpdatedEmailAsync(IEnumerable<string> leaderEmails, string editorName, string formTitle);
    Task SendFormDeletedEmailAsync(IEnumerable<string> leaderEmails, string deleterName, string formTitle);

    // Events
    Task SendEventRejectedEmailAsync(string creatorEmail, string rejectorName, string eventTitle, string? reason);
    Task SendEventDeletedEmailAsync(IEnumerable<string> leaderEmails, string deleterName, string eventTitle);

    // Members
    Task SendMemberDeletedEmailAsync(IEnumerable<string> leaderEmails, string deleterName, string memberEmail, string? memberName);

    // Settings (self notifications)
    Task SendProfileUpdatedEmailAsync(string toEmail, string userName);
    Task SendPasswordChangedEmailAsync(string toEmail, string userName);

    // Admin - Organizations
    Task SendOrgCreatedEmailAsync(string adminEmail, string orgName, string orgType);
    Task SendOrgUpdatedEmailAsync(string adminEmail, string orgName);
    Task SendOrgDeletedEmailAsync(string adminEmail, string orgName);
    Task SendOrgAccessRevokedEmailAsync(string leaderEmail, string leaderName, string orgName);

    // Admin - Leaders
    Task SendLeaderSuspendedEmailAsync(string leaderEmail, string leaderName, string orgName);
    Task SendLeaderRemovedEmailAsync(string leaderEmail, string leaderName, string orgName);
    Task SendLeaderRemovedAdminNotificationAsync(string adminEmail, string leaderName, string leaderEmail, string orgName);

    // Base method
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

    #region Invitation & Welcome

    public async Task SendInvitationEmailAsync(string toEmail, string inviterName, string orgName, string token)
    {
        var appUrl = _config["AllowedOrigins"] ?? "http://localhost:3000";
        var acceptUrl = appUrl + "/invite/" + token;

        var subject = "You're invited to join " + orgName + " on Synod";
        var htmlBody = BuildEmail(
            title: "You've been invited",
            preheader: inviterName + " invited you to join " + orgName + " on Synod.",
            body: "<strong>" + inviterName + "</strong> has invited you to join <strong>" + orgName + "</strong> as a leader on the Synod platform.",
            highlights: null,
            buttonText: "Accept Invitation",
            buttonUrl: acceptUrl,
            footer: "This invitation expires in 7 days. If you didn't expect this email, you can safely ignore it."
        );

        await SendEmailAsync(toEmail, subject, htmlBody);
    }

    public async Task SendWelcomeEmailAsync(string toEmail, string userName, string orgName)
    {
        var appUrl = _config["AllowedOrigins"] ?? "http://localhost:3000";
        var dashboardUrl = appUrl + "/dashboard";

        var subject = "Welcome to Synod, " + userName + "!";
        var htmlBody = BuildWelcomeEmail(userName, orgName, dashboardUrl);

        await SendEmailAsync(toEmail, subject, htmlBody);
    }

    #endregion

    #region Forms

    public async Task SendFormCreatedEmailAsync(IEnumerable<string> leaderEmails, string creatorName, string formTitle)
    {
        var subject = "New form created: " + formTitle;
        var htmlBody = BuildEmail(
            title: "New Form Created",
            preheader: creatorName + " created a new form: " + formTitle,
            body: "<strong>" + creatorName + "</strong> has created a new form on the Synod platform.",
            highlights: new[] { ("Form Title", formTitle) },
            buttonText: null, buttonUrl: null,
            footer: "You're receiving this because you're a leader on the Synod platform."
        );

        foreach (var email in leaderEmails)
            await SendEmailAsync(email, subject, htmlBody);
    }

    public async Task SendFormUpdatedEmailAsync(IEnumerable<string> leaderEmails, string editorName, string formTitle)
    {
        var subject = "Form updated: " + formTitle;
        var htmlBody = BuildEmail(
            title: "Form Updated",
            preheader: editorName + " updated the form: " + formTitle,
            body: "<strong>" + editorName + "</strong> has made changes to an existing form.",
            highlights: new[] { ("Form Title", formTitle) },
            buttonText: null, buttonUrl: null,
            footer: "You're receiving this because you're a leader on the Synod platform."
        );

        foreach (var email in leaderEmails)
            await SendEmailAsync(email, subject, htmlBody);
    }

    public async Task SendFormDeletedEmailAsync(IEnumerable<string> leaderEmails, string deleterName, string formTitle)
    {
        var subject = "Form deleted: " + formTitle;
        var htmlBody = BuildEmail(
            title: "Form Deleted",
            preheader: deleterName + " deleted the form: " + formTitle,
            body: "<strong>" + deleterName + "</strong> has permanently deleted a form from the platform.",
            highlights: new[] { ("Deleted Form", formTitle) },
            buttonText: null, buttonUrl: null,
            footer: "You're receiving this because you're a leader on the Synod platform."
        );

        foreach (var email in leaderEmails)
            await SendEmailAsync(email, subject, htmlBody);
    }

    #endregion

    #region Events

    public async Task SendEventRejectedEmailAsync(string creatorEmail, string rejectorName, string eventTitle, string? reason)
    {
        var subject = "Your event was rejected: " + eventTitle;
        var reasonNote = string.IsNullOrEmpty(reason)
            ? null
            : new[] { ("Reason", reason) };

        var htmlBody = BuildEmail(
            title: "Event Rejected",
            preheader: "Your event \"" + eventTitle + "\" was not approved.",
            body: "Your event <strong>" + eventTitle + "</strong> was rejected by <strong>" + rejectorName + "</strong>. You can review the reason below and resubmit with changes.",
            highlights: reasonNote,
            buttonText: null, buttonUrl: null,
            footer: "You can create a new event incorporating the suggested changes."
        );

        await SendEmailAsync(creatorEmail, subject, htmlBody);
    }

    public async Task SendEventDeletedEmailAsync(IEnumerable<string> leaderEmails, string deleterName, string eventTitle)
    {
        var subject = "Event deleted: " + eventTitle;
        var htmlBody = BuildEmail(
            title: "Event Deleted",
            preheader: deleterName + " deleted the event: " + eventTitle,
            body: "<strong>" + deleterName + "</strong> has deleted an event from the platform.",
            highlights: new[] { ("Deleted Event", eventTitle) },
            buttonText: null, buttonUrl: null,
            footer: "You're receiving this because you're a leader on the Synod platform."
        );

        foreach (var email in leaderEmails)
            await SendEmailAsync(email, subject, htmlBody);
    }

    #endregion

    #region Members

    public async Task SendMemberDeletedEmailAsync(IEnumerable<string> leaderEmails, string deleterName, string memberEmail, string? memberName)
    {
        var memberDisplay = string.IsNullOrEmpty(memberName) ? memberEmail : memberName;
        var subject = "Member removed: " + memberDisplay;
        var htmlBody = BuildEmail(
            title: "Member Removed",
            preheader: deleterName + " removed a member from the platform.",
            body: "<strong>" + deleterName + "</strong> has removed a member from the platform.",
            highlights: string.IsNullOrEmpty(memberName)
                ? new[] { ("Email", memberEmail) }
                : new[] { ("Name", memberName!), ("Email", memberEmail) },
            buttonText: null, buttonUrl: null,
            footer: "You're receiving this because you're a leader on the Synod platform."
        );

        foreach (var email in leaderEmails)
            await SendEmailAsync(email, subject, htmlBody);
    }

    #endregion

    #region Settings

    public async Task SendProfileUpdatedEmailAsync(string toEmail, string userName)
    {
        var subject = "Your profile was updated";
        var htmlBody = BuildEmail(
            title: "Profile Updated",
            preheader: "Your Synod profile information was recently changed.",
            body: "Hi <strong>" + userName + "</strong>, your profile information on Synod has been successfully updated.",
            highlights: null,
            buttonText: null, buttonUrl: null,
            footer: "If you didn't make this change, please contact support immediately."
        );

        await SendEmailAsync(toEmail, subject, htmlBody);
    }

    public async Task SendPasswordChangedEmailAsync(string toEmail, string userName)
    {
        var subject = "Your password was changed";
        var htmlBody = BuildEmail(
            title: "Password Changed",
            preheader: "Your Synod account password was recently changed.",
            body: "Hi <strong>" + userName + "</strong>, your account password has been successfully updated.",
            highlights: null,
            buttonText: null, buttonUrl: null,
            footer: "If you didn't make this change, please contact support immediately and reset your password."
        );

        await SendEmailAsync(toEmail, subject, htmlBody);
    }

    #endregion

    #region Admin - Organizations

    public async Task SendOrgCreatedEmailAsync(string adminEmail, string orgName, string orgType)
    {
        var subject = "Organization created: " + orgName;
        var htmlBody = BuildEmail(
            title: "Organization Created",
            preheader: "Your new " + orgType.ToLower() + " \"" + orgName + "\" is ready.",
            body: "You have successfully created a new <strong>" + orgType + "</strong> on the Synod platform.",
            highlights: new[] { ("Organization Name", orgName) },
            buttonText: null, buttonUrl: null,
            footer: "You can now invite leaders to this organization from your admin dashboard."
        );

        await SendEmailAsync(adminEmail, subject, htmlBody);
    }

    public async Task SendOrgUpdatedEmailAsync(string adminEmail, string orgName)
    {
        var subject = "Organization updated: " + orgName;
        var htmlBody = BuildEmail(
            title: "Organization Updated",
            preheader: "Changes to \"" + orgName + "\" have been saved.",
            body: "Your organization <strong>" + orgName + "</strong> has been updated. All changes have been saved successfully.",
            highlights: null,
            buttonText: null, buttonUrl: null,
            footer: "If you didn't make these changes, please contact support immediately."
        );

        await SendEmailAsync(adminEmail, subject, htmlBody);
    }

    public async Task SendOrgDeletedEmailAsync(string adminEmail, string orgName)
    {
        var subject = "Organization deleted: " + orgName;
        var htmlBody = BuildEmail(
            title: "Organization Deleted",
            preheader: "\"" + orgName + "\" has been permanently removed.",
            body: "You have deleted <strong>" + orgName + "</strong> from the Synod platform. All leaders associated with this organization have been notified and their access has been revoked.",
            highlights: null,
            buttonText: null, buttonUrl: null,
            footer: "This action cannot be undone."
        );

        await SendEmailAsync(adminEmail, subject, htmlBody);
    }

    public async Task SendOrgAccessRevokedEmailAsync(string leaderEmail, string leaderName, string orgName)
    {
        var subject = "Your access to " + orgName + " has been revoked";
        var htmlBody = BuildEmail(
            title: "Access Revoked",
            preheader: "Your leader access to " + orgName + " has been removed.",
            body: "Hi <strong>" + leaderName + "</strong>, the organization <strong>" + orgName + "</strong> has been removed from the Synod platform. As a result, your leader access has been revoked.",
            highlights: null,
            buttonText: null, buttonUrl: null,
            footer: "If you believe this was done in error, please contact the platform administrator."
        );

        await SendEmailAsync(leaderEmail, subject, htmlBody);
    }

    #endregion

    #region Admin - Leaders

    public async Task SendLeaderSuspendedEmailAsync(string leaderEmail, string leaderName, string orgName)
    {
        var subject = "Your account has been suspended";
        var htmlBody = BuildEmail(
            title: "Account Suspended",
            preheader: "Your Synod account has been temporarily suspended.",
            body: "Hi <strong>" + leaderName + "</strong>, your leader account for <strong>" + orgName + "</strong> has been suspended. You will not be able to access the platform until your account is reactivated.",
            highlights: null,
            buttonText: null, buttonUrl: null,
            footer: "If you believe this was done in error, please contact the platform administrator."
        );

        await SendEmailAsync(leaderEmail, subject, htmlBody);
    }

    public async Task SendLeaderRemovedEmailAsync(string leaderEmail, string leaderName, string orgName)
    {
        var subject = "You have been removed from " + orgName;
        var htmlBody = BuildEmail(
            title: "Access Removed",
            preheader: "Your leader access to " + orgName + " has been removed.",
            body: "Hi <strong>" + leaderName + "</strong>, you have been removed as a leader from <strong>" + orgName + "</strong>. You no longer have access to the Synod platform.",
            highlights: null,
            buttonText: null, buttonUrl: null,
            footer: "If you believe this was done in error, please contact the platform administrator."
        );

        await SendEmailAsync(leaderEmail, subject, htmlBody);
    }

    public async Task SendLeaderRemovedAdminNotificationAsync(string adminEmail, string leaderName, string leaderEmail, string orgName)
    {
        var subject = "Leader removed: " + leaderName;
        var htmlBody = BuildEmail(
            title: "Leader Removed",
            preheader: leaderName + " has been removed from " + orgName + ".",
            body: "You have removed a leader from <strong>" + orgName + "</strong>. They have been notified and their access has been revoked.",
            highlights: new[] { ("Leader Name", leaderName), ("Email", leaderEmail) },
            buttonText: null, buttonUrl: null,
            footer: "This action cannot be undone. You can re-invite them from the admin dashboard if needed."
        );

        await SendEmailAsync(adminEmail, subject, htmlBody);
    }

    #endregion

    #region Base Email

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
            
            var smtpHost = _config["Email:SmtpHost"] ?? "localhost";
            var smtpPort = int.Parse(_config["Email:SmtpPort"] ?? "1025");
            
            // Determine SSL/TLS option based on port and host
            MailKit.Security.SecureSocketOptions secureOption;
            if (smtpPort == 465)
            {
                // Port 465 uses implicit SSL
                secureOption = MailKit.Security.SecureSocketOptions.SslOnConnect;
            }
            else if (smtpHost == "smtp.gmail.com" || smtpPort == 587)
            {
                // Port 587 uses STARTTLS
                secureOption = MailKit.Security.SecureSocketOptions.StartTls;
            }
            else
            {
                // Local development (MailHog)
                secureOption = MailKit.Security.SecureSocketOptions.None;
            }
            
            await client.ConnectAsync(smtpHost, smtpPort, secureOption);

            var username = _config["Email:Username"];
            var password = _config["Email:Password"];
            if (!string.IsNullOrEmpty(username) && !string.IsNullOrEmpty(password))
                await client.AuthenticateAsync(username, password);

            await client.SendAsync(message);
            await client.DisconnectAsync(true);

            _logger.LogInformation("Email sent to {Email}: {Subject}", toEmail, subject);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email to {Email}", toEmail);
            // Don't throw — email failures shouldn't break the main operation
        }
    }

    // =========================================================================
    // SharedStyles()
    // Injected into both BuildEmail and BuildWelcomeEmail.
    //
    // Dark mode strategy:
    //   1. <meta name="color-scheme"> + <html style="color-scheme:light dark">
    //      tells supporting clients we handle both modes ourselves.
    //   2. [data-ogsc] / [data-ogsb] selectors target Outlook for Mac dark mode.
    //   3. @media (prefers-color-scheme: dark) targets Apple Mail & iOS Mail.
    //   4. CSS classes on every element allow precise colour overrides.
    //
    // Gmail Android: forces its own inversion and strips prefers-color-scheme.
    //   There is no reliable CSS workaround — this is a known Gmail limitation.
    //   The forced inversion is usually acceptable for transactional email.
    // =========================================================================
    private static string SharedStyles() => @"
    /* ── Reset ── */
    * { box-sizing: border-box; }
    body { margin: 0; padding: 0; }
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: inherit !important; }
    #MessageViewBody a { color: inherit; text-decoration: none; }
    p { line-height: inherit; margin: 0; }

    /* ── Responsive ── */
    @media (max-width: 620px) {
      .email-wrapper     { width: 100% !important; }
      .email-card        { border-radius: 16px !important; padding: 28px 20px !important; }
      .email-footer-card { border-radius: 16px 16px 0 0 !important; padding: 28px 20px !important; }
      h1                 { font-size: 24px !important; }
    }

    /* ── Dark mode — Outlook for Mac ── */
    [data-ogsc] body,
    [data-ogsb] body                           { background-color: #0d0d0d !important; }
    [data-ogsc] .body-bg                       { background-color: #0d0d0d !important; }
    [data-ogsc] .browser-bar                   { background-color: #1c1c1e !important; }
    [data-ogsc] .email-card                    { background-color: #1c1c1e !important; }
    [data-ogsc] .email-footer-card             { background-color: #1c1c1e !important; }
    [data-ogsc] .help-banner                   { background-color: #1e1b2e !important; }
    [data-ogsc] .highlight-box                 { background-color: #2c2c2e !important; border-color: #3a3a3c !important; }
    [data-ogsc] .org-box td                    { background-color: #2c2c2e !important; border-color: #3a3a3c !important; }
    [data-ogsc] .divider td                    { background-color: #3a3a3c !important; }
    [data-ogsc] .feature-row td               { border-bottom-color: #3a3a3c !important; }
    [data-ogsc] .info-table-row td:first-child { color: #8e8e93 !important; }
    [data-ogsc] .info-table-row td:last-child  { color: #f2f2f7 !important; }
    [data-ogsc] .dm-title                      { color: #f2f2f7 !important; }
    [data-ogsc] .dm-body                       { color: #aeaeb2 !important; }
    [data-ogsc] .dm-subtitle                   { color: #8e8e93 !important; }
    [data-ogsc] .dm-org-label                  { color: #8e8e93 !important; }
    [data-ogsc] .dm-org-name                   { color: #f2f2f7 !important; }
    [data-ogsc] .dm-feature-label              { color: #f2f2f7 !important; }
    [data-ogsc] .dm-feature-text               { color: #aeaeb2 !important; }
    [data-ogsc] .dm-help-text                  { color: #c7c7cc !important; }
    [data-ogsc] .dm-help-link                  { color: #c7c7cc !important; }
    [data-ogsc] .dm-footer-text                { color: #636366 !important; }
    [data-ogsc] .dm-footer-link                { color: #636366 !important; }
    [data-ogsc] .dm-footer-copy                { color: #48484a !important; }
    [data-ogsc] .dm-browser-text               { color: #636366 !important; }
    [data-ogsc] .cta-btn                       { background-color: #f2f2f7 !important; color: #0d0d0d !important; }

    /* ── Dark mode — Apple Mail + iOS Mail ── */
    @media (prefers-color-scheme: dark) {
      body,
      .body-bg                                 { background-color: #0d0d0d !important; }
      .browser-bar                             { background-color: #1c1c1e !important; }
      .email-card                              { background-color: #1c1c1e !important; }
      .email-footer-card                       { background-color: #1c1c1e !important; }
      .help-banner                             { background-color: #1e1b2e !important; }
      .highlight-box                           { background-color: #2c2c2e !important; border-color: #3a3a3c !important; }
      .org-box td                              { background-color: #2c2c2e !important; border-color: #3a3a3c !important; }
      .divider td                              { background-color: #3a3a3c !important; }
      .feature-row td                          { border-bottom-color: #3a3a3c !important; }
      .info-table-row td:first-child           { color: #8e8e93 !important; }
      .info-table-row td:last-child            { color: #f2f2f7 !important; }
      .dm-title                                { color: #f2f2f7 !important; }
      .dm-body                                 { color: #aeaeb2 !important; }
      .dm-subtitle                             { color: #8e8e93 !important; }
      .dm-org-label                            { color: #8e8e93 !important; }
      .dm-org-name                             { color: #f2f2f7 !important; }
      .dm-feature-label                        { color: #f2f2f7 !important; }
      .dm-feature-text                         { color: #aeaeb2 !important; }
      .dm-help-text                            { color: #c7c7cc !important; }
      .dm-help-link                            { color: #c7c7cc !important; }
      .dm-footer-text                          { color: #636366 !important; }
      .dm-footer-link                          { color: #636366 !important; }
      .dm-footer-copy                          { color: #48484a !important; }
      .dm-browser-text                         { color: #636366 !important; }
      .cta-btn                                 { background-color: #f2f2f7 !important; color: #0d0d0d !important; }
    }";

    // =========================================================================
    // BuildEmail — general-purpose template used by all system notifications
    // =========================================================================
    private string BuildEmail(
        string title,
        string preheader,
        string body,
        IEnumerable<(string Key, string Value)>? highlights,
        string? buttonText,
        string? buttonUrl,
        string footer)
    {
      var logoUrl = ResolveLogoUrl();

        // Highlights block (key-value info table)
        var highlightsHtml = "";
        if (highlights != null)
        {
            var rows = string.Join("", highlights.Select(h =>
                "<tr class='info-table-row'>" +
                  "<td style='padding:6px 0;color:#6b7280;font-size:13px;white-space:nowrap;padding-right:24px;'>" + h.Key + "</td>" +
                  "<td style='padding:6px 0;color:#040b22;font-size:13px;font-weight:500;'>" + h.Value + "</td>" +
                "</tr>"
            ));
            highlightsHtml = @"
            <table class='highlight-box' width='100%' border='0' cellpadding='0' cellspacing='0'
                   style='background-color:#ffffff;border:1px solid #e5e7eb;border-radius:10px;margin:24px 0;'>
              <tr><td style='padding:16px 20px;'>
                <table border='0' cellpadding='0' cellspacing='0'>" + rows + @"</table>
              </td></tr>
            </table>";
        }

        // CTA button
        var buttonHtml = "";
        if (!string.IsNullOrEmpty(buttonText) && !string.IsNullOrEmpty(buttonUrl))
        {
            buttonHtml = @"
            <table border='0' cellpadding='0' cellspacing='0' style='margin-top:28px;'>
              <tr><td align='left'>
                <a href='" + buttonUrl + @"' class='cta-btn'
                   style='display:inline-block;background-color:#040b22;color:#ffffff;
                          font-family:Urbanist,Helvetica,sans-serif;font-size:15px;font-weight:500;
                          text-decoration:none;padding:13px 28px;border-radius:32px;
                          letter-spacing:0;mso-border-alt:none;'>
                  " + buttonText + @"
                </a>
              </td></tr>
            </table>";
        }

        return @"<!DOCTYPE html>
<html lang='en' xmlns:v='urn:schemas-microsoft-com:vml' xmlns:o='urn:schemas-microsoft-com:office:office'
      style='color-scheme:light dark;supported-color-schemes:light dark;'>
<head>
  <meta charset='utf-8'>
  <meta name='viewport' content='width=device-width,initial-scale=1'>
  <meta name='x-apple-disable-message-reformatting'>
  <meta name='color-scheme' content='light dark'>
  <meta name='supported-color-schemes' content='light dark'>
  <title>" + title + @"</title>
  <!--[if !mso]><!-->
  <link href='https://fonts.googleapis.com/css2?family=Urbanist:ital,wght@0,100..900;1,100..900&display=swap' rel='stylesheet'>
  <!--<![endif]-->
  <style>
  @import url('https://fonts.googleapis.com/css2?family=Urbanist:ital,wght@0,100..900;1,100..900&display=swap');
  " + SharedStyles() + @"</style>
</head>
<body class='body-bg' style='background-color:#ffffff;margin:0;padding:0;
     -webkit-text-size-adjust:none;text-size-adjust:none;'>

  <!-- Hidden preheader — shows as preview text in inbox -->
  <div style='display:none;max-height:0;overflow:hidden;mso-hide:all;'>
    " + preheader + @"&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;
  </div>

  <table width='100%' border='0' cellpadding='0' cellspacing='0' role='presentation'
         class='body-bg' style='background-color:#ffffff;'>
    <tbody><tr><td>

      <!-- View in browser -->
      <table align='center' width='100%' border='0' cellpadding='0' cellspacing='0' role='presentation'>
        <tbody><tr><td>
          <table class='email-wrapper' align='center' width='600' border='0' cellpadding='0' cellspacing='0'
                 role='presentation' style='width:600px;margin:0 auto;'>
            <tbody><tr>
              <td class='browser-bar'
                  style='background-color:#f9f9fb;padding:10px 16px;border-radius:8px;text-align:center;'>
                <p class='dm-browser-text'
                   style='color:#6b7280;font-family:Urbanist,Helvetica,sans-serif;font-size:13px;'>
                  <a href='#' style='color:#6b7280;text-decoration:underline;'>View this email in your browser</a>
                </p>
              </td>
            </tr></tbody>
          </table>
        </td></tr></tbody>
      </table>

      <!-- Logo -->
      <table align='center' width='100%' border='0' cellpadding='0' cellspacing='0' role='presentation'>
        <tbody><tr><td>
          <table class='email-wrapper' align='center' width='600' border='0' cellpadding='0' cellspacing='0'
                 role='presentation' style='width:600px;margin:0 auto;'>
            <tbody><tr><td style='padding:28px 0 24px;text-align:center;'>
                  <img src='" + logoUrl + @"'
                   alt='Synod' width='200' height='72'
                   style='display:inline-block;border:0;height:auto;max-width:100%;'>
            </td></tr></tbody>
          </table>
        </td></tr></tbody>
      </table>

      <!-- Main card -->
      <table align='center' width='100%' border='0' cellpadding='0' cellspacing='0' role='presentation'
             style='padding-left:16px;padding-right:16px;'>
        <tbody><tr><td>
          <table class='email-wrapper' align='center' width='600' border='0' cellpadding='0' cellspacing='0'
                 role='presentation' style='width:600px;margin:0 auto;'>
            <tbody><tr>
              <td class='email-card'
                  style='background-color:#f5f5f7;border-radius:24px;padding:40px 40px 36px;'>

                <!-- Title -->
                <h1 class='dm-title'
                    style='color:#040b22;font-family:Urbanist,Helvetica,sans-serif;font-size:30px;
                           font-weight:600;letter-spacing:-0.5px;line-height:1.2;margin:0 0 16px;'>
                  " + title + @"
                </h1>

                <!-- Divider -->
                <table class='divider' width='100%' border='0' cellpadding='0' cellspacing='0' role='presentation'>
                  <tr><td style='height:1px;background-color:#e5e7eb;font-size:1px;line-height:1px;'>&nbsp;</td></tr>
                </table>

                <!-- Body text -->
                <p class='dm-body'
                   style='color:#4a4f5f;font-family:Urbanist,Helvetica,sans-serif;font-size:16px;
                          font-weight:300;line-height:1.6;margin:20px 0 0;'>
                  " + body + @"
                </p>

                " + highlightsHtml + @"

                " + buttonHtml + @"

                <!-- Bottom divider -->
                <table class='divider' width='100%' border='0' cellpadding='0' cellspacing='0' role='presentation'
                       style='margin-top:28px;'>
                  <tr><td style='height:1px;background-color:#e5e7eb;font-size:1px;line-height:1px;'>&nbsp;</td></tr>
                </table>

                <!-- Footer note -->
                <p class='dm-subtitle'
                   style='color:#9ca3af;font-family:Urbanist,Helvetica,sans-serif;font-size:13px;
                          line-height:1.5;margin:20px 0 0;'>
                  " + footer + @"
                </p>

              </td>
            </tr></tbody>
          </table>
        </td></tr></tbody>
      </table>

      <!-- Spacer -->
      <table align='center' width='100%' border='0' cellpadding='0' cellspacing='0' role='presentation'>
        <tbody><tr><td style='height:24px;line-height:24px;font-size:1px;'>&nbsp;</td></tr></tbody>
      </table>

      <!-- Help banner -->
      <table align='center' width='100%' border='0' cellpadding='0' cellspacing='0' role='presentation'
             style='padding-left:16px;padding-right:16px;'>
        <tbody><tr><td>
          <table class='email-wrapper' align='center' width='600' border='0' cellpadding='0' cellspacing='0'
                 role='presentation' style='width:600px;margin:0 auto;'>
            <tbody><tr>
              <td class='help-banner'
                  style='background-color:#ece9ff;border-radius:24px;padding:16px 32px;text-align:center;'>
                <p class='dm-help-text'
                   style='color:#040b22;font-family:Urbanist,Helvetica,sans-serif;font-size:14px;
                          font-weight:300;line-height:1.4;'>
                  Have questions?
                  <a href='#' class='dm-help-link'
                     style='color:#040b22;font-weight:500;text-decoration:underline;'>Reply to this email</a>
                  — we're here to help.
                </p>
              </td>
            </tr></tbody>
          </table>
        </td></tr></tbody>
      </table>

      <!-- Spacer -->
      <table align='center' width='100%' border='0' cellpadding='0' cellspacing='0' role='presentation'>
        <tbody><tr><td style='height:32px;line-height:32px;font-size:1px;'>&nbsp;</td></tr></tbody>
      </table>

      <!-- Footer card -->
      <table align='center' width='100%' border='0' cellpadding='0' cellspacing='0' role='presentation'>
        <tbody><tr><td>
          <table class='email-wrapper' align='center' width='600' border='0' cellpadding='0' cellspacing='0'
                 role='presentation' style='width:600px;margin:0 auto;'>
            <tbody><tr>
              <td class='email-footer-card'
                  style='background-color:#f5f5f7;border-radius:24px 24px 0 0;padding:36px 40px 40px;text-align:center;'>
                <p class='dm-footer-text'
                   style='color:#6b7280;font-family:Urbanist,Helvetica,sans-serif;font-size:13px;line-height:1.7;'>
                  You received this email because you have an account on the Synod platform.<br>
                  Synod ·
                  <a href='https://synod.dev/privacy' target='_blank' class='dm-footer-link'
                     style='color:#6b7280;text-decoration:none;font-weight:500;'>Privacy Policy</a>
                  &nbsp;|&nbsp;
                  <a href='https://synod.dev/unsubscribe' target='_blank' class='dm-footer-link'
                     style='color:#6b7280;text-decoration:none;font-weight:500;'>Unsubscribe</a>
                </p>
                <p class='dm-footer-copy'
                   style='color:#9ca3af;font-family:Urbanist,Helvetica,sans-serif;font-size:12px;margin-top:12px;'>
                  &copy; 2026 Synod. All rights reserved.
                </p>
              </td>
            </tr></tbody>
          </table>
        </td></tr></tbody>
      </table>

    </td></tr></tbody>
  </table>
</body>
</html>";
    }

    // =========================================================================
    // BuildWelcomeEmail — richer onboarding layout with feature list
    // =========================================================================
    private string BuildWelcomeEmail(string userName, string orgName, string dashboardUrl)
    {
      var logoUrl = ResolveLogoUrl();

        return @"<!DOCTYPE html>
<html lang='en' xmlns:v='urn:schemas-microsoft-com:vml' xmlns:o='urn:schemas-microsoft-com:office:office'
      style='color-scheme:light dark;supported-color-schemes:light dark;'>
<head>
  <meta charset='utf-8'>
  <meta name='viewport' content='width=device-width,initial-scale=1'>
  <meta name='x-apple-disable-message-reformatting'>
  <meta name='color-scheme' content='light dark'>
  <meta name='supported-color-schemes' content='light dark'>
  <title>Welcome to Synod</title>
  <!--[if !mso]><!-->
  <link href='https://fonts.googleapis.com/css2?family=Urbanist:ital,wght@0,100..900;1,100..900&display=swap' rel='stylesheet'>
  <!--<![endif]-->
  <style>
  @import url('https://fonts.googleapis.com/css2?family=Urbanist:ital,wght@0,100..900;1,100..900&display=swap');
  " + SharedStyles() + @"</style>
</head>
<body class='body-bg' style='background-color:#ffffff;margin:0;padding:0;
     -webkit-text-size-adjust:none;text-size-adjust:none;'>

  <!-- Hidden preheader -->
  <div style='display:none;max-height:0;overflow:hidden;mso-hide:all;'>
    Welcome to Synod, " + userName + @"! Your account is now active.&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;
  </div>

  <table width='100%' border='0' cellpadding='0' cellspacing='0' role='presentation'
         class='body-bg' style='background-color:#ffffff;'>
    <tbody><tr><td>

      <!-- View in browser -->
      <table align='center' width='100%' border='0' cellpadding='0' cellspacing='0' role='presentation'>
        <tbody><tr><td>
          <table class='email-wrapper' align='center' width='600' border='0' cellpadding='0' cellspacing='0'
                 role='presentation' style='width:600px;margin:0 auto;'>
            <tbody><tr>
              <td class='browser-bar'
                  style='background-color:#f9f9fb;padding:10px 16px;border-radius:8px;text-align:center;'>
                <p class='dm-browser-text'
                   style='color:#6b7280;font-family:Urbanist,Helvetica,sans-serif;font-size:13px;'>
                  <a href='#' style='color:#6b7280;text-decoration:underline;'>View this email in your browser</a>
                </p>
              </td>
            </tr></tbody>
          </table>
        </td></tr></tbody>
      </table>

      <!-- Logo -->
      <table align='center' width='100%' border='0' cellpadding='0' cellspacing='0' role='presentation'>
        <tbody><tr><td>
          <table class='email-wrapper' align='center' width='600' border='0' cellpadding='0' cellspacing='0'
                 role='presentation' style='width:600px;margin:0 auto;'>
            <tbody><tr><td style='padding:28px 0 24px;text-align:center;'>
                  <img src='" + logoUrl + @"'
                   alt='Synod' width='200' height='72'
                   style='display:inline-block;border:0;height:auto;max-width:100%;'>
            </td></tr></tbody>
          </table>
        </td></tr></tbody>
      </table>

      <!-- Main card -->
      <table align='center' width='100%' border='0' cellpadding='0' cellspacing='0' role='presentation'
             style='padding-left:16px;padding-right:16px;'>
        <tbody><tr><td>
          <table class='email-wrapper' align='center' width='600' border='0' cellpadding='0' cellspacing='0'
                 role='presentation' style='width:600px;margin:0 auto;'>
            <tbody><tr>
              <td class='email-card'
                  style='background-color:#f5f5f7;border-radius:24px;padding:40px 40px 36px;'>

                <!-- Title -->
                <h1 class='dm-title'
                    style='color:#040b22;font-family:Urbanist,Helvetica,sans-serif;font-size:30px;
                           font-weight:600;letter-spacing:-0.5px;line-height:1.2;margin:0 0 6px;'>
                  Welcome to Synod! &#127881;
                </h1>
                <p class='dm-subtitle'
                   style='color:#6b7280;font-family:Urbanist,Helvetica,sans-serif;font-size:16px;
                          font-weight:300;line-height:1.4;margin:0 0 24px;'>
                  Hi " + userName + @", your account is now active.
                </p>

                <!-- Org highlight box -->
                <table class='org-box' width='100%' border='0' cellpadding='0' cellspacing='0' role='presentation'>
                  <tr>
                    <td style='background-color:#ffffff;border-radius:12px;padding:18px 20px;border:1px solid #e5e7eb;'>
                      <p class='dm-org-label'
                         style='color:#6b7280;font-family:Urbanist,Helvetica,sans-serif;font-size:12px;
                                text-transform:uppercase;letter-spacing:0.8px;margin:0 0 6px;font-weight:500;'>
                        You've joined as a leader for
                      </p>
                      <p class='dm-org-name'
                         style='color:#040b22;font-family:Urbanist,Helvetica,sans-serif;font-size:20px;
                                font-weight:600;margin:0;'>
                        " + orgName + @"
                      </p>
                    </td>
                  </tr>
                </table>

                <!-- Divider -->
                <table class='divider' width='100%' border='0' cellpadding='0' cellspacing='0' role='presentation'
                       style='margin:28px 0 0;'>
                  <tr><td style='height:1px;background-color:#e5e7eb;font-size:1px;line-height:1px;'>&nbsp;</td></tr>
                </table>

                <!-- Section heading -->
                <p class='dm-title'
                   style='color:#040b22;font-family:Urbanist,Helvetica,sans-serif;font-size:16px;
                          font-weight:600;margin:24px 0 12px;'>
                  What can you do on Synod?
                </p>

                <!-- Feature list -->
                <table width='100%' border='0' cellpadding='0' cellspacing='0' role='presentation'>
                  <tr class='feature-row'>
                    <td style='padding:10px 0;border-bottom:1px solid #e5e7eb;'>
                      <p style='font-family:Urbanist,Helvetica,sans-serif;font-size:14px;
                                font-weight:300;line-height:1.5;margin:0;'>
                        <strong class='dm-feature-label' style='color:#040b22;font-weight:500;'>&#128203; Forms</strong><br>
                        <span class='dm-feature-text' style='color:#4a4f5f;'>
                          Build custom forms to collect and manage member data efficiently.
                        </span>
                      </p>
                    </td>
                  </tr>
                  <tr class='feature-row'>
                    <td style='padding:10px 0;border-bottom:1px solid #e5e7eb;'>
                      <p style='font-family:Urbanist,Helvetica,sans-serif;font-size:14px;
                                font-weight:300;line-height:1.5;margin:0;'>
                        <strong class='dm-feature-label' style='color:#040b22;font-weight:500;'>&#128140; Newsletters</strong><br>
                        <span class='dm-feature-text' style='color:#4a4f5f;'>
                          Send professional emails directly to your community members.
                        </span>
                      </p>
                    </td>
                  </tr>
                  <tr class='feature-row'>
                    <td style='padding:10px 0;border-bottom:1px solid #e5e7eb;'>
                      <p style='font-family:Urbanist,Helvetica,sans-serif;font-size:14px;
                                font-weight:300;line-height:1.5;margin:0;'>
                        <strong class='dm-feature-label' style='color:#040b22;font-weight:500;'>&#128197; Events</strong><br>
                        <span class='dm-feature-text' style='color:#4a4f5f;'>
                          Plan and approve community events collaboratively with your team.
                        </span>
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style='padding:10px 0;'>
                      <p style='font-family:Urbanist,Helvetica,sans-serif;font-size:14px;
                                font-weight:300;line-height:1.5;margin:0;'>
                        <strong class='dm-feature-label' style='color:#040b22;font-weight:500;'>&#128101; Members</strong><br>
                        <span class='dm-feature-text' style='color:#4a4f5f;'>
                          Manage your community's member database in one place.
                        </span>
                      </p>
                    </td>
                  </tr>
                </table>

                <!-- CTA -->
                <table border='0' cellpadding='0' cellspacing='0' style='margin-top:28px;'>
                  <tr><td align='left'>
                    <a href='" + dashboardUrl + @"' class='cta-btn'
                       style='display:inline-block;background-color:#040b22;color:#ffffff;
                              font-family:Urbanist,Helvetica,sans-serif;font-size:16px;font-weight:500;
                              text-decoration:none;padding:14px 32px;border-radius:32px;
                              letter-spacing:0;mso-border-alt:none;'>
                      Go to Dashboard
                    </a>
                  </td></tr>
                </table>

                <!-- Bottom divider -->
                <table class='divider' width='100%' border='0' cellpadding='0' cellspacing='0' role='presentation'
                       style='margin-top:28px;'>
                  <tr><td style='height:1px;background-color:#e5e7eb;font-size:1px;line-height:1px;'>&nbsp;</td></tr>
                </table>

                <!-- Footer note -->
                <p class='dm-subtitle'
                   style='color:#9ca3af;font-family:Urbanist,Helvetica,sans-serif;font-size:13px;
                          line-height:1.5;margin:20px 0 0;'>
                  Need help? Reply to this email or reach out to your platform administrator.
                </p>

              </td>
            </tr></tbody>
          </table>
        </td></tr></tbody>
      </table>

      <!-- Spacer -->
      <table align='center' width='100%' border='0' cellpadding='0' cellspacing='0' role='presentation'>
        <tbody><tr><td style='height:24px;line-height:24px;font-size:1px;'>&nbsp;</td></tr></tbody>
      </table>

      <!-- Help banner -->
      <table align='center' width='100%' border='0' cellpadding='0' cellspacing='0' role='presentation'
             style='padding-left:16px;padding-right:16px;'>
        <tbody><tr><td>
          <table class='email-wrapper' align='center' width='600' border='0' cellpadding='0' cellspacing='0'
                 role='presentation' style='width:600px;margin:0 auto;'>
            <tbody><tr>
              <td class='help-banner'
                  style='background-color:#ece9ff;border-radius:24px;padding:16px 32px;text-align:center;'>
                <p class='dm-help-text'
                   style='color:#040b22;font-family:Urbanist,Helvetica,sans-serif;font-size:14px;
                          font-weight:300;line-height:1.4;'>
                  Have questions?
                  <a href='mailto:support@synod.dev' class='dm-help-link'
                     style='color:#040b22;font-weight:500;text-decoration:underline;'>Reply to this email</a>
                  — we're here to help.
                </p>
              </td>
            </tr></tbody>
          </table>
        </td></tr></tbody>
      </table>

      <!-- Spacer -->
      <table align='center' width='100%' border='0' cellpadding='0' cellspacing='0' role='presentation'>
        <tbody><tr><td style='height:32px;line-height:32px;font-size:1px;'>&nbsp;</td></tr></tbody>
      </table>

      <!-- Footer card -->
      <table align='center' width='100%' border='0' cellpadding='0' cellspacing='0' role='presentation'>
        <tbody><tr><td>
          <table class='email-wrapper' align='center' width='600' border='0' cellpadding='0' cellspacing='0'
                 role='presentation' style='width:600px;margin:0 auto;'>
            <tbody><tr>
              <td class='email-footer-card'
                  style='background-color:#f5f5f7;border-radius:24px 24px 0 0;padding:36px 40px 40px;text-align:center;'>
                <p class='dm-footer-text'
                   style='color:#6b7280;font-family:Urbanist,Helvetica,sans-serif;font-size:13px;line-height:1.7;'>
                  You received this email because you were invited to the Synod platform.<br>
                  Synod ·
                  <a href='https://synod.dev/privacy' target='_blank' class='dm-footer-link'
                     style='color:#6b7280;text-decoration:none;font-weight:500;'>Privacy Policy</a>
                  &nbsp;|&nbsp;
                  <a href='https://synod.dev/unsubscribe' target='_blank' class='dm-footer-link'
                     style='color:#6b7280;text-decoration:none;font-weight:500;'>Unsubscribe</a>
                </p>
                <p class='dm-footer-copy'
                   style='color:#9ca3af;font-family:Urbanist,Helvetica,sans-serif;font-size:12px;margin-top:12px;'>
                  &copy; 2025 Synod. All rights reserved.
                </p>
              </td>
            </tr></tbody>
          </table>
        </td></tr></tbody>
      </table>

    </td></tr></tbody>
  </table>
</body>
</html>";
    }

  private string ResolveLogoUrl()
  {
    var configuredLogoUrl = _config["Email:LogoUrl"];
    if (!string.IsNullOrWhiteSpace(configuredLogoUrl))
      return configuredLogoUrl;

    var allowedOrigins = _config["AllowedOrigins"] ?? "http://localhost:3000";
    var firstOrigin = allowedOrigins.Split(',', StringSplitOptions.RemoveEmptyEntries)
      .FirstOrDefault()?.Trim() ?? "http://localhost:3000";

    return firstOrigin.TrimEnd('/') + "/logo%2Bname-bg.png";
  }

    #endregion
}


