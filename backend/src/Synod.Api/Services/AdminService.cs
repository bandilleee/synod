using Microsoft.EntityFrameworkCore;
using Synod.Api.Data;
using Synod.Api.Models;
using Synod.Api.Models.Responses;

namespace Synod.Api.Services;

public interface IAdminService
{
    Task<AdminStatsResponse> GetStatsAsync();
    Task<List<UserDto>> GetAllLeadersAsync();
    Task<bool> SuspendUserAsync(Guid userId, Guid adminUserId);
    Task<bool> ReactivateUserAsync(Guid userId);
    Task<bool> DeleteUserAsync(Guid userId, Guid adminUserId);
}

public class AdminService : IAdminService
{
    private readonly SynodDbContext _db;
    private readonly IEmailService _emailService;

    public AdminService(SynodDbContext db, IEmailService emailService)
    {
        _db = db;
        _emailService = emailService;
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

    public async Task<bool> SuspendUserAsync(Guid userId, Guid adminUserId)
    {
        var user = await _db.Users
            .Include(u => u.Organization)
            .FirstOrDefaultAsync(u => u.Id == userId);
            
        if (user == null || user.Role == UserRole.SuperAdmin)
            return false;

        var leaderName = user.Name;
        var leaderEmail = user.Email;
        var orgName = user.Organization?.Name ?? "the platform";

        user.Status = UserStatus.Suspended;
        await _db.SaveChangesAsync();

        // Send email to the suspended leader
        await _emailService.SendLeaderSuspendedEmailAsync(leaderEmail, leaderName, orgName);

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

    public async Task<bool> DeleteUserAsync(Guid userId, Guid adminUserId)
    {
        var user = await _db.Users
            .Include(u => u.Organization)
            .FirstOrDefaultAsync(u => u.Id == userId);
            
        if (user == null || user.Role == UserRole.SuperAdmin)
            return false;

        var leaderName = user.Name;
        var leaderEmail = user.Email;
        var orgName = user.Organization?.Name ?? "the platform";

        // Get admin email
        var admin = await _db.Users.FindAsync(adminUserId);
        var adminEmail = admin?.Email;

        _db.Users.Remove(user);
        await _db.SaveChangesAsync();

        // Send email to the removed leader
        await _emailService.SendLeaderRemovedEmailAsync(leaderEmail, leaderName, orgName);

        // Send confirmation to admin
        if (adminEmail != null)
        {
            await _emailService.SendLeaderRemovedAdminNotificationAsync(adminEmail, leaderName, leaderEmail, orgName);
        }

        return true;
    }
}
