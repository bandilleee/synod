namespace Synod.Api.Models.Responses;

public class OrganizationDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? LogoUrl { get; set; }
    public bool IsActive { get; set; }
    public int LeaderCount { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class OrganizationDetailDto : OrganizationDto
{
    public List<UserDto> Leaders { get; set; } = new();
}
