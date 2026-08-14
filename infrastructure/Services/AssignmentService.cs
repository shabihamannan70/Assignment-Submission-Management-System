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
using AssignmentSystem.Infrastructure.Extensions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace AssignmentSystem.Infrastructure.Services
{
    public class AssignmentService : IAssignmentService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<AssignmentService> _logger;

        public AssignmentService(ApplicationDbContext context, ILogger<AssignmentService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<AssignmentDto> CreateAssignmentAsync(Guid teacherId, CreateAssignmentDto dto)
        {
            if (dto.MaximumMarks <= 0)
                throw new ArgumentException("Maximum marks must be greater than zero.");
            if (dto.Deadline <= DateTimeOffset.UtcNow)
                throw new ArgumentException("Deadline must be in the future.");

            var hasAssignment = await _context.TeacherAssignments
                .AnyAsync(ta => ta.TeacherId == teacherId && ta.ClassId == dto.ClassId && ta.SubjectId == dto.SubjectId);
            
            if (!hasAssignment)
                throw new UnauthorizedAccessException("Teacher is not assigned to this class and subject.");

            var assignment = new Assignment
            {
                Id = Guid.NewGuid(),
                Title = dto.Title,
                Description = dto.Description,
                ClassId = dto.ClassId,
                SubjectId = dto.SubjectId,
                TeacherId = teacherId,
                Deadline = dto.Deadline,
                MaximumMarks = dto.MaximumMarks,
                Status = dto.Status,
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow
            };

            _context.Assignments.Add(assignment);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Assignment created successfully. AssignmentId: {AssignmentId}, TeacherId: {TeacherId}", assignment.Id, teacherId);

            return MapToDto(assignment);
        }

        public async Task<AssignmentDto> UpdateAssignmentAsync(Guid teacherId, Guid assignmentId, UpdateAssignmentDto dto)
        {
            var assignment = await _context.Assignments
                .Include(a => a.Attachments)
                .FirstOrDefaultAsync(a => a.Id == assignmentId);
            if (assignment == null)
                throw new KeyNotFoundException("Assignment not found.");
            
            if (assignment.TeacherId != teacherId)
                throw new UnauthorizedAccessException("You can only modify your own assignments.");

            if (dto.MaximumMarks <= 0)
                throw new ArgumentException("Maximum marks must be greater than zero.");
            
            if (dto.Deadline != assignment.Deadline && dto.Deadline <= DateTimeOffset.UtcNow)
                throw new ArgumentException("Deadline must be in the future.");

            assignment.Title = dto.Title;
            assignment.Description = dto.Description;
            assignment.Deadline = dto.Deadline;
            assignment.MaximumMarks = dto.MaximumMarks;
            assignment.UpdatedAt = DateTimeOffset.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Assignment updated successfully. AssignmentId: {AssignmentId}, TeacherId: {TeacherId}", assignment.Id, teacherId);

            return MapToDto(assignment);
        }

        public async Task DeleteAssignmentAsync(Guid teacherId, Guid assignmentId)
        {
            var assignment = await _context.Assignments
                .Include(a => a.Attachments)
                .FirstOrDefaultAsync(a => a.Id == assignmentId);
            if (assignment == null)
                throw new KeyNotFoundException("Assignment not found.");
            
            if (assignment.TeacherId != teacherId)
                throw new UnauthorizedAccessException("You can only delete your own assignments.");

            // Delete physical attachment files
            foreach (var attachment in assignment.Attachments)
            {
                if (File.Exists(attachment.FilePath))
                {
                    File.Delete(attachment.FilePath);
                }
            }

            _context.Assignments.Remove(assignment);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Assignment deleted successfully. AssignmentId: {AssignmentId}, TeacherId: {TeacherId}", assignmentId, teacherId);
        }

        public async Task<AssignmentDto> PublishAssignmentAsync(Guid teacherId, Guid assignmentId)
        {
            var assignment = await _context.Assignments
                .Include(a => a.Attachments)
                .FirstOrDefaultAsync(a => a.Id == assignmentId);
            if (assignment == null)
                throw new KeyNotFoundException("Assignment not found.");

            if (assignment.TeacherId != teacherId)
                throw new UnauthorizedAccessException("You can only publish your own assignments.");

            if (assignment.Status == AssignmentStatus.Published)
                return MapToDto(assignment);

            if (string.IsNullOrWhiteSpace(assignment.Title))
                throw new ArgumentException("Title is required to publish.");
            
            if (assignment.MaximumMarks <= 0)
                throw new ArgumentException("Maximum marks must be greater than zero.");
            
            if (assignment.Deadline <= DateTimeOffset.UtcNow)
                throw new ArgumentException("Deadline must be in the future to publish.");

            var hasAssignment = await _context.TeacherAssignments
                .AnyAsync(ta => ta.TeacherId == teacherId && ta.ClassId == assignment.ClassId && ta.SubjectId == assignment.SubjectId);
            
            if (!hasAssignment)
                throw new UnauthorizedAccessException("Teacher is no longer assigned to this class and subject.");

            assignment.Status = AssignmentStatus.Published;
            assignment.UpdatedAt = DateTimeOffset.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Assignment published successfully. AssignmentId: {AssignmentId}, TeacherId: {TeacherId}", assignment.Id, teacherId);

            return MapToDto(assignment);
        }

        public async Task<AssignmentDto> ToggleAssignmentStatusAsync(Guid teacherId, Guid assignmentId)
        {
            var assignment = await _context.Assignments
                .Include(a => a.Attachments)
                .FirstOrDefaultAsync(a => a.Id == assignmentId);
            if (assignment == null)
                throw new KeyNotFoundException("Assignment not found.");

            if (assignment.TeacherId != teacherId)
                throw new UnauthorizedAccessException("You can only modify your own assignments.");

            if (assignment.Status == AssignmentStatus.Draft)
            {
                if (string.IsNullOrWhiteSpace(assignment.Title))
                    throw new ArgumentException("Title is required to publish.");
                
                if (assignment.MaximumMarks <= 0)
                    throw new ArgumentException("Maximum marks must be greater than zero.");
                
                if (assignment.Deadline <= DateTimeOffset.UtcNow)
                    throw new ArgumentException("Deadline must be in the future to publish.");

                var hasAssignment = await _context.TeacherAssignments
                    .AnyAsync(ta => ta.TeacherId == teacherId && ta.ClassId == assignment.ClassId && ta.SubjectId == assignment.SubjectId);
                
                if (!hasAssignment)
                    throw new UnauthorizedAccessException("Teacher is no longer assigned to this class and subject.");

                assignment.Status = AssignmentStatus.Published;
            }
            else
            {
                assignment.Status = AssignmentStatus.Draft;
            }

            assignment.UpdatedAt = DateTimeOffset.UtcNow;
            await _context.SaveChangesAsync();

            _logger.LogInformation("Assignment status toggled successfully. AssignmentId: {AssignmentId}, NewStatus: {Status}, TeacherId: {TeacherId}", assignment.Id, assignment.Status, teacherId);

            return MapToDto(assignment);
        }

        public async Task<AssignmentDto> GetAssignmentAsync(Guid teacherId, Guid assignmentId)
        {
            var assignment = await _context.Assignments
                .Include(a => a.Attachments)
                .FirstOrDefaultAsync(a => a.Id == assignmentId);
            if (assignment == null)
                throw new KeyNotFoundException("Assignment not found.");
            
            if (assignment.TeacherId != teacherId)
                throw new UnauthorizedAccessException("You can only view your own assignments.");

            return MapToDto(assignment);
        }

        public async Task<PaginatedResult<AssignmentDto>> GetMyAssignmentsAsync(Guid teacherId, string? search = null, int page = 1, int pageSize = 10)
        {
            var query = _context.Assignments
                .Include(a => a.Attachments)
                .Include(a => a.Class)
                .Include(a => a.Subject)
                .Where(a => a.TeacherId == teacherId);

            if (!string.IsNullOrWhiteSpace(search))
            {
                var sl = search.ToLower();
                query = query.Where(a => a.Title.ToLower().Contains(sl) ||
                                         a.Class.Name.ToLower().Contains(sl) ||
                                         a.Subject.Name.ToLower().Contains(sl));
            }

            var count = await query.CountAsync();
            var items = await query
                .OrderByDescending(a => a.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return new PaginatedResult<AssignmentDto>
            {
                Items = items.Select(MapToDto),
                Page = page,
                PageSize = pageSize,
                TotalCount = count
            };
        }

        public async Task<AssignmentAttachmentDto> UploadAttachmentAsync(Guid teacherId, Guid assignmentId, string fileName, string contentType, long fileSize, Stream fileStream)
        {
            var assignment = await _context.Assignments
                .FirstOrDefaultAsync(a => a.Id == assignmentId);

            if (assignment == null) throw new KeyNotFoundException("Assignment not found.");
            if (assignment.TeacherId != teacherId) throw new UnauthorizedAccessException("Not owned by teacher.");

            if (fileSize == 0) throw new ArgumentException("File is empty.");
            if (fileSize > 10 * 1024 * 1024) throw new ArgumentException("File exceeds 10MB limit.");

            var ext = Path.GetExtension(fileName).ToLower();
            var allowedExts = new[] { ".pdf", ".doc", ".docx", ".txt", ".jpg", ".jpeg", ".png", ".xls", ".xlsx", ".ppt", ".pptx" };
            if (!allowedExts.Contains(ext)) throw new ArgumentException("Invalid file extension.");

            var storedFileName = Guid.NewGuid().ToString() + ext;
            var directory = Path.Combine(Directory.GetCurrentDirectory(), "uploads", "assignments");
            if (!Directory.Exists(directory)) Directory.CreateDirectory(directory);

            var filePath = Path.Combine(directory, storedFileName);

            using (var fs = new FileStream(filePath, FileMode.Create))
            {
                await fileStream.CopyToAsync(fs);
            }

            var attachment = new AssignmentAttachment
            {
                Id = Guid.NewGuid(),
                AssignmentId = assignmentId,
                FileName = fileName,
                StoredFileName = storedFileName,
                FilePath = filePath,
                ContentType = contentType,
                FileSize = fileSize,
                UploadedAt = DateTimeOffset.UtcNow
            };

            _context.AssignmentAttachments.Add(attachment);
            
            try 
            {
                await _context.SaveChangesAsync();
            }
            catch
            {
                if (File.Exists(filePath)) File.Delete(filePath);
                throw;
            }

            _logger.LogInformation("Attachment uploaded successfully. AttachmentId: {AttachmentId}, AssignmentId: {AssignmentId}", attachment.Id, assignmentId);

            return new AssignmentAttachmentDto(
                attachment.Id,
                attachment.FileName,
                attachment.ContentType,
                attachment.FileSize,
                attachment.UploadedAt
            );
        }

        public async Task DeleteAttachmentAsync(Guid teacherId, Guid assignmentId, Guid attachmentId)
        {
            var assignment = await _context.Assignments
                .FirstOrDefaultAsync(a => a.Id == assignmentId);

            if (assignment == null) throw new KeyNotFoundException("Assignment not found.");
            if (assignment.TeacherId != teacherId) throw new UnauthorizedAccessException("Not owned by teacher.");

            var attachment = await _context.AssignmentAttachments
                .FirstOrDefaultAsync(a => a.Id == attachmentId && a.AssignmentId == assignmentId);

            if (attachment == null) throw new KeyNotFoundException("Attachment not found.");

            if (File.Exists(attachment.FilePath))
            {
                File.Delete(attachment.FilePath);
            }

            _context.AssignmentAttachments.Remove(attachment);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Attachment deleted successfully. AttachmentId: {AttachmentId}, AssignmentId: {AssignmentId}", attachmentId, assignmentId);
        }

        public async Task<(Stream FileStream, string ContentType, string FileName)> DownloadAttachmentAsync(Guid userId, string role, Guid assignmentId, Guid attachmentId)
        {
            var assignment = await _context.Assignments
                .FirstOrDefaultAsync(a => a.Id == assignmentId);

            if (assignment == null) throw new KeyNotFoundException("Assignment not found.");

            if (role == "Student")
            {
                var isEnrolled = await _context.StudentClasses
                    .AnyAsync(sc => sc.StudentId == userId && sc.ClassId == assignment.ClassId);
                
                if (!isEnrolled || assignment.Status != AssignmentStatus.Published)
                    throw new UnauthorizedAccessException("Not authorized to download this attachment.");
            }
            else if (role == "Teacher")
            {
                if (assignment.TeacherId != userId)
                    throw new UnauthorizedAccessException("Not authorized to download this attachment.");
            }
            else if (role != "Admin")
            {
                throw new UnauthorizedAccessException("Invalid role for downloading attachment.");
            }

            var attachment = await _context.AssignmentAttachments
                .FirstOrDefaultAsync(a => a.Id == attachmentId && a.AssignmentId == assignmentId);

            if (attachment == null) throw new KeyNotFoundException("Attachment not found.");

            if (!File.Exists(attachment.FilePath))
                throw new FileNotFoundException("Physical file not found on server.");

            var stream = new FileStream(attachment.FilePath, FileMode.Open, FileAccess.Read, FileShare.Read);
            
            return (stream, attachment.ContentType, attachment.FileName);
        }

        private AssignmentDto MapToDto(Assignment a)
        {
            var attachments = a.Attachments?.Select(att => new AssignmentAttachmentDto(
                att.Id,
                att.FileName,
                att.ContentType,
                att.FileSize,
                att.UploadedAt
            )).ToList();

            return new AssignmentDto(a.Id, a.Title, a.Description, a.ClassId, a.SubjectId, a.TeacherId, a.Deadline, a.MaximumMarks, a.Status, a.CreatedAt, a.UpdatedAt, attachments);
        }
    }
}
