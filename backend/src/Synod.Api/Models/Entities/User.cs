namespace Synod.Api.Models.Entities;

/// <summary>
/// Represents a super admin or leader in the system.
/// </summary>
public class User : BaseEntity
{
    /// <summary>
    /// User's email address. Used for login.
    /// </summary>
    public string Email { get; set; } = string.Empty;
    
    /// <summary>
    /// BCrypt hashed password.
    /// </summary>
    public string PasswordHash { get; set; } = string.Empty;
    
    /// <summary>
    /// User's display name.
    /// </summary>
    public string Name { get; set; } = string.Empty;
    
    /// <summary>
    /// User's role (SuperAdmin or Leader).
    /// </summary>
    public UserRole Role { get; set; }
    
    /// <summary>
    /// Account status.
    /// </summary>
    public UserStatus Status { get; set; } = UserStatus.Pending;
    
    /// <summary>
    /// Optional avatar image URL.
    /// </summary>
    public string? AvatarUrl { get; set; }
    
    /// <summary>
    /// When the user last logged in.
    /// </summary>
    public DateTime? LastLoginAt { get; set; }
    
    /// <summary>
    /// Token for password reset (if requested).
    /// </summary>
    public string? PasswordResetToken { get; set; }
    
    /// <summary>
    /// When the password reset token expires.
    /// </summary>
    public DateTime? PasswordResetTokenExpiresAt { get; set; }
    
    /// <summary>
    /// Current refresh token for JWT authentication.
    /// </summary>
    public string? RefreshToken { get; set; }
    
    /// <summary>
    /// When the refresh token expires.
    /// </summary>
    public DateTime? RefreshTokenExpiresAt { get; set; }
    
    // === Foreign Keys ===
    
    /// <summary>
    /// Organization this user belongs to (null for SuperAdmin).
    /// </summary>
    public Guid? OrganizationId { get; set; }
    
    // === Navigation Properties ===
    
    /// <summary>
    /// The organization this user belongs to.
    /// </summary>
    public virtual Organization? Organization { get; set; }
    
    /// <summary>
    /// Newsletters created by this user.
    /// </summary>
    public virtual ICollection<Newsletter> Newsletters { get; set; } = new List<Newsletter>();
    
    /// <summary>
    /// Forms created by this user.
    /// </summary>
    public virtual ICollection<Form> Forms { get; set; } = new List<Form>();
    
    /// <summary>
    /// Events created by this user.
    /// </summary>
    public virtual ICollection<Event> Events { get; set; } = new List<Event>();
    
    /// <summary>
    /// Event approvals made by this user.
    /// </summary>
    public virtual ICollection<EventApproval> EventApprovals { get; set; } = new List<EventApproval>();
    
    /// <summary>
    /// Invitations sent by this user.
    /// </summary>
    public virtual ICollection<Invitation> SentInvitations { get; set; } = new List<Invitation>();
    
    /// <summary>
    /// Audit logs for this user's actions.
    /// </summary>
    public virtual ICollection<AuditLog> AuditLogs { get; set; } = new List<AuditLog>();
}
