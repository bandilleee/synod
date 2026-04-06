using Microsoft.EntityFrameworkCore;
using Synod.Api.Data;
using Synod.Api.Models;
using Synod.Api.Models.Responses;

namespace Synod.Api.Services;

public interface IAdminService
{
    Task<AdminStatsResponse> GetStatsAsync();
    Task<List<UserDto>> GetAllLeadersAsync();
    Task<bool> SuspendUserAsync(Guid userId);
    Task<bool> ReactivateUserAsync(Guid userId);
    Task<bool> DeleteUserAsync(Guid userId);
}

public class AdminService : IAdminService
{
    private readonly SynodDbContext _db;

    public AdminService(SynodDbContext db)
    {
        _db = db;
    }

    public async Task<AdminStatsResponse> GetStatsAsync()
    {
        return new AdminStatsResponse
        {
            TotalLeaders = await _db.Users.CountAsync(u => u.Role == UserRole.Leader),
            TotalOrganizations = await _db.Organizations.CountAsync(),
            TotalMembers = await _db.Members.CountAsync(),
            TotalEvents = await _db.Events.CountAsync(),
            PendingInvitations = await _db.Invitations.CountAsync(i => i.Status == InvitationStatus.Pending),
            PendingEventApprovals = await _db.Events.CountAsync(e => e.Status == EventStatus.PendingApproval)
        };
    }

    public async Task<List<UserDto>> GetAllLeadersAsync()
    {
        return await _db.Users
            .Include(u => u.Organization)
            .Where(u => u.Role == UserRole.Leader)
            .Select(u => new UserDto
            {
                Id = u.Id,
                Email = u.Email,
                Name = u.Name,
                Role = u.Role.ToString(),
                Status = u.Status.ToString(),
                AvatarUrl = u.AvatarUrl,
                OrganizationId = u.OrganizationId,
                OrganizationName = u.Organization != null ? u.Organization.Name : null
            })
            .OrderBy(u => u.Name)
            .ToListAsync();
    }

    public async Task<bool> SuspendUserAsync(Guid userId)
    {
        var user = await _db.Users.FindAsync(userId);
        if (user == null || user.Role == UserRole.SuperAdmin)
            return false;

        user.Status = UserStatus.Suspended;
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ReactivateUserAsync(Guid userId)
    {
        var user = await _db.Users.FindAsync(userId);
        if (user == null)
            return false;

        user.Status = UserStatus.Active;
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteUserAsync(Guid userId)
    {
        var user = await _db.Users.FindAsync(userId);
        if (user == null || user.Role == UserRole.SuperAdmin)
            return false;

        _db.Users.Remove(user);
        await _db.SaveChangesAsync();
        return true;
    }
}
