namespace Synod.Api.Models.Entities;

public class Event : BaseEntity
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime Date { get; set; }
    public DateTime? EndDate { get; set; }
    public string? Location { get; set; }
    public EventStatus Status { get; set; } = EventStatus.Draft;
    public int RequiredApprovals { get; set; }
    public int CurrentApprovals { get; set; }
    
    // Foreign Keys
    public Guid CreatedById { get; set; }
    
    // Navigation
    public virtual User CreatedBy { get; set; } = null!;
    public virtual ICollection<EventApproval> Approvals { get; set; } = new List<EventApproval>();
}
