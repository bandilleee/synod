using System.ComponentModel.DataAnnotations;

namespace Synod.Api.Models.Requests;

public class CreateFormRequest
{
    [Required]
    [MaxLength(300)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Description { get; set; }

    [Required]
    [MaxLength(200)]
    [RegularExpression(@"^[a-z0-9-]+$", ErrorMessage = "Slug can only contain lowercase letters, numbers, and hyphens")]
    public string Slug { get; set; } = string.Empty;

    public string FieldsJson { get; set; } = "[]";
    public string? SettingsJson { get; set; }
    public string? SuccessMessage { get; set; }
    public string? RedirectUrl { get; set; }
}

public class UpdateFormRequest
{
    [Required]
    [MaxLength(300)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Description { get; set; }

    public string FieldsJson { get; set; } = "[]";
    public string? SettingsJson { get; set; }
    public string? SuccessMessage { get; set; }
    public string? RedirectUrl { get; set; }
}

public class SubmitFormRequest
{
    [Required]
    public string DataJson { get; set; } = "{}";
}
