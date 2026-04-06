namespace Synod.Api.Models.Entities;

/// <summary>
/// Represents a pending invitation for a leader to join an organization.
/// </summary>
public class Invitation : BaseEntity
{
    /// <summary>
    /// Email address the invitation was sent to.
    /// </summary>
    public string Email { get; set; } = string.Empty;
    
    /// <summary>
    /// Unique token for accepting the invitation (sent in email link).
    /// </summary>
    public string Token { get; set; } = string.Empty;
    
    /// <summary>
    /// Role the invited user will have.
    /// </summary>
    public UserRole Role { get; set; } = UserRole.Leader;
    
    /// <summary>
    /// Current status of the invitation.
    /// </summary>
    public InvitationStatus Status { get; set; } = InvitationStatus.Pending;
    
    /// <summary>
    /// When the invitation expires.
    /// </summary>
    public DateTime ExpiresAt { get; set; }
    
    /// <summary>
    /// When the invitation was accepted (if accepted).
    /// </summary>
    public DateTime? AcceptedAt { get; set; }
    
    // === Foreign Keys ===
    
    /// <summary>
    /// Organization the user is being invited to.
    /// </summary>
    public Guid OrganizationId { get; set; }
    
    /// <summary>
    /// User who sent the invitation.
    /// </summary>
    public Guid InvitedById { get; set; }
    
    // === Navigation Properties ===
    
    public virtual Organization Organization { get; set; } = null!;
    public virtual User InvitedBy { get; set; } = null!;
}
