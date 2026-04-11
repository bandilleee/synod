using Microsoft.EntityFrameworkCore;
using Synod.Api.Data;
using Synod.Api.Models;
using Synod.Api.Models.Entities;
using Synod.Api.Models.Requests;
using Synod.Api.Models.Responses;

namespace Synod.Api.Services;

public interface IOrganizationService
{
    Task<List<OrganizationDto>> GetAllAsync();
    Task<OrganizationDetailDto?> GetByIdAsync(Guid id);
    Task<OrganizationDto?> CreateAsync(CreateOrganizationRequest request, Guid adminUserId);
    Task<OrganizationDto?> UpdateAsync(Guid id, UpdateOrganizationRequest request, Guid adminUserId);
    Task<bool> DeleteAsync(Guid id, Guid adminUserId);
    Task<bool> SlugExistsAsync(string slug);
}

public class OrganizationService : IOrganizationService
{
    private readonly SynodDbContext _db;
    private readonly IEmailService _emailService;

    public OrganizationService(SynodDbContext db, IEmailService emailService)
    {
        _db = db;
        _emailService = emailService;
    }

    public async Task<List<OrganizationDto>> GetAllAsync()
    {
        return await _db.Organizations
            .Select(o => new OrganizationDto
            {
                Id = o.Id,
                Name = o.Name,
                Slug = o.Slug,
                Type = o.Type.ToString(),
                Description = o.Description,
                LogoUrl = o.LogoUrl,
                IsActive = o.IsActive,
                LeaderCount = o.Users.Count,
                CreatedAt = o.CreatedAt
            })
            .OrderBy(o => o.Name)
            .ToListAsync();
    }

    public async Task<OrganizationDetailDto?> GetByIdAsync(Guid id)
    {
        var org = await _db.Organizations
            .Include(o => o.Users)
            .FirstOrDefaultAsync(o => o.Id == id);

        if (org == null) return null;

        return new OrganizationDetailDto
        {
            Id = org.Id,
            Name = org.Name,
            Slug = org.Slug,
            Type = org.Type.ToString(),
            Description = org.Description,
            LogoUrl = org.LogoUrl,
            IsActive = org.IsActive,
            LeaderCount = org.Users.Count,
            CreatedAt = org.CreatedAt,
            Leaders = org.Users.Select(u => new UserDto
            {
                Id = u.Id,
                Email = u.Email,
                Name = u.Name,
                Role = u.Role.ToString(),
                Status = u.Status.ToString(),
                AvatarUrl = u.AvatarUrl
            }).ToList()
        };
    }

    public async Task<OrganizationDto?> CreateAsync(CreateOrganizationRequest request, Guid adminUserId)
    {
        if (await SlugExistsAsync(request.Slug))
            return null;

        if (!Enum.TryParse<OrganizationType>(request.Type, out var orgType))
            return null;

        var org = new Organization
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Slug = request.Slug.ToLower(),
            Type = orgType,
            Description = request.Description,
            LogoUrl = request.LogoUrl,
            IsActive = true
        };

        _db.Organizations.Add(org);
        await _db.SaveChangesAsync();

        // Get admin email and send notification
        var admin = await _db.Users.FindAsync(adminUserId);
        if (admin != null)
        {
            await _emailService.SendOrgCreatedEmailAsync(admin.Email, org.Name, org.Type.ToString());
        }

        return new OrganizationDto
        {
            Id = org.Id,
            Name = org.Name,
            Slug = org.Slug,
            Type = org.Type.ToString(),
            Description = org.Description,
            LogoUrl = org.LogoUrl,
            IsActive = org.IsActive,
            LeaderCount = 0,
            CreatedAt = org.CreatedAt
        };
    }

    public async Task<OrganizationDto?> UpdateAsync(Guid id, UpdateOrganizationRequest request, Guid adminUserId)
    {
        var org = await _db.Organizations
            .Include(o => o.Users)
            .FirstOrDefaultAsync(o => o.Id == id);

        if (org == null) return null;

        org.Name = request.Name;
        org.Description = request.Description;
        org.LogoUrl = request.LogoUrl;
        org.IsActive = request.IsActive;

        await _db.SaveChangesAsync();

        // Get admin email and send notification
        var admin = await _db.Users.FindAsync(adminUserId);
        if (admin != null)
        {
            await _emailService.SendOrgUpdatedEmailAsync(admin.Email, org.Name);
        }

        return new OrganizationDto
        {
            Id = org.Id,
            Name = org.Name,
            Slug = org.Slug,
            Type = org.Type.ToString(),
            Description = org.Description,
            LogoUrl = org.LogoUrl,
            IsActive = org.IsActive,
            LeaderCount = org.Users.Count,
            CreatedAt = org.CreatedAt
        };
    }

    public async Task<bool> DeleteAsync(Guid id, Guid adminUserId)
    {
        var org = await _db.Organizations
            .Include(o => o.Users)
            .FirstOrDefaultAsync(o => o.Id == id);
            
        if (org == null) return false;

        var orgName = org.Name;
        
        // Get all leaders in this org to notify them
        var leadersToNotify = org.Users
            .Where(u => u.Role == UserRole.Leader)
            .Select(u => new { u.Email, u.Name })
            .ToList();

        // Get admin email
        var admin = await _db.Users.FindAsync(adminUserId);
        var adminEmail = admin?.Email;

        // Remove all users from this org (cascade delete)
        foreach (var user in org.Users.ToList())
        {
            _db.Users.Remove(user);
        }

        // Remove the organization
        _db.Organizations.Remove(org);
        await _db.SaveChangesAsync();

        // Send notification to admin
        if (adminEmail != null)
        {
            await _emailService.SendOrgDeletedEmailAsync(adminEmail, orgName);
        }

        // Send notification to all affected leaders
        foreach (var leader in leadersToNotify)
        {
            await _emailService.SendOrgAccessRevokedEmailAsync(leader.Email, leader.Name, orgName);
        }

        return true;
    }

    public async Task<bool> SlugExistsAsync(string slug)
    {
        return await _db.Organizations.AnyAsync(o => o.Slug == slug.ToLower());
    }
}
