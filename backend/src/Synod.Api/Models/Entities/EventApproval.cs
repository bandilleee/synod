namespace Synod.Api.Models.Entities;

public class EventApproval : BaseEntity
{
    public ApprovalStatus Status { get; set; } = ApprovalStatus.Pending;
    public string? Comment { get; set; }
    public DateTime? RespondedAt { get; set; }
    
    // Foreign Keys
    public Guid EventId { get; set; }
    public Guid UserId { get; set; }
    
    // Navigation
    public virtual Event Event { get; set; } = null!;
    public virtual User User { get; set; } = null!;
}
