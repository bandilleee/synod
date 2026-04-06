namespace Synod.Api.Models.Entities;

/// <summary>
/// Represents a chapter, club, society, or other organization.
/// </summary>
public class Organization : BaseEntity
{
    /// <summary>
    /// Display name of the organization.
    /// </summary>
    public string Name { get; set; } = string.Empty;
    
    /// <summary>
    /// URL-friendly identifier (e.g., "tech-club").
    /// </summary>
    public string Slug { get; set; } = string.Empty;
    
    /// <summary>
    /// Type of organization.
    /// </summary>
    public OrganizationType Type { get; set; }
    
    /// <summary>
    /// Optional description of the organization.
    /// </summary>
    public string? Description { get; set; }
    
    /// <summary>
    /// Optional logo URL.
    /// </summary>
    public string? LogoUrl { get; set; }
    
    /// <summary>
    /// Whether the organization is active.
    /// </summary>
    public bool IsActive { get; set; } = true;
    
    // === Navigation Properties ===
    
    /// <summary>
    /// Leaders belonging to this organization.
    /// </summary>
    public virtual ICollection<User> Users { get; set; } = new List<User>();
    
    /// <summary>
    /// Invitations sent for this organization.
    /// </summary>
    public virtual ICollection<Invitation> Invitations { get; set; } = new List<Invitation>();
}
