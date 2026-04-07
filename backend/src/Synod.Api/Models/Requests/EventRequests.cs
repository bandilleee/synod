namespace Synod.Api.Models.Requests;

public class CreateEventRequest
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime Date { get; set; }
    public DateTime? EndDate { get; set; }
    public string? Location { get; set; }
}

public class UpdateEventRequest
{
    public string? Title { get; set; }
    public string? Description { get; set; }
    public DateTime? Date { get; set; }
    public DateTime? EndDate { get; set; }
    public string? Location { get; set; }
}

public class EventApprovalRequest
{
    public string? Comment { get; set; }
}
