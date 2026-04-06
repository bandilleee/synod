using Microsoft.AspNetCore.Mvc;
using Synod.Api.Models.Requests;
using Synod.Api.Models.Responses;
using Synod.Api.Services;

namespace Synod.Api.Controllers;

[ApiController]
[Route("api/public/forms")]
public class PublicFormsController : ControllerBase
{
    private readonly IFormService _formService;

    public PublicFormsController(IFormService formService)
    {
        _formService = formService;
    }

    [HttpGet("{slug}")]
    public async Task<IActionResult> GetBySlug(string slug)
    {
        var form = await _formService.GetBySlugAsync(slug);
        if (form == null)
            return NotFound(ApiResponse<object>.Fail("Form not found or not active"));

        return Ok(ApiResponse<FormDetailDto>.Ok(form));
    }

    [HttpPost("{slug}/submit")]
    public async Task<IActionResult> Submit(string slug, [FromBody] SubmitFormRequest request)
    {
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
        var userAgent = HttpContext.Request.Headers["User-Agent"].ToString();

        var submission = await _formService.SubmitAsync(slug, request, ipAddress, userAgent);
        if (submission == null)
            return NotFound(ApiResponse<object>.Fail("Form not found or not accepting submissions"));

        return Ok(ApiResponse<FormSubmissionDto>.Ok(submission, "Form submitted successfully"));
    }
}
