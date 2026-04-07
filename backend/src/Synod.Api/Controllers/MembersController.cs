using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Synod.Api.Models.Responses;
using Synod.Api.Services;

namespace Synod.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MembersController : ControllerBase
{
    private readonly IMemberService _memberService;

    public MembersController(IMemberService memberService)
    {
        _memberService = memberService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? search = null,
        [FromQuery] bool? subscribed = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var result = await _memberService.GetAllAsync(search, subscribed, page, pageSize);
        return Ok(ApiResponse<MemberListDto>.Ok(result));
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var stats = await _memberService.GetStatsAsync();
        return Ok(ApiResponse<MemberStatsDto>.Ok(stats));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var member = await _memberService.GetByIdAsync(id);
        if (member == null)
            return NotFound(ApiResponse<object>.Fail("Member not found"));

        return Ok(ApiResponse<MemberDto>.Ok(member));
    }

    [HttpPost("{id}/resubscribe")]
    public async Task<IActionResult> Resubscribe(Guid id)
    {
        var result = await _memberService.ResubscribeAsync(id, GetCurrentUserId()!.Value);
        if (!result)
            return NotFound(ApiResponse<object>.Fail("Member not found"));

        return Ok(ApiResponse<object>.Ok(new { }, "Member resubscribed"));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var result = await _memberService.DeleteAsync(id, GetCurrentUserId()!.Value);
        if (!result)
            return NotFound(ApiResponse<object>.Fail("Member not found"));

        return Ok(ApiResponse<object>.Ok(new { }, "Member deleted"));
    }

    [HttpGet("export")]
    public async Task<IActionResult> Export([FromQuery] bool subscribedOnly = true)
    {
        var members = await _memberService.ExportAsync(subscribedOnly);
        return Ok(ApiResponse<List<MemberDto>>.Ok(members));
    }

    private Guid? GetCurrentUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(claim, out var id) ? id : null;
    }
}

[ApiController]
[Route("api/public/unsubscribe")]
public class UnsubscribeController : ControllerBase
{
    private readonly IMemberService _memberService;

    public UnsubscribeController(IMemberService memberService)
    {
        _memberService = memberService;
    }

    [HttpGet("{token}")]
    public async Task<IActionResult> Unsubscribe(string token)
    {
        var result = await _memberService.UnsubscribeAsync(token);
        if (!result)
            return NotFound(ApiResponse<object>.Fail("Invalid unsubscribe link"));

        return Ok(ApiResponse<object>.Ok(new { }, "You have been unsubscribed successfully"));
    }
}


