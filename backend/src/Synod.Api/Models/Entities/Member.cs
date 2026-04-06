namespace Synod.Api.Models.Entities;

/// <summary>
/// Represents a member who submits forms and receives newsletters.
/// Members don't have login accounts - they're just contacts.
/// </summary>
public class Member : BaseEntity
{
    /// <summary>
    /// Member's email address (unique identifier).
    /// </summary>
    public string Email { get; set; } = string.Empty;
    
    /// <summary>
    /// Member's name.
    /// </summary>
    public string? Name { get; set; }
    
    /// <summary>
    /// Member's phone number.
    /// </summary>
    public string? Phone { get; set; }
    
    /// <summary>
    /// Additional metadata stored as JSON (from form submissions).
    /// </summary>
    public string? MetadataJson { get; set; }
    
    /// <summary>
    /// Whether the member is subscribed to newsletters.
    /// </summary>
    public bool IsSubscribed { get; set; } = true;
    
    /// <summary>
    /// When the member unsubscribed (if unsubscribed).
    /// </summary>
    public DateTime? UnsubscribedAt { get; set; }
    
    /// <summary>
    /// Unique token for unsubscribe links.
    /// </summary>
    public string UnsubscribeToken { get; set; } = string.Empty;
    
    // === Foreign Keys ===
    
    /// <summary>
    /// The form that originally created this member record.
    /// </summary>
    public Guid? SourceFormId { get; set; }
    
    // === Navigation Properties ===
    
    public virtual Form? SourceForm { get; set; }
    public virtual ICollection<FormSubmission> FormSubmissions { get; set; } = new List<FormSubmission>();
    public virtual ICollection<NewsletterRecipient> NewsletterRecipients { get; set; } = new List<NewsletterRecipient>();
}
