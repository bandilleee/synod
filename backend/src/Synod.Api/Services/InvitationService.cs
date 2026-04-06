using Microsoft.EntityFrameworkCore;
using Synod.Api.Data;
using Synod.Api.Models;
using Synod.Api.Models.Entities;
using Synod.Api.Models.Requests;
using Synod.Api.Models.Responses;

namespace Synod.Api.Services;

public interface IInvitationService
{
    Task<InvitationDto?> CreateAsync(InviteLeaderRequest request, Guid invitedById);
    Task<List<InvitationDto>> GetAllAsync();
    Task<List<InvitationDto>> GetByOrganizationAsync(Guid organizationId);
    Task<bool> RevokeAsync(Guid invitationId);
    Task<bool> ResendAsync(Guid invitationId);
}

public class InvitationService : IInvitationService
{
    private readonly SynodDbContext _db;
    private readonly IEmailService _emailService;

    public InvitationService(SynodDbContext db, IEmailService emailService)
    {
        _db = db;
        _emailService = emailService;
    }

    public async Task<InvitationDto?> CreateAsync(InviteLeaderRequest request, Guid invitedById)
    {
        var org = await _db.Organizations.FindAsync(request.OrganizationId);
        if (org == null) return null;

        var existingUser = await _db.Users.AnyAsync(u => u.Email.ToLower() == request.Email.ToLower());
        if (existingUser) return null;

        var existingInvite = await _db.Invitations.AnyAsync(i => 
            i.Email.ToLower() == request.Email.ToLower() && 
            i.Status == InvitationStatus.Pending);
        if (existingInvite) return null;

        var inviter = await _db.Users.FindAsync(invitedById);
        if (inviter == null) return null;

        var invitation = new Invitation
        {
            Id = Guid.NewGuid(),
            Email = request.Email.ToLower(),
            Token = Guid.NewGuid().ToString("N"),
            Role = UserRole.Leader,
            Status = InvitationStatus.Pending,
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            OrganizationId = request.OrganizationId,
            InvitedById = invitedById
        };

        _db.Invitations.Add(invitation);
        await _db.SaveChangesAsync();

        await _emailService.SendInvitationEmailAsync(
            invitation.Email,
            inviter.Name,
            org.Name,
            invitation.Token
        );

        return new InvitationDto
        {
            Id = invitation.Id,
            Email = invitation.Email,
            Role = invitation.Role.ToString(),
            Status = invitation.Status.ToString(),
            ExpiresAt = invitation.ExpiresAt,
            OrganizationId = org.Id,
            OrganizationName = org.Name,
            InvitedByName = inviter.Name,
            CreatedAt = invitation.CreatedAt
        };
    }

    public async Task<List<InvitationDto>> GetAllAsync()
    {
        return await _db.Invitations
            .Include(i => i.Organization)
            .Include(i => i.InvitedBy)
            .Select(i => new InvitationDto
            {
                Id = i.Id,
                Email = i.Email,
                Role = i.Role.ToString(),
                Status = i.Status.ToString(),
                ExpiresAt = i.ExpiresAt,
                AcceptedAt = i.AcceptedAt,
                OrganizationId = i.OrganizationId,
                OrganizationName = i.Organization.Name,
                InvitedByName = i.InvitedBy.Name,
                CreatedAt = i.CreatedAt
            })
            .OrderByDescending(i => i.CreatedAt)
            .ToListAsync();
    }

    public async Task<List<InvitationDto>> GetByOrganizationAsync(Guid organizationId)
    {
        return await _db.Invitations
            .Include(i => i.Organization)
            .Include(i => i.InvitedBy)
            .Where(i => i.OrganizationId == organizationId)
            .Select(i => new InvitationDto
            {
                Id = i.Id,
                Email = i.Email,
                Role = i.Role.ToString(),
                Status = i.Status.ToString(),
                ExpiresAt = i.ExpiresAt,
                AcceptedAt = i.AcceptedAt,
                OrganizationId = i.OrganizationId,
                OrganizationName = i.Organization.Name,
                InvitedByName = i.InvitedBy.Name,
                CreatedAt = i.CreatedAt
            })
            .OrderByDescending(i => i.CreatedAt)
            .ToListAsync();
    }

    public async Task<bool> RevokeAsync(Guid invitationId)
    {
        var invitation = await _db.Invitations.FindAsync(invitationId);
        if (invitation == null || invitation.Status != InvitationStatus.Pending)
            return false;

        invitation.Status = InvitationStatus.Revoked;
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ResendAsync(Guid invitationId)
    {
        var invitation = await _db.Invitations
            .Include(i => i.Organization)
            .Include(i => i.InvitedBy)
            .FirstOrDefaultAsync(i => i.Id == invitationId);

        if (invitation == null || invitation.Status != InvitationStatus.Pending)
            return false;

        invitation.Token = Guid.NewGuid().ToString("N");
        invitation.ExpiresAt = DateTime.UtcNow.AddDays(7);
        await _db.SaveChangesAsync();

        await _emailService.SendInvitationEmailAsync(
            invitation.Email,
            invitation.InvitedBy.Name,
            invitation.Organization.Name,
            invitation.Token
        );

        return true;
    }
}
