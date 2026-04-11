using Microsoft.EntityFrameworkCore;
using Synod.Api.Data;
using Synod.Api.Models;
using Synod.Api.Models.Entities;
using Synod.Api.Models.Responses;

namespace Synod.Api.Services;

public interface IMemberService
{
    Task<MemberListDto> GetAllAsync(string? search = null, bool? subscribed = null, int page = 1, int pageSize = 20);
    Task<MemberDto?> GetByIdAsync(Guid id);
    Task<MemberDto?> GetByEmailAsync(string email);
    Task<MemberDto?> CreateOrUpdateFromSubmissionAsync(string email, string? name, string? phone, string? metadataJson, Guid? sourceFormId);
    Task<bool> UnsubscribeAsync(string token);
    Task<bool> ResubscribeAsync(Guid id, Guid userId);
    Task<bool> DeleteAsync(Guid id, Guid userId);
    Task<MemberStatsDto> GetStatsAsync();
    Task<List<MemberDto>> ExportAsync(bool subscribedOnly = true);
}

public class MemberService : IMemberService
{
    private readonly SynodDbContext _db;
    private readonly IActivityService _activityService;
    private readonly IEmailService _emailService;

    public MemberService(SynodDbContext db, IActivityService activityService, IEmailService emailService)
    {
        _db = db;
        _activityService = activityService;
        _emailService = emailService;
    }

    public async Task<MemberListDto> GetAllAsync(string? search = null, bool? subscribed = null, int page = 1, int pageSize = 20)
    {
        var query = _db.Members
            .Include(m => m.SourceForm)
            .Include(m => m.FormSubmissions)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchLower = search.ToLower();
            query = query.Where(m => 
                m.Email.ToLower().Contains(searchLower) ||
                (m.Name != null && m.Name.ToLower().Contains(searchLower)) ||
                (m.Phone != null && m.Phone.Contains(search)));
        }

        if (subscribed.HasValue)
        {
            query = query.Where(m => m.IsSubscribed == subscribed.Value);
        }

        var totalCount = await query.CountAsync();
        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

        var members = await query
            .OrderByDescending(m => m.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new MemberListDto
        {
            Members = members.Select(MapToDto).ToList(),
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
            TotalPages = totalPages
        };
    }

    public async Task<MemberDto?> GetByIdAsync(Guid id)
    {
        var member = await _db.Members
            .Include(m => m.SourceForm)
            .Include(m => m.FormSubmissions)
            .FirstOrDefaultAsync(m => m.Id == id);

        return member == null ? null : MapToDto(member);
    }

    public async Task<MemberDto?> GetByEmailAsync(string email)
    {
        var member = await _db.Members
            .Include(m => m.SourceForm)
            .Include(m => m.FormSubmissions)
            .FirstOrDefaultAsync(m => m.Email.ToLower() == email.ToLower());

        return member == null ? null : MapToDto(member);
    }

    public async Task<MemberDto?> CreateOrUpdateFromSubmissionAsync(string email, string? name, string? phone, string? metadataJson, Guid? sourceFormId)
    {
        var member = await _db.Members.FirstOrDefaultAsync(m => m.Email.ToLower() == email.ToLower());

        if (member == null)
        {
            member = new Member
            {
                Id = Guid.NewGuid(),
                Email = email.ToLower(),
                Name = name,
                Phone = phone,
                MetadataJson = metadataJson,
                SourceFormId = sourceFormId,
                UnsubscribeToken = Guid.NewGuid().ToString("N")
            };
            _db.Members.Add(member);
        }
        else
        {
            if (!string.IsNullOrWhiteSpace(name))
                member.Name = name;
            if (!string.IsNullOrWhiteSpace(phone))
                member.Phone = phone;
            if (!string.IsNullOrWhiteSpace(metadataJson))
                member.MetadataJson = metadataJson;
        }

        await _db.SaveChangesAsync();

        member = await _db.Members
            .Include(m => m.SourceForm)
            .Include(m => m.FormSubmissions)
            .FirstAsync(m => m.Id == member.Id);

        return MapToDto(member);
    }

    public async Task<bool> UnsubscribeAsync(string token)
    {
        var member = await _db.Members.FirstOrDefaultAsync(m => m.UnsubscribeToken == token);
        if (member == null)
            return false;

        member.IsSubscribed = false;
        member.UnsubscribedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ResubscribeAsync(Guid id, Guid userId)
    {
        var member = await _db.Members.FindAsync(id);
        if (member == null)
            return false;

        member.IsSubscribed = true;
        member.UnsubscribedAt = null;
        await _db.SaveChangesAsync();

        await _activityService.LogAsync(
            AuditAction.MemberUpdated,
            userId,
            "Member",
            id,
            null,
            new { email = member.Email, action = "resubscribed" }
        );

        return true;
    }

    public async Task<bool> DeleteAsync(Guid id, Guid userId)
    {
        var member = await _db.Members.FindAsync(id);
        if (member == null)
            return false;

        var memberEmail = member.Email;
        var memberName = member.Name;

        // Get deleter info
        var deleter = await _db.Users.FindAsync(userId);
        var deleterName = deleter?.Name ?? "A leader";

        // Get all other leader emails
        var leaderEmails = await _db.Users
            .Where(u => u.Role == UserRole.Leader && u.Status == UserStatus.Active && u.Id != userId)
            .Select(u => u.Email)
            .ToListAsync();

        _db.Members.Remove(member);
        await _db.SaveChangesAsync();

        await _activityService.LogAsync(
            AuditAction.MemberDeleted,
            userId,
            "Member",
            id,
            new { email = memberEmail },
            null
        );

        // Send email to all other leaders
        if (leaderEmails.Any())
        {
            await _emailService.SendMemberDeletedEmailAsync(leaderEmails, deleterName, memberEmail, memberName);
        }

        return true;
    }

    public async Task<MemberStatsDto> GetStatsAsync()
    {
        // Get current UTC time and calculate start of month in UTC
        var now = DateTime.UtcNow;
        var startOfMonth = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);

        var total = await _db.Members.CountAsync();
        var subscribed = await _db.Members.CountAsync(m => m.IsSubscribed);
        var unsubscribed = total - subscribed;
        var newThisMonth = await _db.Members.CountAsync(m => m.CreatedAt >= startOfMonth);

        return new MemberStatsDto
        {
            TotalMembers = total,
            SubscribedMembers = subscribed,
            UnsubscribedMembers = unsubscribed,
            NewThisMonth = newThisMonth
        };
    }

    public async Task<List<MemberDto>> ExportAsync(bool subscribedOnly = true)
    {
        var query = _db.Members
            .Include(m => m.SourceForm)
            .Include(m => m.FormSubmissions)
            .AsQueryable();

        if (subscribedOnly)
        {
            query = query.Where(m => m.IsSubscribed);
        }

        var members = await query.OrderBy(m => m.Email).ToListAsync();
        return members.Select(MapToDto).ToList();
    }

    private static MemberDto MapToDto(Member member)
    {
        return new MemberDto
        {
            Id = member.Id,
            Email = member.Email,
            Name = member.Name,
            Phone = member.Phone,
            MetadataJson = member.MetadataJson,
            IsSubscribed = member.IsSubscribed,
            UnsubscribedAt = member.UnsubscribedAt,
            SourceFormName = member.SourceForm?.Title,
            SubmissionCount = member.FormSubmissions?.Count ?? 0,
            CreatedAt = member.CreatedAt,
            UpdatedAt = member.UpdatedAt
        };
    }
}
