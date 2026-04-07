using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Synod.Api.Models.Requests;
using Synod.Api.Models.Responses;
using Synod.Api.Services;

namespace Synod.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class EventsController : ControllerBase
{
    private readonly IEventService _eventService;

    public EventsController(IEventService eventService)
    {
        _eventService = eventService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var userId = GetCurrentUserId();
        var role = GetCurrentUserRole();

        var events = role == "SuperAdmin"
            ? await _eventService.GetAllAsync()
            : await _eventService.GetByUserAsync(userId!.Value);

        return Ok(ApiResponse<List<EventDto>>.Ok(events));
    }

    [HttpGet("pending")]
    public async Task<IActionResult> GetPendingApprovals()
    {
        var userId = GetCurrentUserId();
        if (userId == null) return Unauthorized();

        var events = await _eventService.GetPendingApprovalsAsync(userId.Value);
        return Ok(ApiResponse<List<EventDto>>.Ok(events));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var evt = await _eventService.GetByIdAsync(id);
        if (evt == null)
            return NotFound(ApiResponse<object>.Fail("Event not found"));

        return Ok(ApiResponse<EventDetailDto>.Ok(evt));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateEventRequest request)
    {
        var userId = GetCurrentUserId();
        if (userId == null) return Unauthorized();

        var evt = await _eventService.CreateAsync(request, userId.Value);
        return Ok(ApiResponse<EventDto>.Ok(evt, "Event created"));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateEventRequest request)
    {
        var userId = GetCurrentUserId();
        if (userId == null) return Unauthorized();

        var evt = await _eventService.UpdateAsync(id, request, userId.Value);
        if (evt == null)
            return NotFound(ApiResponse<object>.Fail("Event not found or cannot be updated"));

        return Ok(ApiResponse<EventDto>.Ok(evt, "Event updated"));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var userId = GetCurrentUserId();
        if (userId == null) return Unauthorized();

        var result = await _eventService.DeleteAsync(id, userId.Value);
        if (!result)
            return NotFound(ApiResponse<object>.Fail("Event not found or cannot be deleted"));

        return Ok(ApiResponse<object>.Ok(new { }, "Event deleted"));
    }

    [HttpPost("{id}/approve")]
    public async Task<IActionResult> Approve(Guid id, [FromBody] EventApprovalRequest? request)
    {
        var userId = GetCurrentUserId();
        if (userId == null) return Unauthorized();

        var result = await _eventService.ApproveAsync(id, userId.Value, request?.Comment);
        if (!result)
            return BadRequest(ApiResponse<object>.Fail("Cannot approve this event"));

        return Ok(ApiResponse<object>.Ok(new { }, "Event approved"));
    }

    [HttpPost("{id}/reject")]
    public async Task<IActionResult> Reject(Guid id, [FromBody] EventApprovalRequest? request)
    {
        var userId = GetCurrentUserId();
        if (userId == null) return Unauthorized();

        var result = await _eventService.RejectAsync(id, userId.Value, request?.Comment);
        if (!result)
            return BadRequest(ApiResponse<object>.Fail("Cannot reject this event"));

        return Ok(ApiResponse<object>.Ok(new { }, "Event rejected"));
    }

    [HttpPost("{id}/cancel")]
    public async Task<IActionResult> Cancel(Guid id)
    {
        var userId = GetCurrentUserId();
        if (userId == null) return Unauthorized();

        var result = await _eventService.CancelAsync(id, userId.Value);
        if (!result)
            return BadRequest(ApiResponse<object>.Fail("Cannot cancel this event"));

        return Ok(ApiResponse<object>.Ok(new { }, "Event cancelled"));
    }

    private Guid? GetCurrentUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(claim, out var id) ? id : null;
    }

    private string? GetCurrentUserRole()
    {
        return User.FindFirst(ClaimTypes.Role)?.Value;
    }
}
