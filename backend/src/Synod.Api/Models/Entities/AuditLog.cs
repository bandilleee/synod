namespace Synod.Api.Models.Entities;

public class AuditLog : BaseEntity
{
    public AuditAction Action { get; set; }
    public string EntityType { get; set; } = string.Empty;
    public Guid? EntityId { get; set; }
    public string? OldValues { get; set; }
    public string? NewValues { get; set; }
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    
    // Foreign Keys
    public Guid? UserId { get; set; }
    
    // Navigation
    public virtual User? User { get; set; }
}
