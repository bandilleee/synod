using Microsoft.EntityFrameworkCore;
using Synod.Api.Data;
using Synod.Api.Models.Entities;
using Synod.Api.Models.Requests;
using Synod.Api.Models.Responses;
using Synod.Api.Models;

namespace Synod.Api.Services;

public interface IEventService
{
    Task<List<EventDto>> GetAllAsync();
    Task<List<EventDto>> GetByUserAsync(Guid userId);
    Task<EventDetailDto?> GetByIdAsync(Guid id);
    Task<EventDto> CreateAsync(CreateEventRequest request, Guid userId);
    Task<EventDto?> UpdateAsync(Guid id, UpdateEventRequest request, Guid userId);
    Task<bool> DeleteAsync(Guid id, Guid userId);
    Task<bool> ApproveAsync(Guid eventId, Guid userId, string? comment);
    Task<bool> RejectAsync(Guid eventId, Guid userId, string? comment);
    Task<bool> CancelAsync(Guid id, Guid userId);
    Task<List<EventDto>> GetPendingApprovalsAsync(Guid userId);
}

public class EventService : IEventService
{
    private readonly SynodDbContext _db;
    private readonly IEmailService _emailService;

    public EventService(SynodDbContext db, IEmailService emailService)
    {
        _db = db;
        _emailService = emailService;
    }

    public async Task<List<EventDto>> GetAllAsync()
    {
        var events = await _db.Events
            .Include(e => e.CreatedBy)
            .Include(e => e.Approvals)
            .OrderByDescending(e => e.Date)
            .ToListAsync();

        return events.Select(MapToDto).ToList();
    }

    public async Task<List<EventDto>> GetByUserAsync(Guid userId)
    {
        var events = await _db.Events
            .Include(e => e.CreatedBy)
            .Include(e => e.Approvals)
            .Where(e => e.CreatedById == userId || e.Approvals.Any(a => a.UserId == userId))
            .OrderByDescending(e => e.Date)
            .ToListAsync();

        return events.Select(MapToDto).ToList();
    }

    public async Task<EventDetailDto?> GetByIdAsync(Guid id)
    {
        var evt = await _db.Events
            .Include(e => e.CreatedBy)
            .Include(e => e.Approvals)
                .ThenInclude(a => a.User)
            .FirstOrDefaultAsync(e => e.Id == id);

        return evt == null ? null : MapToDetailDto(evt);
    }

    public async Task<EventDto> CreateAsync(CreateEventRequest request, Guid userId)
    {
        // Get all leaders except the creator
        var otherLeaders = await _db.Users
            .Where(u => u.Id != userId && u.Status == UserStatus.Active && u.Role == UserRole.Leader)
            .ToListAsync();

        var requiredApprovals = otherLeaders.Count;

        var evt = new Event
        {
            Id = Guid.NewGuid(),
            Title = request.Title,
            Description = request.Description,
            Date = DateTime.SpecifyKind(request.Date, DateTimeKind.Utc),
            EndDate = request.EndDate.HasValue 
                ? DateTime.SpecifyKind(request.EndDate.Value, DateTimeKind.Utc) 
                : null,
            Location = request.Location,
            Status = requiredApprovals > 0 ? EventStatus.PendingApproval : EventStatus.Approved,
            RequiredApprovals = requiredApprovals,
            CurrentApprovals = 0,
            CreatedById = userId
        };

        _db.Events.Add(evt);

        // Create approval requests for all other leaders
        foreach (var leader in otherLeaders)
        {
            var approval = new EventApproval
            {
                Id = Guid.NewGuid(),
                EventId = evt.Id,
                UserId = leader.Id,
                Status = ApprovalStatus.Pending
            };
            _db.EventApprovals.Add(approval);
        }

        await _db.SaveChangesAsync();

        // Load creator for DTO
        await _db.Entry(evt).Reference(e => e.CreatedBy).LoadAsync();

        // Send email notifications to other leaders
        var creator = await _db.Users.FindAsync(userId);
        foreach (var leader in otherLeaders)
        {
            try
            {
                await _emailService.SendEmailAsync(
                    leader.Email,
                    "Event Approval Required: " + evt.Title,
                    BuildApprovalRequestEmail(evt, creator?.Name ?? "A leader", leader.Name)
                );
            }
            catch { }
        }

        return MapToDto(evt);
    }

    public async Task<EventDto?> UpdateAsync(Guid id, UpdateEventRequest request, Guid userId)
    {
        var evt = await _db.Events
            .Include(e => e.CreatedBy)
            .Include(e => e.Approvals)
                .ThenInclude(a => a.User)
            .FirstOrDefaultAsync(e => e.Id == id);

        if (evt == null) return null;

        // Only creator can update, and only if pending or approved (not completed/cancelled)
        if (evt.CreatedById != userId) return null;
        if (evt.Status == EventStatus.Completed || evt.Status == EventStatus.Cancelled) return null;

        var wasApproved = evt.Status == EventStatus.Approved;

        if (request.Title != null)
            evt.Title = request.Title;
        if (request.Description != null)
            evt.Description = request.Description;
        if (request.Date.HasValue)
            evt.Date = DateTime.SpecifyKind(request.Date.Value, DateTimeKind.Utc);
        if (request.EndDate.HasValue)
            evt.EndDate = DateTime.SpecifyKind(request.EndDate.Value, DateTimeKind.Utc);
        if (request.Location != null)
            evt.Location = request.Location;

        evt.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        // If event was already approved, notify all other leaders about the edit
        if (wasApproved)
        {
            var editor = evt.CreatedBy;
            var otherLeaders = evt.Approvals.Select(a => a.User).Where(u => u != null).ToList();
            
            foreach (var leader in otherLeaders)
            {
                try
                {
                    await _emailService.SendEmailAsync(
                        leader!.Email,
                        "Event Updated: " + evt.Title,
                        BuildEventUpdatedEmail(evt, editor?.Name ?? "A leader")
                    );
                }
                catch { }
            }
        }

        return MapToDto(evt);
    }

    public async Task<bool> DeleteAsync(Guid id, Guid userId)
    {
        var evt = await _db.Events.FirstOrDefaultAsync(e => e.Id == id);
        if (evt == null) return false;

        // Only creator can delete, and only if not completed
        if (evt.CreatedById != userId) return false;
        if (evt.Status == EventStatus.Completed) return false;

        _db.Events.Remove(evt);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ApproveAsync(Guid eventId, Guid userId, string? comment)
    {
        var approval = await _db.EventApprovals
            .Include(a => a.Event)
                .ThenInclude(e => e.CreatedBy)
            .FirstOrDefaultAsync(a => a.EventId == eventId && a.UserId == userId);

        if (approval == null) return false;
        if (approval.Status != ApprovalStatus.Pending) return false;
        if (approval.Event.Status != EventStatus.PendingApproval) return false;

        approval.Status = ApprovalStatus.Approved;
        approval.Comment = comment;
        approval.RespondedAt = DateTime.UtcNow;

        approval.Event.CurrentApprovals++;

        // Check if all approvals are complete
        if (approval.Event.CurrentApprovals >= approval.Event.RequiredApprovals)
        {
            approval.Event.Status = EventStatus.Approved;

            // Notify creator that event is fully approved
            try
            {
                await _emailService.SendEmailAsync(
                    approval.Event.CreatedBy.Email,
                    "Event Approved: " + approval.Event.Title,
                    BuildFullyApprovedEmail(approval.Event)
                );
            }
            catch { }
        }

        approval.Event.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return true;
    }

    public async Task<bool> RejectAsync(Guid eventId, Guid userId, string? comment)
    {
        var approval = await _db.EventApprovals
            .Include(a => a.Event)
                .ThenInclude(e => e.CreatedBy)
            .Include(a => a.User)
            .FirstOrDefaultAsync(a => a.EventId == eventId && a.UserId == userId);

        if (approval == null) return false;
        if (approval.Status != ApprovalStatus.Pending) return false;
        if (approval.Event.Status != EventStatus.PendingApproval) return false;

        approval.Status = ApprovalStatus.Rejected;
        approval.Comment = comment;
        approval.RespondedAt = DateTime.UtcNow;

        approval.Event.Status = EventStatus.Rejected;
        approval.Event.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        // Notify creator that event was rejected
        try
        {
            await _emailService.SendEmailAsync(
                approval.Event.CreatedBy.Email,
                "Event Rejected: " + approval.Event.Title,
                BuildRejectedEmail(approval.Event, approval.User.Name, comment)
            );
        }
        catch { }

        return true;
    }

    public async Task<bool> CancelAsync(Guid id, Guid userId)
    {
        var evt = await _db.Events.FirstOrDefaultAsync(e => e.Id == id);
        if (evt == null) return false;

        // Only creator can cancel
        if (evt.CreatedById != userId) return false;
        if (evt.Status == EventStatus.Completed || evt.Status == EventStatus.Cancelled) return false;

        evt.Status = EventStatus.Cancelled;
        evt.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return true;
    }

    public async Task<List<EventDto>> GetPendingApprovalsAsync(Guid userId)
    {
        var eventIds = await _db.EventApprovals
            .Where(a => a.UserId == userId && a.Status == ApprovalStatus.Pending)
            .Select(a => a.EventId)
            .ToListAsync();

        var events = await _db.Events
            .Include(e => e.CreatedBy)
            .Include(e => e.Approvals)
            .Where(e => eventIds.Contains(e.Id) && e.Status == EventStatus.PendingApproval)
            .OrderByDescending(e => e.CreatedAt)
            .ToListAsync();

        return events.Select(MapToDto).ToList();
    }

    private EventDto MapToDto(Event evt)
    {
        return new EventDto
        {
            Id = evt.Id,
            Title = evt.Title,
            Description = evt.Description,
            Date = evt.Date,
            EndDate = evt.EndDate,
            Location = evt.Location,
            Status = evt.Status.ToString(),
            RequiredApprovals = evt.RequiredApprovals,
            CurrentApprovals = evt.CurrentApprovals,
            CreatedById = evt.CreatedById,
            CreatedByName = evt.CreatedBy?.Name ?? "",
            CreatedAt = evt.CreatedAt,
            UpdatedAt = evt.UpdatedAt
        };
    }

    private EventDetailDto MapToDetailDto(Event evt)
    {
        return new EventDetailDto
        {
            Id = evt.Id,
            Title = evt.Title,
            Description = evt.Description,
            Date = evt.Date,
            EndDate = evt.EndDate,
            Location = evt.Location,
            Status = evt.Status.ToString(),
            RequiredApprovals = evt.RequiredApprovals,
            CurrentApprovals = evt.CurrentApprovals,
            CreatedById = evt.CreatedById,
            CreatedByName = evt.CreatedBy?.Name ?? "",
            CreatedAt = evt.CreatedAt,
            UpdatedAt = evt.UpdatedAt,
            Approvals = evt.Approvals.Select(a => new EventApprovalDto
            {
                Id = a.Id,
                UserId = a.UserId,
                UserName = a.User?.Name ?? "",
                Status = a.Status.ToString(),
                Comment = a.Comment,
                RespondedAt = a.RespondedAt,
                CreatedAt = a.CreatedAt
            }).ToList()
        };
    }

    private string BuildApprovalRequestEmail(Event evt, string proposerName, string recipientName)
    {
        return $@"
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: -apple-system, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: #1e293b; color: white; padding: 20px; text-align: center; }}
        .content {{ padding: 20px; background: #fff; }}
        .event-details {{ background: #f9fafb; padding: 15px; border-radius: 8px; margin: 15px 0; }}
        .btn {{ display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>SYNOD</h1>
        </div>
        <div class='content'>
            <p>Hi {recipientName},</p>
            <p><strong>{proposerName}</strong> has proposed a new event and needs your approval:</p>
            <div class='event-details'>
                <h3>{evt.Title}</h3>
                <p><strong>Date:</strong> {evt.Date:MMMM dd, yyyy 'at' h:mm tt}</p>
                {(string.IsNullOrEmpty(evt.Location) ? "" : $"<p><strong>Location:</strong> {evt.Location}</p>")}
                {(string.IsNullOrEmpty(evt.Description) ? "" : $"<p>{evt.Description}</p>")}
            </div>
            <p>Please log in to Synod to approve or reject this event.</p>
        </div>
    </div>
</body>
</html>";
    }

    private string BuildFullyApprovedEmail(Event evt)
    {
        return $@"
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: -apple-system, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: #1e293b; color: white; padding: 20px; text-align: center; }}
        .content {{ padding: 20px; background: #fff; }}
        .success {{ background: #d1fae5; border: 1px solid #10b981; padding: 15px; border-radius: 8px; margin: 15px 0; }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>SYNOD</h1>
        </div>
        <div class='content'>
            <div class='success'>
                <h3>🎉 Event Approved!</h3>
                <p>Your event <strong>{evt.Title}</strong> has been approved by all leaders.</p>
            </div>
            <p><strong>Date:</strong> {evt.Date:MMMM dd, yyyy 'at' h:mm tt}</p>
            {(string.IsNullOrEmpty(evt.Location) ? "" : $"<p><strong>Location:</strong> {evt.Location}</p>")}
        </div>
    </div>
</body>
</html>";
    }

    private string BuildRejectedEmail(Event evt, string rejectorName, string? reason)
    {
        return $@"
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: -apple-system, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: #1e293b; color: white; padding: 20px; text-align: center; }}
        .content {{ padding: 20px; background: #fff; }}
        .rejected {{ background: #fee2e2; border: 1px solid #ef4444; padding: 15px; border-radius: 8px; margin: 15px 0; }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>SYNOD</h1>
        </div>
        <div class='content'>
            <div class='rejected'>
                <h3>Event Rejected</h3>
                <p>Your event <strong>{evt.Title}</strong> was rejected by {rejectorName}.</p>
                {(string.IsNullOrEmpty(reason) ? "" : $"<p><strong>Reason:</strong> {reason}</p>")}
            </div>
        </div>
    </div>
</body>
</html>";
    }

    private string BuildEventUpdatedEmail(Event evt, string editorName)
    {
        return $@"
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: -apple-system, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: #1e293b; color: white; padding: 20px; text-align: center; }}
        .content {{ padding: 20px; background: #fff; }}
        .updated {{ background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 15px 0; }}
        .event-details {{ background: #f9fafb; padding: 15px; border-radius: 8px; margin: 15px 0; }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>SYNOD</h1>
        </div>
        <div class='content'>
            <div class='updated'>
                <h3>⚠️ Event Updated</h3>
                <p><strong>{editorName}</strong> has made changes to an approved event.</p>
            </div>
            <div class='event-details'>
                <h3>{evt.Title}</h3>
                <p><strong>Date:</strong> {evt.Date:MMMM dd, yyyy 'at' h:mm tt}</p>
                {(string.IsNullOrEmpty(evt.Location) ? "" : $"<p><strong>Location:</strong> {evt.Location}</p>")}
                {(string.IsNullOrEmpty(evt.Description) ? "" : $"<p>{evt.Description}</p>")}
            </div>
            <p>Please log in to Synod to review the updated event details.</p>
        </div>
    </div>
</body>
</html>";
    }
}
