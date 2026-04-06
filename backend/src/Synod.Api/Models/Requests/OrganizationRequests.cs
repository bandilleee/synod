using System.ComponentModel.DataAnnotations;

namespace Synod.Api.Models.Requests;

public class CreateOrganizationRequest
{
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    [RegularExpression(@"^[a-z0-9-]+$", ErrorMessage = "Slug can only contain lowercase letters, numbers, and hyphens")]
    public string Slug { get; set; } = string.Empty;

    [Required]
    public string Type { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Description { get; set; }

    public string? LogoUrl { get; set; }
}

public class UpdateOrganizationRequest
{
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Description { get; set; }

    public string? LogoUrl { get; set; }

    public bool IsActive { get; set; }
}
