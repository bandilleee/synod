using Microsoft.EntityFrameworkCore;
using Synod.Api.Data;
using Synod.Api.Infrastructure.Auth;
using Synod.Api.Models;
using Synod.Api.Models.Entities;
using Synod.Api.Models.Requests;
using Synod.Api.Models.Responses;

namespace Synod.Api.Services;

public interface IAuthService
{
    Task<AuthResponse?> LoginAsync(LoginRequest request);
    Task<AuthResponse?> RefreshTokenAsync(string refreshToken);
    Task<AuthResponse?> AcceptInvitationAsync(AcceptInvitationRequest request);
    Task<bool> LogoutAsync(Guid userId);
    Task<UserDto?> GetCurrentUserAsync(Guid userId);
}

public class AuthService : IAuthService
{
    private readonly SynodDbContext _db;
    private readonly IJwtTokenGenerator _jwt;
    private readonly IPasswordHasher _hasher;
    private readonly IConfiguration _config;

    public AuthService(
        SynodDbContext db,
        IJwtTokenGenerator jwt,
        IPasswordHasher hasher,
        IConfiguration config)
    {
        _db = db;
        _jwt = jwt;
        _hasher = hasher;
        _config = config;
    }

    public async Task<AuthResponse?> LoginAsync(LoginRequest request)
    {
        var user = await _db.Users
            .Include(u => u.Organization)
            .FirstOrDefaultAsync(u => u.Email.ToLower() == request.Email.ToLower());

        if (user == null)
            return null;

        if (!_hasher.Verify(request.Password, user.PasswordHash))
            return null;

        if (user.Status != UserStatus.Active)
            return null;

        return await GenerateAuthResponseAsync(user);
    }

    public async Task<AuthResponse?> RefreshTokenAsync(string refreshToken)
    {
        var user = await _db.Users
            .Include(u => u.Organization)
            .FirstOrDefaultAsync(u => u.RefreshToken == refreshToken);

        if (user == null)
            return null;

        if (user.RefreshTokenExpiresAt < DateTime.UtcNow)
            return null;

        if (user.Status != UserStatus.Active)
            return null;

        return await GenerateAuthResponseAsync(user);
    }

    public async Task<AuthResponse?> AcceptInvitationAsync(AcceptInvitationRequest request)
    {
        var invitation = await _db.Invitations
            .Include(i => i.Organization)
            .FirstOrDefaultAsync(i => i.Token == request.Token);

        if (invitation == null)
            return null;

        if (invitation.Status != InvitationStatus.Pending)
            return null;

        if (invitation.ExpiresAt < DateTime.UtcNow)
        {
            invitation.Status = InvitationStatus.Expired;
            await _db.SaveChangesAsync();
            return null;
        }

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = invitation.Email,
            Name = request.Name,
            PasswordHash = _hasher.Hash(request.Password),
            Role = invitation.Role,
            Status = UserStatus.Active,
            OrganizationId = invitation.OrganizationId
        };

        invitation.Status = InvitationStatus.Accepted;
        invitation.AcceptedAt = DateTime.UtcNow;

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        user.Organization = invitation.Organization;
        return await GenerateAuthResponseAsync(user);
    }

    public async Task<bool> LogoutAsync(Guid userId)
    {
        var user = await _db.Users.FindAsync(userId);
        if (user == null)
            return false;

        user.RefreshToken = null;
        user.RefreshTokenExpiresAt = null;
        await _db.SaveChangesAsync();

        return true;
    }

    public async Task<UserDto?> GetCurrentUserAsync(Guid userId)
    {
        var user = await _db.Users
            .Include(u => u.Organization)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null)
            return null;

        return MapToDto(user);
    }

    private async Task<AuthResponse> GenerateAuthResponseAsync(User user)
    {
        var accessToken = _jwt.GenerateAccessToken(user);
        var refreshToken = _jwt.GenerateRefreshToken();
        var refreshExpiryDays = int.Parse(_config["Jwt:RefreshTokenExpiryDays"] ?? "7");

        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiresAt = DateTime.UtcNow.AddDays(refreshExpiryDays);
        user.LastLoginAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return new AuthResponse
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            User = MapToDto(user)
        };
    }

    private static UserDto MapToDto(User user) => new()
    {
        Id = user.Id,
        Email = user.Email,
        Name = user.Name,
        Role = user.Role.ToString(),
        Status = user.Status.ToString(),
        AvatarUrl = user.AvatarUrl,
        OrganizationId = user.OrganizationId,
        OrganizationName = user.Organization?.Name
    };
}
