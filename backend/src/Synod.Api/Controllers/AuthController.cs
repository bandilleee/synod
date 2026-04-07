using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Synod.Api.Models.Requests;
using Synod.Api.Models.Responses;
using Synod.Api.Services;

namespace Synod.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var result = await _authService.LoginAsync(request);

        if (result == null)
            return Unauthorized(ApiResponse<object>.Fail("Invalid email or password"));

        return Ok(ApiResponse<AuthResponse>.Ok(result, "Login successful"));
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh([FromBody] RefreshTokenRequest request)
    {
        var result = await _authService.RefreshTokenAsync(request.RefreshToken);

        if (result == null)
            return Unauthorized(ApiResponse<object>.Fail("Invalid or expired refresh token"));

        return Ok(ApiResponse<AuthResponse>.Ok(result));
    }

    [HttpPost("accept-invitation")]
    public async Task<IActionResult> AcceptInvitation([FromBody] AcceptInvitationRequest request)
    {
        var result = await _authService.AcceptInvitationAsync(request);

        if (result == null)
            return BadRequest(ApiResponse<object>.Fail("Invalid or expired invitation"));

        return Ok(ApiResponse<AuthResponse>.Ok(result, "Account created successfully"));
    }

    [Authorize]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        var userId = GetCurrentUserId();
        if (userId == null)
            return Unauthorized();

        await _authService.LogoutAsync(userId.Value);
        return Ok(ApiResponse<object>.Ok(new { }, "Logged out successfully"));
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> GetCurrentUser()
    {
        var userId = GetCurrentUserId();
        if (userId == null)
            return Unauthorized();

        var user = await _authService.GetCurrentUserAsync(userId.Value);
        if (user == null)
            return NotFound(ApiResponse<object>.Fail("User not found"));

        return Ok(ApiResponse<UserDto>.Ok(user));
    }

    [Authorize]
    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
    {
        var userId = GetCurrentUserId();
        if (userId == null)
            return Unauthorized();

        var user = await _authService.UpdateProfileAsync(userId.Value, request);
        if (user == null)
            return BadRequest(ApiResponse<object>.Fail("Failed to update profile. Email may already be in use."));

        return Ok(ApiResponse<UserDto>.Ok(user, "Profile updated successfully"));
    }

    [Authorize]
    [HttpPut("password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        var userId = GetCurrentUserId();
        if (userId == null)
            return Unauthorized();

        var result = await _authService.ChangePasswordAsync(userId.Value, request);
        if (!result)
            return BadRequest(ApiResponse<object>.Fail("Current password is incorrect"));

        return Ok(ApiResponse<object>.Ok(new { }, "Password changed successfully"));
    }

    private Guid? GetCurrentUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(claim, out var id) ? id : null;
    }
}

