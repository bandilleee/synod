namespace Synod.Api.Models.Responses;

public class NewsletterDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string? PreviewText { get; set; }
    public string Status { get; set; } = string.Empty;
    public int RecipientCount { get; set; }
    public int OpenCount { get; set; }
    public int ClickCount { get; set; }
    public DateTime? SentAt { get; set; }
    public DateTime? ScheduledAt { get; set; }
    public Guid CreatedById { get; set; }
    public string CreatedByName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class NewsletterDetailDto : NewsletterDto
{
    public string? ContentJson { get; set; }
    public string? HtmlContent { get; set; }
}

public class NewsletterTemplateDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? ThumbnailUrl { get; set; }
    public string ContentJson { get; set; } = string.Empty;
    public int SortOrder { get; set; }
}

public class NewsletterStatsDto
{
    public int TotalNewsletters { get; set; }
    public int DraftCount { get; set; }
    public int SentCount { get; set; }
    public int TotalRecipients { get; set; }
    public int TotalOpens { get; set; }
}
