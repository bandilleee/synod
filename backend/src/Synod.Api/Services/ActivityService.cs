using Microsoft.EntityFrameworkCore;
using Synod.Api.Data;
using Synod.Api.Models.Entities;
using Synod.Api.Models.Responses;
using Synod.Api.Models;
using System.Text.Json;

namespace Synod.Api.Services;

public interface IActivityService
{
    Task LogAsync(AuditAction action, Guid? userId, string entityType, Guid? entityId, object? oldValues = null, object? newValues = null, string? ipAddress = null, string? userAgent = null);
    Task<ActivityListDto> GetActivitiesAsync(int page = 1, int pageSize = 20, string? actionFilter = null, Guid? userFilter = null);
    Task<ActivityListDto> GetUserActivitiesAsync(Guid userId, int page = 1, int pageSize = 20);
}

public class ActivityService : IActivityService
{
    private readonly SynodDbContext _db;

    public ActivityService(SynodDbContext db)
    {
        _db = db;
    }

    public async Task LogAsync(
        AuditAction action, 
        Guid? userId, 
        string entityType, 
        Guid? entityId, 
        object? oldValues = null, 
        object? newValues = null, 
        string? ipAddress = null, 
        string? userAgent = null)
    {
        var log = new AuditLog
        {
            Id = Guid.NewGuid(),
            Action = action,
            UserId = userId,
            EntityType = entityType,
            EntityId = entityId,
            OldValues = oldValues != null ? JsonSerializer.Serialize(oldValues) : null,
            NewValues = newValues != null ? JsonSerializer.Serialize(newValues) : null,
            IpAddress = ipAddress,
            UserAgent = userAgent
        };

        _db.AuditLogs.Add(log);
        await _db.SaveChangesAsync();
    }

    public async Task<ActivityListDto> GetActivitiesAsync(int page = 1, int pageSize = 20, string? actionFilter = null, Guid? userFilter = null)
    {
        var query = _db.AuditLogs
            .Include(a => a.User)
            .AsQueryable();

        if (!string.IsNullOrEmpty(actionFilter))
        {
            if (Enum.TryParse<AuditAction>(actionFilter, out var action))
            {
                query = query.Where(a => a.Action == action);
            }
        }

        if (userFilter.HasValue)
        {
            query = query.Where(a => a.UserId == userFilter.Value);
        }

        var totalCount = await query.CountAsync();

        var logs = await query
            .OrderByDescending(a => a.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var activities = new List<ActivityDto>();
        foreach (var log in logs)
        {
            activities.Add(await MapToActivityDto(log));
        }

        return new ActivityListDto
        {
            Activities = activities,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
            TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
        };
    }

    public async Task<ActivityListDto> GetUserActivitiesAsync(Guid userId, int page = 1, int pageSize = 20)
    {
        return await GetActivitiesAsync(page, pageSize, null, userId);
    }

    private async Task<ActivityDto> MapToActivityDto(AuditLog log)
    {
        var dto = new ActivityDto
        {
            Id = log.Id,
            Action = log.Action.ToString(),
            ActionDisplay = GetActionDisplayText(log.Action),
            EntityType = log.EntityType,
            EntityId = log.EntityId,
            UserId = log.UserId,
            UserName = log.User?.Name ?? "System",
            CreatedAt = log.CreatedAt
        };

        // Try to get entity name based on type
        if (log.EntityId.HasValue)
        {
            dto.EntityName = await GetEntityName(log.EntityType, log.EntityId.Value);
        }

        // Extract details from NewValues if present
        if (!string.IsNullOrEmpty(log.NewValues))
        {
            dto.Details = GetDetailsFromJson(log.NewValues, log.Action);
        }

        return dto;
    }

    private string GetActionDisplayText(AuditAction action)
    {
        return action switch
        {
            AuditAction.UserLoggedIn => "logged in",
            AuditAction.UserLoggedOut => "logged out",
            AuditAction.UserInvited => "invited a leader",
            AuditAction.UserAcceptedInvitation => "accepted invitation",
            AuditAction.PasswordReset => "reset password",
            
            AuditAction.OrganizationCreated => "created an organization",
            AuditAction.OrganizationUpdated => "updated an organization",
            AuditAction.OrganizationDeleted => "deleted an organization",
            
            AuditAction.UserUpdated => "updated user profile",
            AuditAction.UserSuspended => "suspended a user",
            AuditAction.UserReactivated => "reactivated a user",
            AuditAction.UserDeleted => "deleted a user",
            
            AuditAction.NewsletterCreated => "created a newsletter",
            AuditAction.NewsletterUpdated => "updated a newsletter",
            AuditAction.NewsletterSent => "sent a newsletter",
            AuditAction.NewsletterDeleted => "deleted a newsletter",
            
            AuditAction.FormCreated => "created a form",
            AuditAction.FormUpdated => "updated a form",
            AuditAction.FormPublished => "published a form",
            AuditAction.FormClosed => "closed a form",
            AuditAction.FormDeleted => "deleted a form",
            AuditAction.FormSubmissionReceived => "received a form submission",
            
            AuditAction.EventCreated => "proposed an event",
            AuditAction.EventUpdated => "updated an event",
            AuditAction.EventApproved => "approved an event",
            AuditAction.EventRejected => "rejected an event",
            AuditAction.EventCancelled => "cancelled an event",
            AuditAction.EventCompleted => "marked event as completed",
            
            AuditAction.MemberCreated => "added a new member",
            AuditAction.MemberUpdated => "updated a member",
            AuditAction.MemberUnsubscribed => "member unsubscribed",
            AuditAction.MemberDeleted => "deleted a member",
            
            _ => action.ToString()
        };
    }

    private async Task<string?> GetEntityName(string entityType, Guid entityId)
    {
        return entityType switch
        {
            "Newsletter" => (await _db.Newsletters.FindAsync(entityId))?.Title,
            "Form" => (await _db.Forms.FindAsync(entityId))?.Title,
            "Event" => (await _db.Events.FindAsync(entityId))?.Title,
            "User" => (await _db.Users.FindAsync(entityId))?.Name,
            "Organization" => (await _db.Organizations.FindAsync(entityId))?.Name,
            "Member" => (await _db.Members.FindAsync(entityId))?.Email,
            _ => null
        };
    }

    private string? GetDetailsFromJson(string json, AuditAction action)
    {
        try
        {
            var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;

            return action switch
            {
                AuditAction.NewsletterSent when root.TryGetProperty("recipientCount", out var rc) 
                    => "to " + rc.GetInt32() + " recipients",
                AuditAction.FormSubmissionReceived when root.TryGetProperty("email", out var email) 
                    => "from " + email.GetString(),
                AuditAction.EventApproved when root.TryGetProperty("currentApprovals", out var ca) && root.TryGetProperty("requiredApprovals", out var ra) 
                    => ca.GetInt32() + "/" + ra.GetInt32() + " approvals",
                AuditAction.EventRejected when root.TryGetProperty("reason", out var reason) 
                    => "Reason: " + reason.GetString(),
                AuditAction.UserInvited when root.TryGetProperty("email", out var invEmail) 
                    => invEmail.GetString(),
                _ => null
            };
        }
        catch
        {
            return null;
        }
    }
}
