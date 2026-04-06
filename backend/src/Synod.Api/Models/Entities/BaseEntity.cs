namespace Synod.Api.Models.Entities;

/// <summary>
/// Base class for all entities. Provides common fields.
/// </summary>
public abstract class BaseEntity
{
    /// <summary>
    /// Primary key. Auto-generated GUID.
    /// </summary>
    public Guid Id { get; set; }
    
    /// <summary>
    /// When the record was created. Set automatically.
    /// </summary>
    public DateTime CreatedAt { get; set; }
    
    /// <summary>
    /// When the record was last updated. Set automatically.
    /// </summary>
    public DateTime UpdatedAt { get; set; }
}
