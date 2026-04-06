using Microsoft.EntityFrameworkCore;
using Synod.Api.Data;
using Synod.Api.Models;
using Synod.Api.Models.Entities;
using Synod.Api.Models.Requests;
using Synod.Api.Models.Responses;

namespace Synod.Api.Services;

public interface IFormService
{
    Task<List<FormDto>> GetAllAsync();
    Task<List<FormDto>> GetByUserAsync(Guid userId);
    Task<FormDetailDto?> GetByIdAsync(Guid id);
    Task<FormDetailDto?> GetBySlugAsync(string slug);
    Task<FormDto?> CreateAsync(CreateFormRequest request, Guid userId);
    Task<FormDto?> UpdateAsync(Guid id, UpdateFormRequest request);
    Task<bool> PublishAsync(Guid id);
    Task<bool> CloseAsync(Guid id);
    Task<bool> DeleteAsync(Guid id);
    Task<bool> SlugExistsAsync(string slug);
    Task<FormSubmissionDto?> SubmitAsync(string slug, SubmitFormRequest request, string? ipAddress, string? userAgent);
    Task<FormSubmissionListDto> GetSubmissionsAsync(Guid formId, int page = 1, int pageSize = 20);
}

public class FormService : IFormService
{
    private readonly SynodDbContext _db;

    public FormService(SynodDbContext db)
    {
        _db = db;
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

    public async Task<FormDto?> CreateAsync(CreateFormRequest request, Guid userId)
    {
        if (await SlugExistsAsync(request.Slug))
            return null;

        var form = new Form
        {
            Id = Guid.NewGuid(),
            Title = request.Title,
            Description = request.Description,
            Slug = request.Slug.ToLower(),
            FieldsJson = request.FieldsJson,
            SettingsJson = request.SettingsJson,
            SuccessMessage = request.SuccessMessage,
            RedirectUrl = request.RedirectUrl,
            Status = FormStatus.Draft,
            CreatedById = userId
        };

        _db.Forms.Add(form);
        await _db.SaveChangesAsync();

        var user = await _db.Users.FindAsync(userId);
        form.CreatedBy = user!;

        return MapToDto(form);
    }

    public async Task<FormDto?> UpdateAsync(Guid id, UpdateFormRequest request)
    {
        var form = await _db.Forms
            .Include(f => f.CreatedBy)
            .FirstOrDefaultAsync(f => f.Id == id);

        if (form == null)
            return null;

        form.Title = request.Title;
        form.Description = request.Description;
        form.FieldsJson = request.FieldsJson;
        form.SettingsJson = request.SettingsJson;
        form.SuccessMessage = request.SuccessMessage;
        form.RedirectUrl = request.RedirectUrl;

        await _db.SaveChangesAsync();
        return MapToDto(form);
    }

    public async Task<bool> PublishAsync(Guid id)
    {
        var form = await _db.Forms.FindAsync(id);
        if (form == null)
            return false;

        form.Status = FormStatus.Active;
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> CloseAsync(Guid id)
    {
        var form = await _db.Forms.FindAsync(id);
        if (form == null)
            return false;

        form.Status = FormStatus.Closed;
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var form = await _db.Forms.FindAsync(id);
        if (form == null)
            return false;

        _db.Forms.Remove(form);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> SlugExistsAsync(string slug)
    {
        return await _db.Forms.AnyAsync(f => f.Slug == slug.ToLower());
    }

    public async Task<FormSubmissionDto?> SubmitAsync(string slug, SubmitFormRequest request, string? ipAddress, string? userAgent)
    {
        var form = await _db.Forms.FirstOrDefaultAsync(f => f.Slug == slug.ToLower() && f.Status == FormStatus.Active);
        if (form == null)
            return null;

        var submission = new FormSubmission
        {
            Id = Guid.NewGuid(),
            FormId = form.Id,
            DataJson = request.DataJson,
            IpAddress = ipAddress,
            UserAgent = userAgent
        };

        _db.FormSubmissions.Add(submission);
        form.SubmissionCount++;
        await _db.SaveChangesAsync();

        return new FormSubmissionDto
        {
            Id = submission.Id,
            DataJson = submission.DataJson,
            IpAddress = submission.IpAddress,
            CreatedAt = submission.CreatedAt
        };
    }

    public async Task<FormSubmissionListDto> GetSubmissionsAsync(Guid formId, int page = 1, int pageSize = 20)
    {
        var query = _db.FormSubmissions
            .Where(s => s.FormId == formId)
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
                MemberId = s.MemberId
            }).ToList(),
            TotalCount = totalCount
        };
    }

    private static FormDto MapToDto(Form form)
    {
        return new FormDto
        {
            Id = form.Id,
            Title = form.Title,
            Description = form.Description,
            Slug = form.Slug,
            Status = form.Status.ToString(),
            SubmissionCount = form.SubmissionCount,
            SuccessMessage = form.SuccessMessage,
            RedirectUrl = form.RedirectUrl,
            CreatedById = form.CreatedById,
            CreatedByName = form.CreatedBy?.Name ?? "Unknown",
            CreatedAt = form.CreatedAt,
            UpdatedAt = form.UpdatedAt
        };
    }

    private static FormDetailDto MapToDetailDto(Form form)
    {
        return new FormDetailDto
        {
            Id = form.Id,
            Title = form.Title,
            Description = form.Description,
            Slug = form.Slug,
            Status = form.Status.ToString(),
            SubmissionCount = form.SubmissionCount,
            SuccessMessage = form.SuccessMessage,
            RedirectUrl = form.RedirectUrl,
            CreatedById = form.CreatedById,
            CreatedByName = form.CreatedBy?.Name ?? "Unknown",
            CreatedAt = form.CreatedAt,
            UpdatedAt = form.UpdatedAt,
            FieldsJson = form.FieldsJson,
            SettingsJson = form.SettingsJson
        };
    }
}
