using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Synod.Api.Models.Responses;
using Synod.Api.Services;

namespace Synod.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ActivityController : ControllerBase
{
    private readonly IActivityService _activityService;

    public ActivityController(IActivityService activityService)
    {
        _activityService = activityService;
    }

    [HttpGet]
    public async Task<IActionResult> GetActivities(
        [FromQuery] int page = 1, 
        [FromQuery] int pageSize = 20,
        [FromQuery] string? action = null,
        [FromQuery] Guid? userId = null)
    {
        var activities = await _activityService.GetActivitiesAsync(page, pageSize, action, userId);
        return Ok(ApiResponse<ActivityListDto>.Ok(activities));
    }

    [HttpGet("my")]
    public async Task<IActionResult> GetMyActivities([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var currentUserId = GetCurrentUserId();
        if (currentUserId == null) return Unauthorized();

        var activities = await _activityService.GetUserActivitiesAsync(currentUserId.Value, page, pageSize);
        return Ok(ApiResponse<ActivityListDto>.Ok(activities));
    }

    private Guid? GetCurrentUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(claim, out var id) ? id : null;
    }
}
