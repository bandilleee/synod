using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Synod.Api.Models.Requests;
using Synod.Api.Models.Responses;
using Synod.Api.Services;

namespace Synod.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "SuperAdmin")]
public class OrganizationsController : ControllerBase
{
    private readonly IOrganizationService _organizationService;

    public OrganizationsController(IOrganizationService organizationService)
    {
        _organizationService = organizationService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var organizations = await _organizationService.GetAllAsync();
        return Ok(ApiResponse<List<OrganizationDto>>.Ok(organizations));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var organization = await _organizationService.GetByIdAsync(id);
        if (organization == null)
            return NotFound(ApiResponse<object>.Fail("Organization not found"));

        return Ok(ApiResponse<OrganizationDetailDto>.Ok(organization));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateOrganizationRequest request)
    {
        if (await _organizationService.SlugExistsAsync(request.Slug))
            return BadRequest(ApiResponse<object>.Fail("Slug already exists"));

        var organization = await _organizationService.CreateAsync(request);
        if (organization == null)
            return BadRequest(ApiResponse<object>.Fail("Invalid organization type"));

        return Ok(ApiResponse<OrganizationDto>.Ok(organization, "Organization created"));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateOrganizationRequest request)
    {
        var organization = await _organizationService.UpdateAsync(id, request);
        if (organization == null)
            return NotFound(ApiResponse<object>.Fail("Organization not found"));

        return Ok(ApiResponse<OrganizationDto>.Ok(organization, "Organization updated"));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var result = await _organizationService.DeleteAsync(id);
        if (!result)
            return NotFound(ApiResponse<object>.Fail("Organization not found"));

        return Ok(ApiResponse<object>.Ok(new { }, "Organization deleted"));
    }

    [HttpGet("check-slug/{slug}")]
    public async Task<IActionResult> CheckSlug(string slug)
    {
        var exists = await _organizationService.SlugExistsAsync(slug);
        return Ok(ApiResponse<object>.Ok(new { exists }));
    }
}
