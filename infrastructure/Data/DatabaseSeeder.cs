using AssignmentSystem.Core.Entities;
using AssignmentSystem.Core.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace AssignmentSystem.Infrastructure.Data
{
    public static class DatabaseSeeder
    {
        public static async Task SeedAsync(ApplicationDbContext context, IPasswordHasherService passwordHasher)
        {
            // Only seed if no users exist
            if (await context.Users.AnyAsync())
            {
                return;
            }

            var users = new List<User>
            {
                new User
                {
                    Id = Guid.NewGuid(),
                    Name = "Admin User",
                    Email = "admin@example.com".Trim().ToLowerInvariant(),
                    PasswordHash = passwordHasher.HashPassword("Admin@123!"),
                    Role = "Admin",
                    IsActive = true,
                    CreatedAt = DateTimeOffset.UtcNow
                },
                new User
                {
                    Id = Guid.NewGuid(),
                    Name = "Teacher Demo",
                    Email = "teacher@example.com".Trim().ToLowerInvariant(),
                    PasswordHash = passwordHasher.HashPassword("Teacher@123!"),
                    Role = "Teacher",
                    IsActive = true,
                    CreatedAt = DateTimeOffset.UtcNow
                },
                new User
                {
                    Id = Guid.NewGuid(),
                    Name = "Student Demo",
                    Email = "student@example.com".Trim().ToLowerInvariant(),
                    PasswordHash = passwordHasher.HashPassword("Student@123!"),
                    Role = "Student",
                    IsActive = true,
                    CreatedAt = DateTimeOffset.UtcNow
                }
            };

            await context.Users.AddRangeAsync(users);
            await context.SaveChangesAsync();
        }
    }
}
