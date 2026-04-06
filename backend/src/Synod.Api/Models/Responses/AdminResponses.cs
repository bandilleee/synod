namespace Synod.Api.Models.Responses;

public class AdminStatsResponse
{
    public int TotalLeaders { get; set; }
    public int TotalOrganizations { get; set; }
    public int TotalMembers { get; set; }
    public int TotalEvents { get; set; }
    public int PendingInvitations { get; set; }
    public int PendingEventApprovals { get; set; }
}
