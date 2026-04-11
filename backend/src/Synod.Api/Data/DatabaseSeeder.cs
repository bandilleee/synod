using Microsoft.EntityFrameworkCore;
using Synod.Api.Infrastructure.Auth;
using Synod.Api.Models;
using Synod.Api.Models.Entities;

namespace Synod.Api.Data;

public static class DatabaseSeeder
{
    public static async Task SeedAsync(SynodDbContext db, IPasswordHasher hasher)
    {
        // Apply any pending migrations
        await db.Database.MigrateAsync();

        // Check if admin already exists
        var adminExists = await db.Users.AnyAsync(u => u.Role == UserRole.SuperAdmin);
        if (adminExists) return;

        // Create Super Admin
        var admin = new User
        {
            Id = Guid.NewGuid(),
            Email = "bandiillleee@gmail.com",
            Name = "Bandile",
            PasswordHash = hasher.Hash("@$Banzzii00"),
            Role = UserRole.SuperAdmin,
            Status = UserStatus.Active,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        db.Users.Add(admin);
        await db.SaveChangesAsync();

        Console.WriteLine("=================================");
        Console.WriteLine("Super Admin seeded:");
        Console.WriteLine($"Email: {admin.Email}");
        Console.WriteLine("Password: @$Banzzii00");
        Console.WriteLine("=================================");
    }
}
