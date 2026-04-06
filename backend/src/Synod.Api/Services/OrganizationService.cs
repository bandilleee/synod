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
    Task<OrganizationDto?> CreateAsync(CreateOrganizationRequest request);
    Task<OrganizationDto?> UpdateAsync(Guid id, UpdateOrganizationRequest request);
    Task<bool> DeleteAsync(Guid id);
    Task<bool> SlugExistsAsync(string slug);
}

public class OrganizationService : IOrganizationService
{
    private readonly SynodDbContext _db;

    public OrganizationService(SynodDbContext db)
    {
        _db = db;
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

    public async Task<OrganizationDto?> CreateAsync(CreateOrganizationRequest request)
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

    public async Task<OrganizationDto?> UpdateAsync(Guid id, UpdateOrganizationRequest request)
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

    public async Task<bool> DeleteAsync(Guid id)
    {
        var org = await _db.Organizations.FindAsync(id);
        if (org == null) return false;

        _db.Organizations.Remove(org);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> SlugExistsAsync(string slug)
    {
        return await _db.Organizations.AnyAsync(o => o.Slug == slug.ToLower());
    }
}
