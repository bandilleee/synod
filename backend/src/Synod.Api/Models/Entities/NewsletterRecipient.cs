namespace Synod.Api.Models.Entities;

/// <summary>
/// Tracks delivery status for each newsletter recipient.
/// </summary>
public class NewsletterRecipient : BaseEntity
{
    /// <summary>
    /// Delivery status (Pending, Sent, Opened, Clicked, Bounced, etc.).
    /// </summary>
    public string Status { get; set; } = "Pending";
    
    /// <summary>
    /// When the recipient opened the email.
    /// </summary>
    public DateTime? OpenedAt { get; set; }
    
    /// <summary>
    /// When the recipient clicked a link.
    /// </summary>
    public DateTime? ClickedAt { get; set; }
    
    // === Foreign Keys ===
    
    public Guid NewsletterId { get; set; }
    public Guid MemberId { get; set; }
    
    // === Navigation Properties ===
    
    public virtual Newsletter Newsletter { get; set; } = null!;
    public virtual Member Member { get; set; } = null!;
}
