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

namespace AssignmentSystem.Tests.Submission
{
    public class SubmissionServiceTests : IDisposable
    {
        private readonly ApplicationDbContext _context;
        private readonly SubmissionService _submissionService;
        private readonly Mock<ILogger<SubmissionService>> _mockLogger;

        public SubmissionServiceTests()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _context = new ApplicationDbContext(options);
            _mockLogger = new Mock<ILogger<SubmissionService>>();
            _submissionService = new SubmissionService(_context, _mockLogger.Object);
        }

        public void Dispose()
        {
            _context.Database.EnsureDeleted();
            _context.Dispose();
        }

        private async Task SeedDataAsync(Guid teacherId, Guid studentId, Guid classId, Guid assignmentId, DateTimeOffset deadline, AssignmentStatus status, bool isEnrolled)
        {
            _context.Users.Add(new User { Id = teacherId, Name = "Teacher", Email = "teacher@test.com", Role = "Teacher", PasswordHash = "hash" });
            _context.Users.Add(new User { Id = studentId, Name = "Student", Email = "student@test.com", Role = "Student", PasswordHash = "hash" });
            
            _context.Classes.Add(new Class { Id = classId, Name = "Class 1", Code = "C1" });
            
            if (isEnrolled)
            {
                _context.StudentClasses.Add(new StudentClass
                {
                    StudentId = studentId,
                    ClassId = classId
                });
            }

            _context.Assignments.Add(new Core.Entities.Assignment
            {
                Id = assignmentId,
                Title = "Test Assignment",
                ClassId = classId,
                TeacherId = teacherId,
                Deadline = deadline,
                Status = status,
                MaximumMarks = 100
            });

            await _context.SaveChangesAsync();
        }

        [Fact]
        public async Task SubmitAnswer_BeforeDeadline_CreatesSubmission()
        {
            // Arrange
            var teacherId = Guid.NewGuid();
            var studentId = Guid.NewGuid();
            var classId = Guid.NewGuid();
            var assignmentId = Guid.NewGuid();
            
            await SeedDataAsync(teacherId, studentId, classId, assignmentId, DateTimeOffset.UtcNow.AddDays(1), AssignmentStatus.Published, isEnrolled: true);

            var dto = new CreateSubmissionDto(assignmentId, "My Answer");

            // Act
            var result = await _submissionService.SubmitAnswerAsync(studentId, dto);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("My Answer", result.Answer);
            Assert.Single(_context.Submissions);
        }

        [Fact]
        public async Task SubmitAnswer_AfterDeadline_ThrowsArgumentException()
        {
            // Arrange
            var teacherId = Guid.NewGuid();
            var studentId = Guid.NewGuid();
            var classId = Guid.NewGuid();
            var assignmentId = Guid.NewGuid();
            
            // Deadline in the past
            await SeedDataAsync(teacherId, studentId, classId, assignmentId, DateTimeOffset.UtcNow.AddDays(-1), AssignmentStatus.Published, isEnrolled: true);

            var dto = new CreateSubmissionDto(assignmentId, "My Answer");

            // Act & Assert
            await Assert.ThrowsAsync<ArgumentException>(() => _submissionService.SubmitAnswerAsync(studentId, dto));
        }

        [Fact]
        public async Task SubmitAnswer_NotEnrolledInClass_ThrowsUnauthorizedAccessException()
        {
            // Arrange
            var teacherId = Guid.NewGuid();
            var studentId = Guid.NewGuid();
            var classId = Guid.NewGuid();
            var assignmentId = Guid.NewGuid();
            
            // Not enrolled
            await SeedDataAsync(teacherId, studentId, classId, assignmentId, DateTimeOffset.UtcNow.AddDays(1), AssignmentStatus.Published, isEnrolled: false);

            var dto = new CreateSubmissionDto(assignmentId, "My Answer");

            // Act & Assert
            await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _submissionService.SubmitAnswerAsync(studentId, dto));
        }

        [Fact]
        public async Task SubmitAnswer_DraftAssignment_ThrowsInvalidOperationException()
        {
            // Arrange
            var teacherId = Guid.NewGuid();
            var studentId = Guid.NewGuid();
            var classId = Guid.NewGuid();
            var assignmentId = Guid.NewGuid();
            
            // Status Draft
            await SeedDataAsync(teacherId, studentId, classId, assignmentId, DateTimeOffset.UtcNow.AddDays(1), AssignmentStatus.Draft, isEnrolled: true);

            var dto = new CreateSubmissionDto(assignmentId, "My Answer");

            // Act & Assert
            await Assert.ThrowsAsync<InvalidOperationException>(() => _submissionService.SubmitAnswerAsync(studentId, dto));
        }

        [Fact]
        public async Task UpdateSubmission_OtherStudent_ThrowsUnauthorizedAccessException()
        {
            // Arrange
            var teacherId = Guid.NewGuid();
            var studentId1 = Guid.NewGuid();
            var studentId2 = Guid.NewGuid(); // Another student trying to update
            var classId = Guid.NewGuid();
            var assignmentId = Guid.NewGuid();
            
            await SeedDataAsync(teacherId, studentId1, classId, assignmentId, DateTimeOffset.UtcNow.AddDays(1), AssignmentStatus.Published, isEnrolled: true);

            var submissionId = Guid.NewGuid();
            _context.Submissions.Add(new Core.Entities.Submission
            {
                Id = submissionId,
                AssignmentId = assignmentId,
                StudentId = studentId1, // Belongs to student 1
                Answer = "Old Answer"
            });
            await _context.SaveChangesAsync();

            var updateDto = new UpdateSubmissionDto("New Answer");

            // Act & Assert
            await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _submissionService.UpdateSubmissionAsync(studentId2, submissionId, updateDto));
        }

        // --- GRADING TESTS ---

        [Fact]
        public async Task GradeSubmission_ValidTeacher_MarksGraded()
        {
            // Arrange
            var teacherId = Guid.NewGuid();
            var studentId = Guid.NewGuid();
            var classId = Guid.NewGuid();
            var assignmentId = Guid.NewGuid();
            
            await SeedDataAsync(teacherId, studentId, classId, assignmentId, DateTimeOffset.UtcNow.AddDays(1), AssignmentStatus.Published, isEnrolled: true);

            var submissionId = Guid.NewGuid();
            _context.Submissions.Add(new Core.Entities.Submission
            {
                Id = submissionId,
                AssignmentId = assignmentId,
                StudentId = studentId,
                Status = SubmissionStatus.Submitted
            });
            await _context.SaveChangesAsync();

            var gradeDto = new GradeSubmissionDto(85, "Good job");

            // Act
            var result = await _submissionService.GradeSubmissionAsync(teacherId, submissionId, gradeDto);

            // Assert
            Assert.Equal(85, result.Marks);
            Assert.Equal("Good job", result.Feedback);
            Assert.Equal(SubmissionStatus.Graded, result.Status);
        }

        [Fact]
        public async Task GradeSubmission_WrongTeacher_ThrowsUnauthorizedAccessException()
        {
            // Arrange
            var teacherId = Guid.NewGuid();
            var wrongTeacherId = Guid.NewGuid();
            var studentId = Guid.NewGuid();
            var classId = Guid.NewGuid();
            var assignmentId = Guid.NewGuid();
            
            await SeedDataAsync(teacherId, studentId, classId, assignmentId, DateTimeOffset.UtcNow.AddDays(1), AssignmentStatus.Published, isEnrolled: true);

            var submissionId = Guid.NewGuid();
            _context.Submissions.Add(new Core.Entities.Submission
            {
                Id = submissionId,
                AssignmentId = assignmentId,
                StudentId = studentId
            });
            await _context.SaveChangesAsync();

            var gradeDto = new GradeSubmissionDto(85, "Good job");

            // Act & Assert
            await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _submissionService.GradeSubmissionAsync(wrongTeacherId, submissionId, gradeDto));
        }

        [Fact]
        public async Task GradeSubmission_NegativeMarks_ThrowsArgumentException()
        {
            // Arrange
            var teacherId = Guid.NewGuid();
            var studentId = Guid.NewGuid();
            var classId = Guid.NewGuid();
            var assignmentId = Guid.NewGuid();
            
            await SeedDataAsync(teacherId, studentId, classId, assignmentId, DateTimeOffset.UtcNow.AddDays(1), AssignmentStatus.Published, isEnrolled: true);

            var submissionId = Guid.NewGuid();
            _context.Submissions.Add(new Core.Entities.Submission
            {
                Id = submissionId,
                AssignmentId = assignmentId,
                StudentId = studentId
            });
            await _context.SaveChangesAsync();

            var gradeDto = new GradeSubmissionDto(-5, "Bad");

            // Act & Assert
            await Assert.ThrowsAsync<ArgumentException>(() => _submissionService.GradeSubmissionAsync(teacherId, submissionId, gradeDto));
        }

        [Fact]
        public async Task GradeSubmission_ExceedsMaxMarks_ThrowsArgumentException()
        {
            // Arrange
            var teacherId = Guid.NewGuid();
            var studentId = Guid.NewGuid();
            var classId = Guid.NewGuid();
            var assignmentId = Guid.NewGuid();
            
            await SeedDataAsync(teacherId, studentId, classId, assignmentId, DateTimeOffset.UtcNow.AddDays(1), AssignmentStatus.Published, isEnrolled: true); // max marks = 100

            var submissionId = Guid.NewGuid();
            _context.Submissions.Add(new Core.Entities.Submission
            {
                Id = submissionId,
                AssignmentId = assignmentId,
                StudentId = studentId
            });
            await _context.SaveChangesAsync();

            var gradeDto = new GradeSubmissionDto(105, "Too good");

            // Act & Assert
            await Assert.ThrowsAsync<ArgumentException>(() => _submissionService.GradeSubmissionAsync(teacherId, submissionId, gradeDto));
        }
    }
}
