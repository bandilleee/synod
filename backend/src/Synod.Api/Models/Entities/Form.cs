namespace Synod.Api.Models.Entities;

public class Form : BaseEntity
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Slug { get; set; } = string.Empty;
    public string FieldsJson { get; set; } = "[]";
    public string? SettingsJson { get; set; }
    public FormStatus Status { get; set; } = FormStatus.Draft;
    public int SubmissionCount { get; set; }
    public string? SuccessMessage { get; set; }
    public string? RedirectUrl { get; set; }
    
    // Foreign Keys
    public Guid CreatedById { get; set; }
    
    // Navigation
    public virtual User CreatedBy { get; set; } = null!;
    public virtual ICollection<FormSubmission> Submissions { get; set; } = new List<FormSubmission>();
    public virtual ICollection<Member> SourcedMembers { get; set; } = new List<Member>();
}
