using System;
using System.Linq;
using System.Threading.Tasks;
using AssignmentSystem.Core.DTOs;
using AssignmentSystem.Core.Entities;
using AssignmentSystem.Core.Enums;
using AssignmentSystem.Infrastructure.Data;
using AssignmentSystem.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace AssignmentSystem.Tests.Assignment
{
    public class AssignmentServiceTests : IDisposable
    {
        private readonly ApplicationDbContext _context;
        private readonly AssignmentService _assignmentService;
        private readonly Mock<ILogger<AssignmentService>> _mockLogger;

        public AssignmentServiceTests()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _context = new ApplicationDbContext(options);
            _mockLogger = new Mock<ILogger<AssignmentService>>();
            _assignmentService = new AssignmentService(_context, _mockLogger.Object);
        }

        public void Dispose()
        {
            _context.Database.EnsureDeleted();
            _context.Dispose();
        }

        private async Task SeedDataAsync(Guid teacherId, Guid classId, Guid subjectId, bool isAssigned)
        {
            _context.Users.Add(new User { Id = teacherId, Name = "Teacher", Email = "teacher@test.com", Role = "Teacher", PasswordHash = "hash" });
            _context.Classes.Add(new Class { Id = classId, Name = "Class 1", Code = "C1" });
            _context.Subjects.Add(new Subject { Id = subjectId, Name = "Subject 1", Code = "S1" });

            if (isAssigned)
            {
                _context.TeacherAssignments.Add(new TeacherAssignment
                {
                    Id = Guid.NewGuid(),
                    TeacherId = teacherId,
                    ClassId = classId,
                    SubjectId = subjectId
                });
            }

            await _context.SaveChangesAsync();
        }

        [Fact]
        public async Task CreateAssignment_ValidData_CreatesAssignment()
        {
            // Arrange
            var teacherId = Guid.NewGuid();
            var classId = Guid.NewGuid();
            var subjectId = Guid.NewGuid();
            await SeedDataAsync(teacherId, classId, subjectId, isAssigned: true);

            var dto = new CreateAssignmentDto("Test Title", "Test Desc", classId, subjectId, DateTimeOffset.UtcNow.AddDays(7), 100);

            // Act
            var result = await _assignmentService.CreateAssignmentAsync(teacherId, dto);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("Test Title", result.Title);
            Assert.Equal(AssignmentStatus.Draft, result.Status);
            Assert.Single(_context.Assignments);
        }

        [Fact]
        public async Task CreateAssignment_UnauthorizedClassSubject_ThrowsUnauthorizedAccessException()
        {
            // Arrange
            var teacherId = Guid.NewGuid();
            var classId = Guid.NewGuid();
            var subjectId = Guid.NewGuid();
            await SeedDataAsync(teacherId, classId, subjectId, isAssigned: false);

            var dto = new CreateAssignmentDto("Test", "Desc", classId, subjectId, DateTimeOffset.UtcNow.AddDays(7), 100);

            // Act & Assert
            await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _assignmentService.CreateAssignmentAsync(teacherId, dto));
        }

        [Fact]
        public async Task UpdateAssignment_OwnAssignment_Success()
        {
            // Arrange
            var teacherId = Guid.NewGuid();
            var classId = Guid.NewGuid();
            var subjectId = Guid.NewGuid();
            await SeedDataAsync(teacherId, classId, subjectId, isAssigned: true);

            var assignment = new Core.Entities.Assignment
            {
                Id = Guid.NewGuid(),
                Title = "Old",
                ClassId = classId,
                SubjectId = subjectId,
                TeacherId = teacherId,
                MaximumMarks = 100,
                Deadline = DateTimeOffset.UtcNow.AddDays(1)
            };
            _context.Assignments.Add(assignment);
            await _context.SaveChangesAsync();

            var updateDto = new UpdateAssignmentDto("New Title", "New Desc", DateTimeOffset.UtcNow.AddDays(2), 50);

            // Act
            var result = await _assignmentService.UpdateAssignmentAsync(teacherId, assignment.Id, updateDto);

            // Assert
            Assert.Equal("New Title", result.Title);
            Assert.Equal(50, result.MaximumMarks);
        }

        [Fact]
        public async Task UpdateAssignment_OtherTeachersAssignment_ThrowsUnauthorizedAccessException()
        {
            // Arrange
            var teacherId1 = Guid.NewGuid();
            var teacherId2 = Guid.NewGuid();
            var assignment = new Core.Entities.Assignment
            {
                Id = Guid.NewGuid(),
                TeacherId = teacherId1,
                MaximumMarks = 100,
                Deadline = DateTimeOffset.UtcNow.AddDays(1)
            };
            _context.Assignments.Add(assignment);
            await _context.SaveChangesAsync();

            var updateDto = new UpdateAssignmentDto("Title", "Desc", DateTimeOffset.UtcNow.AddDays(2), 50);

            // Act & Assert
            await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _assignmentService.UpdateAssignmentAsync(teacherId2, assignment.Id, updateDto));
        }

        [Fact]
        public async Task PublishAssignment_ValidDraft_BecomesPublished()
        {
            // Arrange
            var teacherId = Guid.NewGuid();
            var classId = Guid.NewGuid();
            var subjectId = Guid.NewGuid();
            await SeedDataAsync(teacherId, classId, subjectId, isAssigned: true);

            var assignment = new Core.Entities.Assignment
            {
                Id = Guid.NewGuid(),
                Title = "Draft Assignment",
                ClassId = classId,
                SubjectId = subjectId,
                TeacherId = teacherId,
                MaximumMarks = 100,
                Deadline = DateTimeOffset.UtcNow.AddDays(1),
                Status = AssignmentStatus.Draft
            };
            _context.Assignments.Add(assignment);
            await _context.SaveChangesAsync();

            // Act
            var result = await _assignmentService.PublishAssignmentAsync(teacherId, assignment.Id);

            // Assert
            Assert.Equal(AssignmentStatus.Published, result.Status);
        }
    }
}
