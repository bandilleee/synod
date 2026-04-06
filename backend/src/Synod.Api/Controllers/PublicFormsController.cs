using Microsoft.AspNetCore.Mvc;
using Synod.Api.Models.Requests;
using Synod.Api.Models.Responses;
using Synod.Api.Services;
using Synod.Api.Infrastructure;

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
            return NotFound(ApiResponse<object>.Fail("Form not found or not accepting submissions"));

        return Ok(ApiResponse<FormDetailDto>.Ok(form));
    }

    [HttpPost("{slug}/submit")]
    public async Task<IActionResult> Submit(string slug, [FromBody] SubmitFormRequest request)
    {
        // Validate that submitted data contains valid emails
        try
        {
            var data = System.Text.Json.JsonDocument.Parse(request.DataJson);
            foreach (var prop in data.RootElement.EnumerateObject())
            {
                var keyLower = prop.Name.ToLower();
                // If field name contains "email", validate the value
                if (keyLower.Contains("email"))
                {
                    var value = prop.Value.GetString();
                    if (!string.IsNullOrEmpty(value) && !ValidationHelpers.IsValidEmail(value))
                    {
                        return BadRequest(ApiResponse<object>.Fail("Please enter a valid email address"));
                    }
                }
            }
        }
        catch
        {
            return BadRequest(ApiResponse<object>.Fail("Invalid form data"));
        }

        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
        var userAgent = HttpContext.Request.Headers.UserAgent.FirstOrDefault();

        var submission = await _formService.SubmitAsync(slug, request, ipAddress, userAgent);
        if (submission == null)
            return NotFound(ApiResponse<object>.Fail("Form not found or not accepting submissions"));

        return Ok(ApiResponse<FormSubmissionDto>.Ok(submission, "Form submitted successfully"));
    }
}
