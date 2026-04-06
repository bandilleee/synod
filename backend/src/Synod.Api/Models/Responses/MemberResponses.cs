namespace Synod.Api.Models.Responses;

public class MemberDto
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string? Name { get; set; }
    public string? Phone { get; set; }
    public string? MetadataJson { get; set; }
    public bool IsSubscribed { get; set; }
    public DateTime? UnsubscribedAt { get; set; }
    public string? SourceFormName { get; set; }
    public int SubmissionCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class MemberListDto
{
    public List<MemberDto> Members { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages { get; set; }
}

public class MemberStatsDto
{
    public int TotalMembers { get; set; }
    public int SubscribedMembers { get; set; }
    public int UnsubscribedMembers { get; set; }
    public int NewThisMonth { get; set; }
}
