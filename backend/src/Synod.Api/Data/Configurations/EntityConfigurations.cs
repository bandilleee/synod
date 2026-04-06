using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Synod.Api.Models.Entities;

namespace Synod.Api.Data.Configurations;

public class OrganizationConfiguration : IEntityTypeConfiguration<Organization>
{
    public void Configure(EntityTypeBuilder<Organization> builder)
    {
        builder.HasIndex(x => x.Slug).IsUnique();
        builder.Property(x => x.Name).HasMaxLength(200).IsRequired();
        builder.Property(x => x.Slug).HasMaxLength(200).IsRequired();
    }
}

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.HasIndex(x => x.Email).IsUnique();
        builder.Property(x => x.Email).HasMaxLength(255).IsRequired();
        builder.Property(x => x.Name).HasMaxLength(200).IsRequired();
        
        builder.HasOne(x => x.Organization)
            .WithMany(x => x.Users)
            .HasForeignKey(x => x.OrganizationId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}

public class InvitationConfiguration : IEntityTypeConfiguration<Invitation>
{
    public void Configure(EntityTypeBuilder<Invitation> builder)
    {
        builder.HasIndex(x => x.Token).IsUnique();
        builder.HasIndex(x => new { x.Email, x.OrganizationId });
        builder.Property(x => x.Email).HasMaxLength(255).IsRequired();
        
        builder.HasOne(x => x.Organization)
            .WithMany(x => x.Invitations)
            .HasForeignKey(x => x.OrganizationId)
            .OnDelete(DeleteBehavior.Cascade);
            
        builder.HasOne(x => x.InvitedBy)
            .WithMany(x => x.SentInvitations)
            .HasForeignKey(x => x.InvitedById)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class MemberConfiguration : IEntityTypeConfiguration<Member>
{
    public void Configure(EntityTypeBuilder<Member> builder)
    {
        builder.HasIndex(x => x.Email).IsUnique();
        builder.HasIndex(x => x.UnsubscribeToken).IsUnique();
        builder.Property(x => x.Email).HasMaxLength(255).IsRequired();
        
        builder.HasOne(x => x.SourceForm)
            .WithMany(x => x.SourcedMembers)
            .HasForeignKey(x => x.SourceFormId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}

public class NewsletterConfiguration : IEntityTypeConfiguration<Newsletter>
{
    public void Configure(EntityTypeBuilder<Newsletter> builder)
    {
        builder.Property(x => x.Title).HasMaxLength(300).IsRequired();
        builder.Property(x => x.Subject).HasMaxLength(300).IsRequired();
        
        builder.HasOne(x => x.CreatedBy)
            .WithMany(x => x.Newsletters)
            .HasForeignKey(x => x.CreatedById)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class NewsletterRecipientConfiguration : IEntityTypeConfiguration<NewsletterRecipient>
{
    public void Configure(EntityTypeBuilder<NewsletterRecipient> builder)
    {
        builder.HasIndex(x => new { x.NewsletterId, x.MemberId }).IsUnique();
        
        builder.HasOne(x => x.Newsletter)
            .WithMany(x => x.Recipients)
            .HasForeignKey(x => x.NewsletterId)
            .OnDelete(DeleteBehavior.Cascade);
            
        builder.HasOne(x => x.Member)
            .WithMany(x => x.NewsletterRecipients)
            .HasForeignKey(x => x.MemberId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class FormConfiguration : IEntityTypeConfiguration<Form>
{
    public void Configure(EntityTypeBuilder<Form> builder)
    {
        builder.HasIndex(x => x.Slug).IsUnique();
        builder.Property(x => x.Title).HasMaxLength(300).IsRequired();
        builder.Property(x => x.Slug).HasMaxLength(200).IsRequired();
        
        builder.HasOne(x => x.CreatedBy)
            .WithMany(x => x.Forms)
            .HasForeignKey(x => x.CreatedById)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class FormSubmissionConfiguration : IEntityTypeConfiguration<FormSubmission>
{
    public void Configure(EntityTypeBuilder<FormSubmission> builder)
    {
        builder.HasOne(x => x.Form)
            .WithMany(x => x.Submissions)
            .HasForeignKey(x => x.FormId)
            .OnDelete(DeleteBehavior.Cascade);
            
        builder.HasOne(x => x.Member)
            .WithMany(x => x.FormSubmissions)
            .HasForeignKey(x => x.MemberId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}

public class EventConfiguration : IEntityTypeConfiguration<Event>
{
    public void Configure(EntityTypeBuilder<Event> builder)
    {
        builder.Property(x => x.Title).HasMaxLength(300).IsRequired();
        
        builder.HasOne(x => x.CreatedBy)
            .WithMany(x => x.Events)
            .HasForeignKey(x => x.CreatedById)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class EventApprovalConfiguration : IEntityTypeConfiguration<EventApproval>
{
    public void Configure(EntityTypeBuilder<EventApproval> builder)
    {
        builder.HasIndex(x => new { x.EventId, x.UserId }).IsUnique();
        
        builder.HasOne(x => x.Event)
            .WithMany(x => x.Approvals)
            .HasForeignKey(x => x.EventId)
            .OnDelete(DeleteBehavior.Cascade);
            
        builder.HasOne(x => x.User)
            .WithMany(x => x.EventApprovals)
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class AuditLogConfiguration : IEntityTypeConfiguration<AuditLog>
{
    public void Configure(EntityTypeBuilder<AuditLog> builder)
    {
        builder.HasIndex(x => x.CreatedAt);
        builder.HasIndex(x => x.UserId);
        builder.HasIndex(x => new { x.EntityType, x.EntityId });
        
        builder.HasOne(x => x.User)
            .WithMany(x => x.AuditLogs)
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
