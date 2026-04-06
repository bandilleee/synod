namespace Synod.Api.Models.Responses;

public class FormDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Slug { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public int SubmissionCount { get; set; }
    public string? SuccessMessage { get; set; }
    public string? RedirectUrl { get; set; }
    public Guid CreatedById { get; set; }
    public string CreatedByName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class FormDetailDto : FormDto
{
    public string FieldsJson { get; set; } = "[]";
    public string? SettingsJson { get; set; }
}

public class FormSubmissionDto
{
    public Guid Id { get; set; }
    public string DataJson { get; set; } = "{}";
    public string? IpAddress { get; set; }
    public DateTime CreatedAt { get; set; }
    public Guid? MemberId { get; set; }
    public string? MemberEmail { get; set; }
}

public class FormSubmissionListDto
{
    public List<FormSubmissionDto> Submissions { get; set; } = new();
    public int TotalCount { get; set; }
}
