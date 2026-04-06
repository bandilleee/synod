namespace Synod.Api.Models.Entities;

/// <summary>
/// Pre-built newsletter templates that leaders can use.
/// </summary>
public class NewsletterTemplate : BaseEntity
{
    /// <summary>
    /// Template name.
    /// </summary>
    public string Name { get; set; } = string.Empty;
    
    /// <summary>
    /// Template description.
    /// </summary>
    public string? Description { get; set; }
    
    /// <summary>
    /// Thumbnail preview image URL.
    /// </summary>
    public string? ThumbnailUrl { get; set; }
    
    /// <summary>
    /// Template content as JSON (TipTap format).
    /// </summary>
    public string ContentJson { get; set; } = string.Empty;
    
    /// <summary>
    /// Whether this template is available for use.
    /// </summary>
    public bool IsActive { get; set; } = true;
    
    /// <summary>
    /// Display order in template picker.
    /// </summary>
    public int SortOrder { get; set; }
}
