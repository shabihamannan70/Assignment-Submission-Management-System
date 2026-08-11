using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using AssignmentSystem.Core.DTOs;
using AssignmentSystem.Core.Entities;
using AssignmentSystem.Core.Enums;
using AssignmentSystem.Core.Interfaces;
using AssignmentSystem.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace AssignmentSystem.Infrastructure.Services
{
    public class SubmissionService : ISubmissionService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<SubmissionService> _logger;

        public SubmissionService(ApplicationDbContext context, ILogger<SubmissionService> logger)
        {
            _context = context;
            _logger = logger;
        }

        private async Task ValidateAssignmentAndMembershipAsync(Guid studentId, Guid assignmentId)
        {
            var assignment = await _context.Assignments.FindAsync(assignmentId);
            if (assignment == null)
                throw new KeyNotFoundException("Assignment not found.");
            
            if (assignment.Status != AssignmentStatus.Published)
                throw new InvalidOperationException("Assignment not found or not published.");

            var isEnrolled = await _context.StudentClasses
                .AnyAsync(sc => sc.StudentId == studentId && sc.ClassId == assignment.ClassId);

            if (!isEnrolled)
                throw new UnauthorizedAccessException("Cannot submit to this assignment.");
        }

        public async Task<IEnumerable<StudentAssignmentDto>> GetStudentAssignmentsAsync(Guid studentId)
        {
            var classIds = await _context.StudentClasses
                .Where(sc => sc.StudentId == studentId)
                .Select(sc => sc.ClassId)
                .ToListAsync();

            var assignments = await _context.Assignments
                .Where(a => classIds.Contains(a.ClassId) && a.Status == AssignmentStatus.Published)
                .Select(a => new StudentAssignmentDto(
                    a.Id,
                    a.Title,
                    a.ClassId,
                    a.SubjectId,
                    a.TeacherId,
                    a.Deadline,
                    a.MaximumMarks,
                    a.CreatedAt
                ))
                .ToListAsync();

            return assignments;
        }

        public async Task<StudentAssignmentDetailsDto?> GetStudentAssignmentDetailsAsync(Guid studentId, Guid assignmentId)
        {
            try
            {
                await ValidateAssignmentAndMembershipAsync(studentId, assignmentId);
            }
            catch (Exception ex) when (ex is KeyNotFoundException || ex is InvalidOperationException || ex is UnauthorizedAccessException)
            {
                return null;
            }

            var assignment = await _context.Assignments
                .Include(a => a.Submissions.Where(s => s.StudentId == studentId))
                    .ThenInclude(s => s.Attachments)
                .FirstOrDefaultAsync(a => a.Id == assignmentId);

            if (assignment == null) return null;

            SubmissionDto? subDto = null;
            var sub = assignment.Submissions.FirstOrDefault();
            if (sub != null)
            {
                subDto = MapToDto(sub);
            }

            return new StudentAssignmentDetailsDto(
                assignment.Id,
                assignment.Title,
                assignment.Description,
                assignment.ClassId,
                assignment.SubjectId,
                assignment.TeacherId,
                assignment.Deadline,
                assignment.MaximumMarks,
                assignment.CreatedAt,
                subDto
            );
        }

        public async Task<SubmissionDto> SubmitAnswerAsync(Guid studentId, CreateSubmissionDto dto)
        {
            await ValidateAssignmentAndMembershipAsync(studentId, dto.AssignmentId);

            var assignment = await _context.Assignments.FindAsync(dto.AssignmentId);
            if (DateTimeOffset.UtcNow > assignment!.Deadline)
            {
                throw new ArgumentException("Deadline has passed.");
            }

            var existingSubmission = await _context.Submissions
                .Include(s => s.Attachments)
                .FirstOrDefaultAsync(s => s.AssignmentId == dto.AssignmentId && s.StudentId == studentId);

            if (existingSubmission != null)
            {
                existingSubmission.Answer = dto.Answer;
                existingSubmission.UpdatedAt = DateTimeOffset.UtcNow;
                await _context.SaveChangesAsync();
                
                _logger.LogInformation("Submission updated successfully. SubmissionId: {SubmissionId}, StudentId: {StudentId}", existingSubmission.Id, studentId);
                return MapToDto(existingSubmission);
            }

            var newSubmission = new Submission
            {
                Id = Guid.NewGuid(),
                AssignmentId = dto.AssignmentId,
                StudentId = studentId,
                Answer = dto.Answer,
                SubmittedAt = DateTimeOffset.UtcNow,
                Status = SubmissionStatus.Submitted
            };

            _context.Submissions.Add(newSubmission);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Submission created successfully. SubmissionId: {SubmissionId}, StudentId: {StudentId}", newSubmission.Id, studentId);

            return MapToDto(newSubmission);
        }

        public async Task<SubmissionDto> UpdateSubmissionAsync(Guid studentId, Guid submissionId, UpdateSubmissionDto dto)
        {
            var submission = await _context.Submissions
                .Include(s => s.Assignment)
                .Include(s => s.Attachments)
                .FirstOrDefaultAsync(s => s.Id == submissionId);

            if (submission == null) throw new InvalidOperationException("Submission not found.");
            if (submission.StudentId != studentId) throw new UnauthorizedAccessException("Not owned by student.");
            if (DateTimeOffset.UtcNow > submission.Assignment.Deadline) throw new ArgumentException("Deadline has passed.");

            submission.Answer = dto.Answer;
            submission.UpdatedAt = DateTimeOffset.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Submission updated successfully. SubmissionId: {SubmissionId}, StudentId: {StudentId}", submission.Id, studentId);

            return MapToDto(submission);
        }

        public async Task<SubmissionDto?> GetSubmissionAsync(Guid studentId, Guid submissionId)
        {
            var submission = await _context.Submissions
                .Include(s => s.Attachments)
                .FirstOrDefaultAsync(s => s.Id == submissionId);

            if (submission == null) return null;
            if (submission.StudentId != studentId) throw new UnauthorizedAccessException("Not owned by student.");

            return MapToDto(submission);
        }

        public async Task<SubmissionAttachmentDto> UploadAttachmentAsync(Guid studentId, Guid submissionId, string fileName, string contentType, long fileSize, Stream fileStream)
        {
            var submission = await _context.Submissions
                .Include(s => s.Assignment)
                .FirstOrDefaultAsync(s => s.Id == submissionId);

            if (submission == null) throw new InvalidOperationException("Submission not found.");
            if (submission.StudentId != studentId) throw new UnauthorizedAccessException("Not owned by student.");
            if (DateTimeOffset.UtcNow > submission.Assignment.Deadline) throw new ArgumentException("Deadline has passed.");

            if (fileSize == 0) throw new ArgumentException("File is empty.");
            if (fileSize > 10 * 1024 * 1024) throw new ArgumentException("File exceeds 10MB limit.");

            var ext = Path.GetExtension(fileName).ToLower();
            var allowedExts = new[] { ".pdf", ".doc", ".docx", ".txt", ".jpg", ".jpeg", ".png" };
            if (!allowedExts.Contains(ext)) throw new ArgumentException("Invalid file extension.");

            var storedFileName = Guid.NewGuid().ToString() + ext;
            var directory = Path.Combine(Directory.GetCurrentDirectory(), "uploads", "submissions");
            if (!Directory.Exists(directory)) Directory.CreateDirectory(directory);

            var filePath = Path.Combine(directory, storedFileName);

            using (var fs = new FileStream(filePath, FileMode.Create))
            {
                await fileStream.CopyToAsync(fs);
            }

            var attachment = new SubmissionAttachment
            {
                Id = Guid.NewGuid(),
                SubmissionId = submissionId,
                FileName = fileName,
                StoredFileName = storedFileName,
                FilePath = filePath,
                ContentType = contentType,
                FileSize = fileSize,
                UploadedAt = DateTimeOffset.UtcNow
            };

            _context.SubmissionAttachments.Add(attachment);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Attachment uploaded successfully. AttachmentId: {AttachmentId}, SubmissionId: {SubmissionId}", attachment.Id, submissionId);

            return new SubmissionAttachmentDto(
                attachment.Id,
                attachment.FileName,
                attachment.ContentType,
                attachment.FileSize,
                attachment.UploadedAt
            );
        }

        public async Task DeleteAttachmentAsync(Guid studentId, Guid submissionId, Guid attachmentId)
        {
            var submission = await _context.Submissions
                .Include(s => s.Assignment)
                .FirstOrDefaultAsync(s => s.Id == submissionId);

            if (submission == null) throw new InvalidOperationException("Submission not found.");
            if (submission.StudentId != studentId) throw new UnauthorizedAccessException("Not owned by student.");
            if (DateTimeOffset.UtcNow > submission.Assignment.Deadline) throw new ArgumentException("Deadline has passed.");

            var attachment = await _context.SubmissionAttachments
                .FirstOrDefaultAsync(a => a.Id == attachmentId && a.SubmissionId == submissionId);

            if (attachment == null) throw new InvalidOperationException("Attachment not found.");

            if (File.Exists(attachment.FilePath))
            {
                File.Delete(attachment.FilePath);
            }

            _context.SubmissionAttachments.Remove(attachment);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Attachment deleted successfully. AttachmentId: {AttachmentId}, SubmissionId: {SubmissionId}", attachmentId, submissionId);
        }

        public async Task<IEnumerable<SubmissionDto>> GetSubmissionsForAssignmentAsync(Guid teacherId, Guid assignmentId)
        {
            var assignment = await _context.Assignments.FindAsync(assignmentId);
            if (assignment == null) throw new KeyNotFoundException("Assignment not found.");
            if (assignment.TeacherId != teacherId) throw new UnauthorizedAccessException("Not authorized to view submissions for this assignment.");

            var submissions = await _context.Submissions
                .Include(s => s.Attachments)
                .Where(s => s.AssignmentId == assignmentId)
                .ToListAsync();

            return submissions.Select(MapToDto);
        }

        public async Task<SubmissionDto> GetSubmissionForTeacherAsync(Guid teacherId, Guid submissionId)
        {
            var submission = await _context.Submissions
                .Include(s => s.Assignment)
                .Include(s => s.Attachments)
                .FirstOrDefaultAsync(s => s.Id == submissionId);

            if (submission == null) throw new KeyNotFoundException("Submission not found.");
            if (submission.Assignment.TeacherId != teacherId) throw new UnauthorizedAccessException("Not authorized to view this submission.");

            return MapToDto(submission);
        }

        public async Task<SubmissionDto> GradeSubmissionAsync(Guid teacherId, Guid submissionId, GradeSubmissionDto dto)
        {
            var submission = await _context.Submissions
                .Include(s => s.Assignment)
                .Include(s => s.Attachments)
                .FirstOrDefaultAsync(s => s.Id == submissionId);

            if (submission == null) throw new KeyNotFoundException("Submission not found.");
            if (submission.Assignment.TeacherId != teacherId) throw new UnauthorizedAccessException("Not authorized to grade this submission.");
            if (dto.Marks < 0) throw new ArgumentException("Marks cannot be negative.");
            if (dto.Marks > submission.Assignment.MaximumMarks) throw new ArgumentException($"Marks cannot exceed the maximum marks ({submission.Assignment.MaximumMarks}).");

            submission.Marks = dto.Marks;
            submission.Feedback = dto.Feedback;
            submission.Status = SubmissionStatus.Graded;
            submission.UpdatedAt = DateTimeOffset.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Submission graded successfully. SubmissionId: {SubmissionId}, TeacherId: {TeacherId}, Marks: {Marks}", submission.Id, teacherId, dto.Marks);

            return MapToDto(submission);
        }

        private static SubmissionDto MapToDto(Submission submission)
        {
            return new SubmissionDto(
                submission.Id,
                submission.AssignmentId,
                submission.StudentId,
                submission.Answer,
                submission.SubmittedAt,
                submission.UpdatedAt,
                submission.Status,
                submission.Marks,
                submission.Feedback,
                submission.Attachments?.Select(a => new SubmissionAttachmentDto(
                    a.Id,
                    a.FileName,
                    a.ContentType,
                    a.FileSize,
                    a.UploadedAt
                )) ?? Array.Empty<SubmissionAttachmentDto>()
            );
        }
    }
}
