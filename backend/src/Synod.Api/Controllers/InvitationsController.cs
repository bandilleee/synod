using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Synod.Api.Models.Requests;
using Synod.Api.Models.Responses;
using Synod.Api.Services;

namespace Synod.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "SuperAdmin")]
public class InvitationsController : ControllerBase
{
    private readonly IInvitationService _invitationService;

    public InvitationsController(IInvitationService invitationService)
    {
        _invitationService = invitationService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var invitations = await _invitationService.GetAllAsync();
        return Ok(ApiResponse<List<InvitationDto>>.Ok(invitations));
    }

    [HttpGet("organization/{organizationId}")]
    public async Task<IActionResult> GetByOrganization(Guid organizationId)
    {
        var invitations = await _invitationService.GetByOrganizationAsync(organizationId);
        return Ok(ApiResponse<List<InvitationDto>>.Ok(invitations));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] InviteLeaderRequest request)
    {
        var userId = GetCurrentUserId();
        if (userId == null)
            return Unauthorized();

        var invitation = await _invitationService.CreateAsync(request, userId.Value);
        if (invitation == null)
            return BadRequest(ApiResponse<object>.Fail("Unable to create invitation. Email may already exist or organization not found."));

        return Ok(ApiResponse<InvitationDto>.Ok(invitation, "Invitation sent"));
    }

    [HttpPost("{id}/revoke")]
    public async Task<IActionResult> Revoke(Guid id)
    {
        var result = await _invitationService.RevokeAsync(id);
        if (!result)
            return BadRequest(ApiResponse<object>.Fail("Unable to revoke invitation"));

        return Ok(ApiResponse<object>.Ok(new { }, "Invitation revoked"));
    }

    [HttpPost("{id}/resend")]
    public async Task<IActionResult> Resend(Guid id)
    {
        var result = await _invitationService.ResendAsync(id);
        if (!result)
            return BadRequest(ApiResponse<object>.Fail("Unable to resend invitation"));

        return Ok(ApiResponse<object>.Ok(new { }, "Invitation resent"));
    }

    private Guid? GetCurrentUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(claim, out var id) ? id : null;
    }
}
