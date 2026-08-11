using AssignmentSystem.Core.Entities;
using AssignmentSystem.Core.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace AssignmentSystem.Infrastructure.Data
{
    public static class DatabaseSeeder
    {
        public static async Task SeedAsync(ApplicationDbContext context, IPasswordHasherService passwordHasher)
        {
            User admin = null;
            User teacher = null;
            User student = null;

            if (!await context.Users.AnyAsync())
            {
                admin = new User
                {
                    Id = Guid.NewGuid(),
                    Name = "Admin User",
                    Email = "admin@example.com".Trim().ToLowerInvariant(),
                    PasswordHash = passwordHasher.HashPassword("Admin@123!"),
                    Role = "Admin",
                    IsActive = true,
                    CreatedAt = DateTimeOffset.UtcNow
                };

                teacher = new User
                {
                    Id = Guid.NewGuid(),
                    Name = "Teacher Demo",
                    Email = "teacher@example.com".Trim().ToLowerInvariant(),
                    PasswordHash = passwordHasher.HashPassword("Teacher@123!"),
                    Role = "Teacher",
                    IsActive = true,
                    CreatedAt = DateTimeOffset.UtcNow
                };

                student = new User
                {
                    Id = Guid.NewGuid(),
                    Name = "Student Demo",
                    Email = "student@example.com".Trim().ToLowerInvariant(),
                    PasswordHash = passwordHasher.HashPassword("Student@123!"),
                    Role = "Student",
                    IsActive = true,
                    CreatedAt = DateTimeOffset.UtcNow
                };

                await context.Users.AddRangeAsync(admin, teacher, student);
                await context.SaveChangesAsync();
            }
            else
            {
                teacher = await context.Users.FirstOrDefaultAsync(u => u.Email == "teacher@example.com");
                student = await context.Users.FirstOrDefaultAsync(u => u.Email == "student@example.com");
            }

            if (!await context.Classes.AnyAsync() && teacher != null && student != null)
            {
                var mathClass = new Class { Id = Guid.NewGuid(), Name = "Year 10 Mathematics", Code = "Y10-MATH", Description = "Advanced Mathematics for Year 10" };
                var scienceClass = new Class { Id = Guid.NewGuid(), Name = "Year 10 Science", Code = "Y10-SCI", Description = "General Science for Year 10" };
                
                await context.Classes.AddRangeAsync(mathClass, scienceClass);

                var algebra = new Subject { Id = Guid.NewGuid(), Name = "Algebra", Code = "ALG101", Description = "Basic Algebra" };
                var physics = new Subject { Id = Guid.NewGuid(), Name = "Physics", Code = "PHY101", Description = "Introductory Physics" };
                
                await context.Subjects.AddRangeAsync(algebra, physics);

                var teacherAssignment = new TeacherAssignment
                {
                    Id = Guid.NewGuid(),
                    TeacherId = teacher.Id,
                    ClassId = mathClass.Id,
                    SubjectId = algebra.Id
                };

                await context.TeacherAssignments.AddAsync(teacherAssignment);

                var studentEnrollment = new StudentClass
                {
                    StudentId = student.Id,
                    ClassId = mathClass.Id
                };

                await context.StudentClasses.AddAsync(studentEnrollment);

                await context.SaveChangesAsync();
            }
        }
    }
}
