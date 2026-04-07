using Microsoft.EntityFrameworkCore;
using Synod.Api.Data;
using Synod.Api.Models.Entities;
using Synod.Api.Models.Requests;
using Synod.Api.Models.Responses;
using Synod.Api.Models;

namespace Synod.Api.Services;

public interface INewsletterService
{
    Task<List<NewsletterDto>> GetAllAsync();
    Task<List<NewsletterDto>> GetByUserAsync(Guid userId);
    Task<NewsletterDetailDto?> GetByIdAsync(Guid id);
    Task<NewsletterDto> CreateAsync(CreateNewsletterRequest request, Guid userId);
    Task<NewsletterDto?> UpdateAsync(Guid id, UpdateNewsletterRequest request);
    Task<bool> DeleteAsync(Guid id, Guid userId);
    Task<string> GeneratePreviewHtmlAsync(Guid id);
    Task<bool> SendTestEmailAsync(Guid id, string email, Guid userId);
    Task<bool> SendNewsletterAsync(Guid id, Guid userId);
    Task<List<NewsletterTemplateDto>> GetTemplatesAsync();
    Task<NewsletterStatsDto> GetStatsAsync(Guid? userId = null);
}

public class NewsletterService : INewsletterService
{
    private readonly SynodDbContext _db;
    private readonly IEmailService _emailService;
    private readonly IActivityService _activityService;

    public NewsletterService(SynodDbContext db, IEmailService emailService, IActivityService activityService)
    {
        _db = db;
        _emailService = emailService;
        _activityService = activityService;
    }

    public async Task<List<NewsletterDto>> GetAllAsync()
    {
        var newsletters = await _db.Newsletters
            .Include(n => n.CreatedBy)
            .OrderByDescending(n => n.CreatedAt)
            .ToListAsync();

        return newsletters.Select(MapToDto).ToList();
    }

    public async Task<List<NewsletterDto>> GetByUserAsync(Guid userId)
    {
        var newsletters = await _db.Newsletters
            .Include(n => n.CreatedBy)
            .Where(n => n.CreatedById == userId)
            .OrderByDescending(n => n.CreatedAt)
            .ToListAsync();

        return newsletters.Select(MapToDto).ToList();
    }

    public async Task<NewsletterDetailDto?> GetByIdAsync(Guid id)
    {
        var newsletter = await _db.Newsletters
            .Include(n => n.CreatedBy)
            .FirstOrDefaultAsync(n => n.Id == id);

        return newsletter == null ? null : MapToDetailDto(newsletter);
    }

    public async Task<NewsletterDto> CreateAsync(CreateNewsletterRequest request, Guid userId)
    {
        var newsletter = new Newsletter
        {
            Id = Guid.NewGuid(),
            Title = request.Title,
            Subject = request.Subject,
            PreviewText = request.PreviewText,
            ContentJson = request.ContentJson,
            Status = NewsletterStatus.Draft,
            CreatedById = userId
        };

        _db.Newsletters.Add(newsletter);
        await _db.SaveChangesAsync();

        await _db.Entry(newsletter).Reference(n => n.CreatedBy).LoadAsync();

        await _activityService.LogAsync(
            AuditAction.NewsletterCreated,
            userId,
            "Newsletter",
            newsletter.Id,
            null,
            new { title = newsletter.Title }
        );

        return MapToDto(newsletter);
    }

    public async Task<NewsletterDto?> UpdateAsync(Guid id, UpdateNewsletterRequest request)
    {
        var newsletter = await _db.Newsletters
            .Include(n => n.CreatedBy)
            .FirstOrDefaultAsync(n => n.Id == id);

        if (newsletter == null) return null;

        // Can only edit drafts
        if (newsletter.Status != NewsletterStatus.Draft)
            return null;

        if (request.Title != null)
            newsletter.Title = request.Title;
        if (request.Subject != null)
            newsletter.Subject = request.Subject;
        if (request.PreviewText != null)
            newsletter.PreviewText = request.PreviewText;
        if (request.ContentJson != null)
            newsletter.ContentJson = request.ContentJson;
        if (request.HtmlContent != null)
            newsletter.HtmlContent = request.HtmlContent;

        newsletter.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return MapToDto(newsletter);
    }

    public async Task<bool> DeleteAsync(Guid id, Guid userId)
    {
        var newsletter = await _db.Newsletters.FirstOrDefaultAsync(n => n.Id == id);
        if (newsletter == null) return false;

        // Can only delete drafts
        if (newsletter.Status != NewsletterStatus.Draft)
            return false;

        var title = newsletter.Title;
        _db.Newsletters.Remove(newsletter);
        await _db.SaveChangesAsync();

        await _activityService.LogAsync(
            AuditAction.NewsletterDeleted,
            userId,
            "Newsletter",
            id,
            new { title },
            null
        );

        return true;
    }

    public async Task<string> GeneratePreviewHtmlAsync(Guid id)
    {
        var newsletter = await _db.Newsletters.FirstOrDefaultAsync(n => n.Id == id);
        if (newsletter == null) return "";

        // If we have cached HTML, return it
        if (!string.IsNullOrEmpty(newsletter.HtmlContent))
            return newsletter.HtmlContent;

        // Generate HTML from ContentJson
        var html = ConvertContentJsonToHtml(newsletter.ContentJson, newsletter.Subject, newsletter.PreviewText);
        return html;
    }

    public async Task<bool> SendTestEmailAsync(Guid id, string email, Guid userId)
    {
        var newsletter = await _db.Newsletters.FirstOrDefaultAsync(n => n.Id == id);
        if (newsletter == null) return false;

        var html = await GeneratePreviewHtmlAsync(id);
        
        await _emailService.SendEmailAsync(
            email,
            "[TEST] " + newsletter.Subject,
            html
        );

        return true;
    }

    public async Task<bool> SendNewsletterAsync(Guid id, Guid userId)
    {
        var newsletter = await _db.Newsletters.FirstOrDefaultAsync(n => n.Id == id);
        if (newsletter == null) return false;

        if (newsletter.Status != NewsletterStatus.Draft)
            return false;

        // Get all subscribed members
        var members = await _db.Members
            .Where(m => m.IsSubscribed)
            .ToListAsync();

        if (members.Count == 0)
            return false;

        // Update status to sending
        newsletter.Status = NewsletterStatus.Sending;
        await _db.SaveChangesAsync();

        // Generate final HTML
        var baseHtml = ConvertContentJsonToHtml(newsletter.ContentJson, newsletter.Subject, newsletter.PreviewText);
        newsletter.HtmlContent = baseHtml;

        var successCount = 0;

        foreach (var member in members)
        {
            try
            {
                // Personalize HTML for this recipient
                var personalizedHtml = PersonalizeHtml(baseHtml, member);
                
                // Add unsubscribe link
                var unsubscribeUrl = GetUnsubscribeUrl(member.UnsubscribeToken);
                personalizedHtml = AddUnsubscribeLink(personalizedHtml, unsubscribeUrl);

                await _emailService.SendEmailAsync(
                    member.Email,
                    newsletter.Subject,
                    personalizedHtml
                );

                // Track recipient
                var recipient = new NewsletterRecipient
                {
                    Id = Guid.NewGuid(),
                    NewsletterId = newsletter.Id,
                    MemberId = member.Id,
                    Status = "Sent"
                };
                _db.NewsletterRecipients.Add(recipient);

                successCount++;
            }
            catch
            {
                // Log error but continue sending to other recipients
            }
        }

        // Update newsletter stats
        newsletter.Status = NewsletterStatus.Sent;
        newsletter.SentAt = DateTime.UtcNow;
        newsletter.RecipientCount = successCount;
        await _db.SaveChangesAsync();

        // Log activity
        await _activityService.LogAsync(
            AuditAction.NewsletterSent,
            userId,
            "Newsletter",
            newsletter.Id,
            null,
            new { recipientCount = successCount, title = newsletter.Title }
        );

        return true;
    }

    public async Task<List<NewsletterTemplateDto>> GetTemplatesAsync()
    {
        var templates = await _db.NewsletterTemplates
            .Where(t => t.IsActive)
            .OrderBy(t => t.SortOrder)
            .ToListAsync();

        return templates.Select(t => new NewsletterTemplateDto
        {
            Id = t.Id,
            Name = t.Name,
            Description = t.Description,
            ThumbnailUrl = t.ThumbnailUrl,
            ContentJson = t.ContentJson,
            SortOrder = t.SortOrder
        }).ToList();
    }

    public async Task<NewsletterStatsDto> GetStatsAsync(Guid? userId = null)
    {
        var query = _db.Newsletters.AsQueryable();
        
        if (userId.HasValue)
            query = query.Where(n => n.CreatedById == userId.Value);

        var newsletters = await query.ToListAsync();

        return new NewsletterStatsDto
        {
            TotalNewsletters = newsletters.Count,
            DraftCount = newsletters.Count(n => n.Status == NewsletterStatus.Draft),
            SentCount = newsletters.Count(n => n.Status == NewsletterStatus.Sent),
            TotalRecipients = newsletters.Sum(n => n.RecipientCount),
            TotalOpens = newsletters.Sum(n => n.OpenCount)
        };
    }

    private NewsletterDto MapToDto(Newsletter newsletter)
    {
        return new NewsletterDto
        {
            Id = newsletter.Id,
            Title = newsletter.Title,
            Subject = newsletter.Subject,
            PreviewText = newsletter.PreviewText,
            Status = newsletter.Status.ToString(),
            RecipientCount = newsletter.RecipientCount,
            OpenCount = newsletter.OpenCount,
            ClickCount = newsletter.ClickCount,
            SentAt = newsletter.SentAt,
            ScheduledAt = newsletter.ScheduledAt,
            CreatedById = newsletter.CreatedById,
            CreatedByName = newsletter.CreatedBy?.Name ?? "",
            CreatedAt = newsletter.CreatedAt,
            UpdatedAt = newsletter.UpdatedAt
        };
    }

    private NewsletterDetailDto MapToDetailDto(Newsletter newsletter)
    {
        return new NewsletterDetailDto
        {
            Id = newsletter.Id,
            Title = newsletter.Title,
            Subject = newsletter.Subject,
            PreviewText = newsletter.PreviewText,
            Status = newsletter.Status.ToString(),
            RecipientCount = newsletter.RecipientCount,
            OpenCount = newsletter.OpenCount,
            ClickCount = newsletter.ClickCount,
            SentAt = newsletter.SentAt,
            ScheduledAt = newsletter.ScheduledAt,
            CreatedById = newsletter.CreatedById,
            CreatedByName = newsletter.CreatedBy?.Name ?? "",
            CreatedAt = newsletter.CreatedAt,
            UpdatedAt = newsletter.UpdatedAt,
            ContentJson = newsletter.ContentJson,
            HtmlContent = newsletter.HtmlContent
        };
    }

    private string ConvertContentJsonToHtml(string? contentJson, string subject, string? previewText)
    {
        // Base email template
        var html = @"
<!DOCTYPE html>
<html>
<head>
    <meta charset=""utf-8"">
    <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"">
    <title>" + subject + @"</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { padding: 30px; text-align: center; background-color: #1e293b; }
        .header h1 { color: #ffffff; margin: 0; font-size: 24px; }
        .content { padding: 30px; }
        .content h1 { font-size: 28px; color: #1e293b; }
        .content h2 { font-size: 22px; color: #1e293b; }
        .content h3 { font-size: 18px; color: #1e293b; }
        .content p { margin: 16px 0; }
        .content a { color: #2563eb; }
        .content img { max-width: 100%; height: auto; }
        .footer { padding: 20px 30px; text-align: center; font-size: 12px; color: #666; background-color: #f9fafb; }
        .footer a { color: #666; }
        .unsubscribe { margin-top: 10px; }
    </style>
</head>
<body>
    " + (string.IsNullOrEmpty(previewText) ? "" : "<!--" + previewText + "-->") + @"
    <div class=""container"">
        <div class=""header"">
            <h1>SYNOD</h1>
        </div>
        <div class=""content"">
            {{CONTENT}}
        </div>
        <div class=""footer"">
            <p>Sent via Synod</p>
            <p class=""unsubscribe"">{{UNSUBSCRIBE}}</p>
        </div>
    </div>
</body>
</html>";

        // Convert TipTap JSON to HTML
        var content = ParseTipTapContent(contentJson);
        html = html.Replace("{{CONTENT}}", content);
        html = html.Replace("{{UNSUBSCRIBE}}", "");

        return html;
    }

    private string ParseTipTapContent(string? contentJson)
    {
        if (string.IsNullOrEmpty(contentJson))
            return "<p>No content</p>";

        try
        {
            using var doc = System.Text.Json.JsonDocument.Parse(contentJson);
            var root = doc.RootElement;

            if (root.TryGetProperty("content", out var content))
            {
                return ParseTipTapNodes(content);
            }

            return "<p>No content</p>";
        }
        catch
        {
            return "<p>Error parsing content</p>";
        }
    }

    private string ParseTipTapNodes(System.Text.Json.JsonElement nodes)
    {
        var html = "";

        foreach (var node in nodes.EnumerateArray())
        {
            var type = node.GetProperty("type").GetString();

            switch (type)
            {
                case "paragraph":
                    var pContent = node.TryGetProperty("content", out var pNodes) 
                        ? ParseTipTapInline(pNodes) 
                        : "";
                    html += "<p>" + pContent + "</p>";
                    break;

                case "heading":
                    var level = node.TryGetProperty("attrs", out var attrs) && attrs.TryGetProperty("level", out var lvl)
                        ? lvl.GetInt32()
                        : 1;
                    var hContent = node.TryGetProperty("content", out var hNodes)
                        ? ParseTipTapInline(hNodes)
                        : "";
                    html += "<h" + level + ">" + hContent + "</h" + level + ">";
                    break;

                case "bulletList":
                    html += "<ul>";
                    if (node.TryGetProperty("content", out var ulItems))
                    {
                        foreach (var item in ulItems.EnumerateArray())
                        {
                            if (item.TryGetProperty("content", out var liContent))
                            {
                                html += "<li>" + ParseTipTapNodes(liContent) + "</li>";
                            }
                        }
                    }
                    html += "</ul>";
                    break;

                case "orderedList":
                    html += "<ol>";
                    if (node.TryGetProperty("content", out var olItems))
                    {
                        foreach (var item in olItems.EnumerateArray())
                        {
                            if (item.TryGetProperty("content", out var liContent))
                            {
                                html += "<li>" + ParseTipTapNodes(liContent) + "</li>";
                            }
                        }
                    }
                    html += "</ol>";
                    break;

                case "blockquote":
                    var bqContent = node.TryGetProperty("content", out var bqNodes)
                        ? ParseTipTapNodes(bqNodes)
                        : "";
                    html += "<blockquote style=\"border-left: 4px solid #e5e7eb; padding-left: 16px; margin: 16px 0; color: #6b7280;\">" + bqContent + "</blockquote>";
                    break;

                case "horizontalRule":
                    html += "<hr style=\"border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;\">";
                    break;

                case "image":
                    if (node.TryGetProperty("attrs", out var imgAttrs))
                    {
                        var src = imgAttrs.TryGetProperty("src", out var srcVal) ? srcVal.GetString() : "";
                        var alt = imgAttrs.TryGetProperty("alt", out var altVal) ? altVal.GetString() : "";
                        html += "<img src=\"" + src + "\" alt=\"" + alt + "\" style=\"max-width: 100%; height: auto;\">";
                    }
                    break;
            }
        }

        return html;
    }

    private string ParseTipTapInline(System.Text.Json.JsonElement nodes)
    {
        var html = "";

        foreach (var node in nodes.EnumerateArray())
        {
            var type = node.GetProperty("type").GetString();

            if (type == "text")
            {
                var text = node.TryGetProperty("text", out var textVal) ? textVal.GetString() ?? "" : "";
                
                // Apply marks (bold, italic, etc.)
                if (node.TryGetProperty("marks", out var marks))
                {
                    foreach (var mark in marks.EnumerateArray())
                    {
                        var markType = mark.GetProperty("type").GetString();
                        switch (markType)
                        {
                            case "bold":
                                text = "<strong>" + text + "</strong>";
                                break;
                            case "italic":
                                text = "<em>" + text + "</em>";
                                break;
                            case "underline":
                                text = "<u>" + text + "</u>";
                                break;
                            case "strike":
                                text = "<s>" + text + "</s>";
                                break;
                            case "link":
                                var href = mark.TryGetProperty("attrs", out var linkAttrs) && linkAttrs.TryGetProperty("href", out var hrefVal)
                                    ? hrefVal.GetString()
                                    : "#";
                                text = "<a href=\"" + href + "\">" + text + "</a>";
                                break;
                        }
                    }
                }

                html += text;
            }
            else if (type == "hardBreak")
            {
                html += "<br>";
            }
        }

        return html;
    }

    private string PersonalizeHtml(string html, Member member)
    {
        // Replace personalization tokens
        html = html.Replace("{{first_name}}", member.Name?.Split(' ').FirstOrDefault() ?? "there");
        html = html.Replace("{{name}}", member.Name ?? "there");
        html = html.Replace("{{email}}", member.Email);
        return html;
    }

    private string GetUnsubscribeUrl(string token)
    {
        // This should come from configuration
        return "http://localhost:3000/unsubscribe/" + token;
    }

    private string AddUnsubscribeLink(string html, string unsubscribeUrl)
    {
        var link = "<a href=\"" + unsubscribeUrl + "\">Unsubscribe</a>";
        return html.Replace("{{UNSUBSCRIBE}}", link);
    }
}



