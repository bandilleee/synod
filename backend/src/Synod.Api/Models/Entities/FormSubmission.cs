namespace Synod.Api.Models.Entities;

public class FormSubmission : BaseEntity
{
    public string DataJson { get; set; } = "{}";
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    
    // Foreign Keys
    public Guid FormId { get; set; }
    public Guid? MemberId { get; set; }
    
    // Navigation
    public virtual Form Form { get; set; } = null!;
    public virtual Member? Member { get; set; }
}
