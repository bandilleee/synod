namespace Synod.Api.Models.Responses;

public class ActivityDto
{
    public Guid Id { get; set; }
    public string Action { get; set; } = string.Empty;
    public string ActionDisplay { get; set; } = string.Empty;
    public string EntityType { get; set; } = string.Empty;
    public Guid? EntityId { get; set; }
    public string? EntityName { get; set; }
    public Guid? UserId { get; set; }
    public string? UserName { get; set; }
    public string? Details { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class ActivityListDto
{
    public List<ActivityDto> Activities { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages { get; set; }
}
