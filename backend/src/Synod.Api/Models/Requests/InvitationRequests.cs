using System.ComponentModel.DataAnnotations;

namespace Synod.Api.Models.Requests;

public class InviteLeaderRequest
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    public Guid OrganizationId { get; set; }
}
