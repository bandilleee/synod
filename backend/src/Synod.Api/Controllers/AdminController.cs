using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Synod.Api.Models.Responses;
using Synod.Api.Services;

namespace Synod.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "SuperAdmin")]
public class AdminController : ControllerBase
{
    private readonly IAdminService _adminService;

    public AdminController(IAdminService adminService)
    {
        _adminService = adminService;
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var stats = await _adminService.GetStatsAsync();
        return Ok(ApiResponse<AdminStatsResponse>.Ok(stats));
    }

    [HttpGet("leaders")]
    public async Task<IActionResult> GetAllLeaders()
    {
        var leaders = await _adminService.GetAllLeadersAsync();
        return Ok(ApiResponse<List<UserDto>>.Ok(leaders));
    }

    [HttpPost("leaders/{id}/suspend")]
    public async Task<IActionResult> SuspendLeader(Guid id)
    {
        var result = await _adminService.SuspendUserAsync(id);
        if (!result)
            return BadRequest(ApiResponse<object>.Fail("Unable to suspend user"));

        return Ok(ApiResponse<object>.Ok(new { }, "User suspended"));
    }

    [HttpPost("leaders/{id}/reactivate")]
    public async Task<IActionResult> ReactivateLeader(Guid id)
    {
        var result = await _adminService.ReactivateUserAsync(id);
        if (!result)
            return BadRequest(ApiResponse<object>.Fail("Unable to reactivate user"));

        return Ok(ApiResponse<object>.Ok(new { }, "User reactivated"));
    }

    [HttpDelete("leaders/{id}")]
    public async Task<IActionResult> DeleteLeader(Guid id)
    {
        var result = await _adminService.DeleteUserAsync(id);
        if (!result)
            return BadRequest(ApiResponse<object>.Fail("Unable to delete user"));

        return Ok(ApiResponse<object>.Ok(new { }, "User deleted"));
    }
}
