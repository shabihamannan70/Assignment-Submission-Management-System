using System;
using System.Collections.Generic;
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
                Status = AssignmentStatus.Draft,
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
            var assignment = await _context.Assignments.FindAsync(assignmentId);
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
            var assignment = await _context.Assignments.FindAsync(assignmentId);
            if (assignment == null)
                throw new KeyNotFoundException("Assignment not found.");
            
            if (assignment.TeacherId != teacherId)
                throw new UnauthorizedAccessException("You can only delete your own assignments.");

            _context.Assignments.Remove(assignment);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Assignment deleted successfully. AssignmentId: {AssignmentId}, TeacherId: {TeacherId}", assignmentId, teacherId);
        }

        public async Task<AssignmentDto> PublishAssignmentAsync(Guid teacherId, Guid assignmentId)
        {
            var assignment = await _context.Assignments.FindAsync(assignmentId);
            if (assignment == null)
                throw new KeyNotFoundException("Assignment not found.");

            if (assignment.TeacherId != teacherId)
                throw new UnauthorizedAccessException("You can only publish your own assignments.");

            if (assignment.Status == AssignmentStatus.Published)
                return MapToDto(assignment); // Already published

            if (string.IsNullOrWhiteSpace(assignment.Title))
                throw new ArgumentException("Title is required to publish.");
            
            if (assignment.MaximumMarks <= 0)
                throw new ArgumentException("Maximum marks must be greater than zero.");
            
            if (assignment.Deadline <= DateTimeOffset.UtcNow)
                throw new ArgumentException("Deadline must be in the future to publish.");

            // Verify teacher is STILL assigned to this class and subject
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

        public async Task<AssignmentDto> GetAssignmentAsync(Guid teacherId, Guid assignmentId)
        {
            var assignment = await _context.Assignments.FindAsync(assignmentId);
            if (assignment == null)
                throw new KeyNotFoundException("Assignment not found.");
            
            if (assignment.TeacherId != teacherId)
                throw new UnauthorizedAccessException("You can only view your own assignments.");

            return MapToDto(assignment);
        }

        public async Task<IEnumerable<AssignmentDto>> GetMyAssignmentsAsync(Guid teacherId)
        {
            var assignments = await _context.Assignments
                .Where(a => a.TeacherId == teacherId)
                .ToListAsync();

            return assignments.Select(MapToDto);
        }

        private AssignmentDto MapToDto(Assignment a)
        {
            return new AssignmentDto(a.Id, a.Title, a.Description, a.ClassId, a.SubjectId, a.TeacherId, a.Deadline, a.MaximumMarks, a.Status, a.CreatedAt, a.UpdatedAt);
        }
    }
}
