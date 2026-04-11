using Microsoft.EntityFrameworkCore;
using Synod.Api.Data;
using Synod.Api.Models.Entities;
using Synod.Api.Models.Requests;
using Synod.Api.Models.Responses;
using Synod.Api.Infrastructure;
using Synod.Api.Models;
using System.Text.Json;

namespace Synod.Api.Services;

public interface IFormService
{
    Task<List<FormDto>> GetAllAsync();
    Task<List<FormDto>> GetByUserAsync(Guid userId);
    Task<FormDetailDto?> GetByIdAsync(Guid id);
    Task<FormDetailDto?> GetBySlugAsync(string slug);
    Task<bool> SlugExistsAsync(string slug);
    Task<FormDto?> CreateAsync(CreateFormRequest request, Guid userId);
    Task<FormDto?> UpdateAsync(Guid id, UpdateFormRequest request, Guid userId);
    Task<bool> DeleteAsync(Guid id, Guid userId);
    Task<bool> PublishAsync(Guid id, Guid userId);
    Task<bool> CloseAsync(Guid id, Guid userId);
    Task<FormSubmissionDto?> SubmitAsync(string slug, SubmitFormRequest request, string? ipAddress, string? userAgent);
    Task<FormSubmissionListDto> GetSubmissionsAsync(Guid formId, int page = 1, int pageSize = 50);
}

public class FormService : IFormService
{
    private readonly SynodDbContext _db;
    private readonly IActivityService _activityService;
    private readonly IEmailService _emailService;

    public FormService(SynodDbContext db, IActivityService activityService, IEmailService emailService)
    {
        _db = db;
        _activityService = activityService;
        _emailService = emailService;
    }

    public async Task<List<FormDto>> GetAllAsync()
    {
        var forms = await _db.Forms
            .Include(f => f.CreatedBy)
            .OrderByDescending(f => f.CreatedAt)
            .ToListAsync();

        return forms.Select(MapToDto).ToList();
    }

    public async Task<List<FormDto>> GetByUserAsync(Guid userId)
    {
        var forms = await _db.Forms
            .Include(f => f.CreatedBy)
            .Where(f => f.CreatedById == userId)
            .OrderByDescending(f => f.CreatedAt)
            .ToListAsync();

        return forms.Select(MapToDto).ToList();
    }

    public async Task<FormDetailDto?> GetByIdAsync(Guid id)
    {
        var form = await _db.Forms
            .Include(f => f.CreatedBy)
            .FirstOrDefaultAsync(f => f.Id == id);
        return form == null ? null : MapToDetailDto(form);
    }

    public async Task<FormDetailDto?> GetBySlugAsync(string slug)
    {
        var form = await _db.Forms
            .Include(f => f.CreatedBy)
            .FirstOrDefaultAsync(f => f.Slug == slug.ToLower() && f.Status == FormStatus.Active);
        return form == null ? null : MapToDetailDto(form);
    }

    public async Task<bool> SlugExistsAsync(string slug)
    {
        return await _db.Forms.AnyAsync(f => f.Slug == slug.ToLower());
    }

    public async Task<FormDto?> CreateAsync(CreateFormRequest request, Guid userId)
    {
        var slug = GenerateSlug(request.Title);
        
        var baseSlug = slug;
        var counter = 1;
        while (await _db.Forms.AnyAsync(f => f.Slug == slug))
        {
            slug = baseSlug + "-" + counter++;
        }

        var form = new Form
        {
            Id = Guid.NewGuid(),
            Title = request.Title,
            Description = request.Description,
            FieldsJson = request.FieldsJson ?? "[]",
            SettingsJson = request.SettingsJson ?? "{}",
            Slug = slug,
            Status = FormStatus.Draft,
            CreatedById = userId
        };

        _db.Forms.Add(form);
        await _db.SaveChangesAsync();

        // Reload with CreatedBy
        await _db.Entry(form).Reference(f => f.CreatedBy).LoadAsync();

        // Log activity
        await _activityService.LogAsync(
            AuditAction.FormCreated,
            userId,
            "Form",
            form.Id,
            null,
            new { title = form.Title, slug = form.Slug }
        );

        // Send email to all leaders
        var creatorName = form.CreatedBy?.Name ?? "A leader";
        var leaderEmails = await _db.Users
            .Where(u => u.Role == UserRole.Leader && u.Status == UserStatus.Active && u.Id != userId)
            .Select(u => u.Email)
            .ToListAsync();
        
        if (leaderEmails.Any())
        {
            await _emailService.SendFormCreatedEmailAsync(leaderEmails, creatorName, form.Title);
        }

        return MapToDto(form);
    }

    public async Task<FormDto?> UpdateAsync(Guid id, UpdateFormRequest request, Guid userId)
    {
        var form = await _db.Forms
            .Include(f => f.CreatedBy)
            .FirstOrDefaultAsync(f => f.Id == id);
        if (form == null) return null;

        var oldTitle = form.Title;

        if (!string.IsNullOrEmpty(request.Title))
            form.Title = request.Title;
        if (request.Description != null)
            form.Description = request.Description;
        if (request.FieldsJson != null)
            form.FieldsJson = request.FieldsJson;
        if (request.SettingsJson != null)
            form.SettingsJson = request.SettingsJson;

        form.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        // Get editor name
        var editor = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId);
        var editorName = editor?.Name ?? "A leader";

        // Send email to all leaders
        var leaderEmails = await _db.Users
            .Where(u => u.Role == UserRole.Leader && u.Status == UserStatus.Active && u.Id != userId)
            .Select(u => u.Email)
            .ToListAsync();
        
        if (leaderEmails.Any())
        {
            await _emailService.SendFormUpdatedEmailAsync(leaderEmails, editorName, form.Title);
        }

        return MapToDto(form);
    }

    public async Task<bool> DeleteAsync(Guid id, Guid userId)
    {
        var form = await _db.Forms.FirstOrDefaultAsync(f => f.Id == id);
        if (form == null) return false;

        var title = form.Title;
        
        // Get deleter name before deleting
        var deleter = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId);
        var deleterName = deleter?.Name ?? "A leader";

        // Get leader emails before deleting
        var leaderEmails = await _db.Users
            .Where(u => u.Role == UserRole.Leader && u.Status == UserStatus.Active && u.Id != userId)
            .Select(u => u.Email)
            .ToListAsync();

        _db.Forms.Remove(form);
        await _db.SaveChangesAsync();

        await _activityService.LogAsync(
            AuditAction.FormDeleted,
            userId,
            "Form",
            id,
            new { title },
            null
        );

        // Send email to all leaders
        if (leaderEmails.Any())
        {
            await _emailService.SendFormDeletedEmailAsync(leaderEmails, deleterName, title);
        }

        return true;
    }

    public async Task<bool> PublishAsync(Guid id, Guid userId)
    {
        var form = await _db.Forms.FirstOrDefaultAsync(f => f.Id == id);
        if (form == null) return false;

        form.Status = FormStatus.Active;
        form.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        await _activityService.LogAsync(
            AuditAction.FormPublished,
            userId,
            "Form",
            id,
            null,
            new { title = form.Title }
        );

        return true;
    }

    public async Task<bool> CloseAsync(Guid id, Guid userId)
    {
        var form = await _db.Forms.FirstOrDefaultAsync(f => f.Id == id);
        if (form == null) return false;

        form.Status = FormStatus.Closed;
        form.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        await _activityService.LogAsync(
            AuditAction.FormClosed,
            userId,
            "Form",
            id,
            null,
            new { title = form.Title }
        );

        return true;
    }

    public async Task<FormSubmissionDto?> SubmitAsync(string slug, SubmitFormRequest request, string? ipAddress, string? userAgent)
    {
        var form = await _db.Forms.FirstOrDefaultAsync(f => f.Slug == slug.ToLower() && f.Status == FormStatus.Active);
        if (form == null)
            return null;

        Member? member = null;
        try
        {
            var submissionData = JsonDocument.Parse(request.DataJson);
            
            // Parse the form field definitions to find field types
            var fieldDefinitions = new Dictionary<string, (string Type, string Label)>();
            try
            {
                var fieldsDoc = JsonDocument.Parse(form.FieldsJson ?? "[]");
                foreach (var field in fieldsDoc.RootElement.EnumerateArray())
                {
                    var fieldId = field.GetProperty("id").GetString();
                    var fieldType = field.GetProperty("type").GetString();
                    var fieldLabel = field.TryGetProperty("label", out var labelProp) ? labelProp.GetString() : "";
                    if (!string.IsNullOrEmpty(fieldId) && !string.IsNullOrEmpty(fieldType))
                    {
                        fieldDefinitions[fieldId] = (fieldType, fieldLabel ?? "");
                    }
                }
            }
            catch { }

            string? email = null;
            string? name = null;
            string? phone = null;

            // Match submission data to field types
            foreach (var prop in submissionData.RootElement.EnumerateObject())
            {
                var value = prop.Value.GetString();
                if (string.IsNullOrEmpty(value)) continue;

                var fieldId = prop.Name;
                
                if (fieldDefinitions.TryGetValue(fieldId, out var fieldInfo))
                {
                    var fieldType = fieldInfo.Type.ToLower();
                    var fieldLabel = fieldInfo.Label.ToLower();

                    if (fieldType == "email" && email == null)
                    {
                        email = value;
                    }
                    else if (fieldType == "phone" && phone == null)
                    {
                        phone = value;
                    }
                    else if (fieldType == "text" && name == null && 
                             (fieldLabel.Contains("name") || fieldLabel.Contains("full")))
                    {
                        name = value;
                    }
                }
            }

            if (!string.IsNullOrEmpty(email) && ValidationHelpers.IsValidEmail(email))
            {
                member = await _db.Members.FirstOrDefaultAsync(m => m.Email.ToLower() == email.ToLower());
                if (member == null)
                {
                    member = new Member
                    {
                        Id = Guid.NewGuid(),
                        Email = email.ToLower(),
                        Name = name,
                        Phone = phone,
                        MetadataJson = request.DataJson,
                        SourceFormId = form.Id,
                        UnsubscribeToken = Guid.NewGuid().ToString("N")
                    };
                    _db.Members.Add(member);
                }
                else
                {
                    if (!string.IsNullOrEmpty(name) && string.IsNullOrEmpty(member.Name))
                        member.Name = name;
                    if (!string.IsNullOrEmpty(phone) && string.IsNullOrEmpty(member.Phone))
                        member.Phone = phone;
                    member.UpdatedAt = DateTime.UtcNow;
                }
            }
        }
        catch { }

        var submission = new FormSubmission
        {
            Id = Guid.NewGuid(),
            FormId = form.Id,
            DataJson = request.DataJson,
            MemberId = member?.Id,
            IpAddress = ipAddress,
            UserAgent = userAgent
        };

        _db.FormSubmissions.Add(submission);
        
        form.SubmissionCount++;
        form.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        // Log activity
        await _activityService.LogAsync(
            AuditAction.FormSubmissionReceived,
            null,
            "Form",
            form.Id,
            null,
            new { formTitle = form.Title, email = member?.Email }
        );

        return new FormSubmissionDto
        {
            Id = submission.Id,
            DataJson = submission.DataJson,
            IpAddress = submission.IpAddress,
            CreatedAt = submission.CreatedAt,
            MemberId = member?.Id,
            MemberEmail = member?.Email
        };
    }

    public async Task<FormSubmissionListDto> GetSubmissionsAsync(Guid formId, int page = 1, int pageSize = 50)
    {
        var query = _db.FormSubmissions
            .Where(s => s.FormId == formId)
            .Include(s => s.Member)
            .OrderByDescending(s => s.CreatedAt);

        var totalCount = await query.CountAsync();
        
        var submissions = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new FormSubmissionListDto
        {
            Submissions = submissions.Select(s => new FormSubmissionDto
            {
                Id = s.Id,
                DataJson = s.DataJson,
                IpAddress = s.IpAddress,
                CreatedAt = s.CreatedAt,
                MemberId = s.MemberId,
                MemberEmail = s.Member?.Email
            }).ToList(),
            TotalCount = totalCount
        };
    }

    private FormDto MapToDto(Form form)
    {
        string? successMessage = null;
        string? redirectUrl = null;
        try
        {
            var settings = JsonDocument.Parse(form.SettingsJson ?? "{}");
            if (settings.RootElement.TryGetProperty("successMessage", out var sm))
                successMessage = sm.GetString();
            if (settings.RootElement.TryGetProperty("redirectUrl", out var ru))
                redirectUrl = ru.GetString();
        }
        catch { }

        return new FormDto
        {
            Id = form.Id,
            Title = form.Title,
            Description = form.Description,
            Slug = form.Slug,
            Status = form.Status.ToString(),
            SubmissionCount = form.SubmissionCount,
            SuccessMessage = successMessage,
            RedirectUrl = redirectUrl,
            CreatedById = form.CreatedById,
            CreatedByName = form.CreatedBy?.Name ?? "",
            CreatedAt = form.CreatedAt,
            UpdatedAt = form.UpdatedAt
        };
    }

    private FormDetailDto MapToDetailDto(Form form)
    {
        var dto = MapToDto(form);
        return new FormDetailDto
        {
            Id = dto.Id,
            Title = dto.Title,
            Description = dto.Description,
            Slug = dto.Slug,
            Status = dto.Status,
            SubmissionCount = dto.SubmissionCount,
            SuccessMessage = dto.SuccessMessage,
            RedirectUrl = dto.RedirectUrl,
            CreatedById = dto.CreatedById,
            CreatedByName = dto.CreatedByName,
            CreatedAt = dto.CreatedAt,
            UpdatedAt = dto.UpdatedAt,
            FieldsJson = form.FieldsJson ?? "[]",
            SettingsJson = form.SettingsJson
        };
    }

    private string GenerateSlug(string title)
    {
        return title.ToLower()
            .Replace(" ", "-")
            .Replace("_", "-")
            .Where(c => char.IsLetterOrDigit(c) || c == '-')
            .Aggregate("", (current, c) => current + c)
            .Trim('-');
    }
}
