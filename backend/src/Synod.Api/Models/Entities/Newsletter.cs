namespace Synod.Api.Models.Entities;

/// <summary>
/// Represents an email newsletter campaign.
/// </summary>
public class Newsletter : BaseEntity
{
    /// <summary>
    /// Internal title (not shown to recipients).
    /// </summary>
    public string Title { get; set; } = string.Empty;
    
    /// <summary>
    /// Email subject line.
    /// </summary>
    public string Subject { get; set; } = string.Empty;
    
    /// <summary>
    /// Preview text shown in email clients.
    /// </summary>
    public string? PreviewText { get; set; }
    
    /// <summary>
    /// Newsletter content as JSON (TipTap editor format).
    /// </summary>
    public string? ContentJson { get; set; }
    
    /// <summary>
    /// Rendered HTML content for sending.
    /// </summary>
    public string? HtmlContent { get; set; }
    
    /// <summary>
    /// Current status of the newsletter.
    /// </summary>
    public NewsletterStatus Status { get; set; } = NewsletterStatus.Draft;
    
    /// <summary>
    /// When the newsletter was sent.
    /// </summary>
    public DateTime? SentAt { get; set; }
    
    /// <summary>
    /// Scheduled send time (if scheduled).
    /// </summary>
    public DateTime? ScheduledAt { get; set; }
    
    /// <summary>
    /// Total number of recipients.
    /// </summary>
    public int RecipientCount { get; set; }
    
    /// <summary>
    /// Number of recipients who opened the email.
    /// </summary>
    public int OpenCount { get; set; }
    
    /// <summary>
    /// Number of recipients who clicked a link.
    /// </summary>
    public int ClickCount { get; set; }
    
    // === Foreign Keys ===
    
    /// <summary>
    /// User who created this newsletter.
    /// </summary>
    public Guid CreatedById { get; set; }
    
    // === Navigation Properties ===
    
    public virtual User CreatedBy { get; set; } = null!;
    public virtual ICollection<NewsletterRecipient> Recipients { get; set; } = new List<NewsletterRecipient>();
}
