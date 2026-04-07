namespace Synod.Api.Models.Requests;

public class CreateNewsletterRequest
{
    public string Title { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string? PreviewText { get; set; }
    public string? ContentJson { get; set; }
}

public class UpdateNewsletterRequest
{
    public string? Title { get; set; }
    public string? Subject { get; set; }
    public string? PreviewText { get; set; }
    public string? ContentJson { get; set; }
    public string? HtmlContent { get; set; }
}

public class SendTestEmailRequest
{
    public string Email { get; set; } = string.Empty;
}
