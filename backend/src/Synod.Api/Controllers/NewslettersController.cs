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
public class NewslettersController : ControllerBase
{
    private readonly INewsletterService _newsletterService;

    public NewslettersController(INewsletterService newsletterService)
    {
        _newsletterService = newsletterService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var userId = GetCurrentUserId();
        var role = GetCurrentUserRole();

        var newsletters = role == "SuperAdmin"
            ? await _newsletterService.GetAllAsync()
            : await _newsletterService.GetByUserAsync(userId!.Value);

        return Ok(ApiResponse<List<NewsletterDto>>.Ok(newsletters));
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var userId = GetCurrentUserId();
        var role = GetCurrentUserRole();

        var stats = role == "SuperAdmin"
            ? await _newsletterService.GetStatsAsync()
            : await _newsletterService.GetStatsAsync(userId);

        return Ok(ApiResponse<NewsletterStatsDto>.Ok(stats));
    }

    [HttpGet("templates")]
    public async Task<IActionResult> GetTemplates()
    {
        var templates = await _newsletterService.GetTemplatesAsync();
        return Ok(ApiResponse<List<NewsletterTemplateDto>>.Ok(templates));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var newsletter = await _newsletterService.GetByIdAsync(id);
        if (newsletter == null)
            return NotFound(ApiResponse<object>.Fail("Newsletter not found"));

        return Ok(ApiResponse<NewsletterDetailDto>.Ok(newsletter));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateNewsletterRequest request)
    {
        var userId = GetCurrentUserId();
        if (userId == null)
            return Unauthorized();

        var newsletter = await _newsletterService.CreateAsync(request, userId.Value);
        return Ok(ApiResponse<NewsletterDto>.Ok(newsletter, "Newsletter created"));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateNewsletterRequest request)
    {
        var newsletter = await _newsletterService.UpdateAsync(id, request);
        if (newsletter == null)
            return NotFound(ApiResponse<object>.Fail("Newsletter not found or cannot be edited"));

        return Ok(ApiResponse<NewsletterDto>.Ok(newsletter, "Newsletter updated"));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var result = await _newsletterService.DeleteAsync(id);
        if (!result)
            return NotFound(ApiResponse<object>.Fail("Newsletter not found or cannot be deleted"));

        return Ok(ApiResponse<object>.Ok(new { }, "Newsletter deleted"));
    }

    [HttpGet("{id}/preview")]
    public async Task<IActionResult> GetPreview(Guid id)
    {
        var html = await _newsletterService.GeneratePreviewHtmlAsync(id);
        if (string.IsNullOrEmpty(html))
            return NotFound(ApiResponse<object>.Fail("Newsletter not found"));

        return Ok(ApiResponse<object>.Ok(new { html }));
    }

    [HttpPost("{id}/send-test")]
    public async Task<IActionResult> SendTestEmail(Guid id, [FromBody] SendTestEmailRequest request)
    {
        var userId = GetCurrentUserId();
        if (userId == null)
            return Unauthorized();

        var result = await _newsletterService.SendTestEmailAsync(id, request.Email, userId.Value);
        if (!result)
            return NotFound(ApiResponse<object>.Fail("Newsletter not found"));

        return Ok(ApiResponse<object>.Ok(new { }, "Test email sent"));
    }

    [HttpPost("{id}/send")]
    public async Task<IActionResult> SendNewsletter(Guid id)
    {
        var userId = GetCurrentUserId();
        if (userId == null)
            return Unauthorized();

        var result = await _newsletterService.SendNewsletterAsync(id, userId.Value);
        if (!result)
            return BadRequest(ApiResponse<object>.Fail("Failed to send newsletter. It may have already been sent or there are no subscribers."));

        return Ok(ApiResponse<object>.Ok(new { }, "Newsletter sent successfully"));
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
