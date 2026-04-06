using Microsoft.EntityFrameworkCore;
using Synod.Api.Data;
using Synod.Api.Infrastructure.Auth;
using Synod.Api.Models;
using Synod.Api.Models.Entities;

namespace Synod.Api.Data;

public static class DatabaseSeeder
{
    public static async Task SeedAsync(SynodDbContext db, IPasswordHasher hasher)
    {
        if (await db.Users.AnyAsync())
            return;

        var superAdmin = new User
        {
            Id = Guid.NewGuid(),
            Email = "admin@synod.dev",
            Name = "Super Admin",
            PasswordHash = hasher.Hash("Admin123!"),
            Role = UserRole.SuperAdmin,
            Status = UserStatus.Active
        };

        db.Users.Add(superAdmin);
        await db.SaveChangesAsync();

        Console.WriteLine("=================================");
        Console.WriteLine("Super Admin seeded:");
        Console.WriteLine("Email: admin@synod.dev");
        Console.WriteLine("Password: Admin123!");
        Console.WriteLine("=================================");
    }
}
