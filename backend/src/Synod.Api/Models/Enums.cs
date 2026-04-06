namespace Synod.Api.Models;

/// <summary>
/// Defines user roles in the system.
/// </summary>
public enum UserRole
{
    /// <summary>Platform owner with full access to admin panel.</summary>
    SuperAdmin = 0,
    
    /// <summary>Organization representative who can create content.</summary>
    Leader = 1
}

/// <summary>
/// Defines possible states for a user account.
/// </summary>
public enum UserStatus
{
    /// <summary>Invited but hasn't accepted yet.</summary>
    Pending = 0,
    
    /// <summary>Normal active user.</summary>
    Active = 1,
    
    /// <summary>Temporarily disabled by admin.</summary>
    Suspended = 2,
    
    /// <summary>Permanently disabled.</summary>
    Deactivated = 3
}

/// <summary>
/// Defines types of organizations that can exist.
/// </summary>
public enum OrganizationType
{
    Chapter = 0,
    Club = 1,
    Society = 2,
    Other = 3
}

/// <summary>
/// Defines possible states for a newsletter.
/// </summary>
public enum NewsletterStatus
{
    /// <summary>Being edited, not sent.</summary>
    Draft = 0,
    
    /// <summary>Scheduled for future sending.</summary>
    Scheduled = 1,
    
    /// <summary>Currently being sent to recipients.</summary>
    Sending = 2,
    
    /// <summary>Successfully sent to all recipients.</summary>
    Sent = 3,
    
    /// <summary>Failed to send.</summary>
    Failed = 4
}

/// <summary>
/// Defines possible states for a form.
/// </summary>
public enum FormStatus
{
    /// <summary>Being built, not public.</summary>
    Draft = 0,
    
    /// <summary>Published and accepting submissions.</summary>
    Active = 1,
    
    /// <summary>No longer accepting submissions.</summary>
    Closed = 2,
    
    /// <summary>Hidden from lists but data preserved.</summary>
    Archived = 3
}

/// <summary>
/// Defines possible states for an event.
/// </summary>
public enum EventStatus
{
    /// <summary>Being planned, not submitted for approval.</summary>
    Draft = 0,
    
    /// <summary>Submitted and waiting for all leaders to approve.</summary>
    PendingApproval = 1,
    
    /// <summary>All leaders have approved.</summary>
    Approved = 2,
    
    /// <summary>At least one leader rejected.</summary>
    Rejected = 3,
    
    /// <summary>Cancelled after approval.</summary>
    Cancelled = 4,
    
    /// <summary>Event has occurred.</summary>
    Completed = 5
}

/// <summary>
/// Defines possible states for an individual approval vote.
/// </summary>
public enum ApprovalStatus
{
    /// <summary>Leader hasn't responded yet.</summary>
    Pending = 0,
    
    /// <summary>Leader approved the event.</summary>
    Approved = 1,
    
    /// <summary>Leader rejected the event.</summary>
    Rejected = 2
}

/// <summary>
/// Defines possible states for a leader invitation.
/// </summary>
public enum InvitationStatus
{
    /// <summary>Sent but not yet accepted.</summary>
    Pending = 0,
    
    /// <summary>Leader accepted and created account.</summary>
    Accepted = 1,
    
    /// <summary>Invitation expired (7 days).</summary>
    Expired = 2,
    
    /// <summary>Admin cancelled the invitation.</summary>
    Revoked = 3
}

/// <summary>
/// Defines all actions that get logged in the audit trail.
/// </summary>
public enum AuditAction
{
    // === Authentication ===
    UserLoggedIn = 100,
    UserLoggedOut = 101,
    UserInvited = 102,
    UserAcceptedInvitation = 103,
    PasswordReset = 104,
    
    // === Organizations ===
    OrganizationCreated = 200,
    OrganizationUpdated = 201,
    OrganizationDeleted = 202,
    
    // === Users ===
    UserUpdated = 300,
    UserSuspended = 301,
    UserReactivated = 302,
    UserDeleted = 303,
    
    // === Newsletters ===
    NewsletterCreated = 400,
    NewsletterUpdated = 401,
    NewsletterSent = 402,
    NewsletterDeleted = 403,
    
    // === Forms ===
    FormCreated = 500,
    FormUpdated = 501,
    FormPublished = 502,
    FormClosed = 503,
    FormDeleted = 504,
    FormSubmissionReceived = 505,
    
    // === Events ===
    EventCreated = 600,
    EventUpdated = 601,
    EventApproved = 602,
    EventRejected = 603,
    EventCancelled = 604,
    EventCompleted = 605,
    
    // === Members ===
    MemberCreated = 700,
    MemberUpdated = 701,
    MemberUnsubscribed = 702,
    MemberDeleted = 703
}
