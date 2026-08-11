using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AssignmentSystem.Core.DTOs;
using AssignmentSystem.Core.Entities;
using AssignmentSystem.Core.Interfaces;
using AssignmentSystem.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace AssignmentSystem.Infrastructure.Services
{
    public class AdminService : IAdminService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<AdminService> _logger;

        public AdminService(ApplicationDbContext context, ILogger<AdminService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<IEnumerable<ClassDto>> GetClassesAsync()
        {
            return await _context.Classes
                .Select(c => new ClassDto(c.Id, c.Name, c.Code, c.Description, c.CreatedAt))
                .ToListAsync();
        }

        public async Task<ClassDto> CreateClassAsync(CreateClassDto dto)
        {
            if (await _context.Classes.AnyAsync(c => c.Code == dto.Code))
                throw new ArgumentException("Class code already exists.");

            var newClass = new Class
            {
                Id = Guid.NewGuid(),
                Name = dto.Name,
                Code = dto.Code,
                Description = dto.Description
            };

            _context.Classes.Add(newClass);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Class created successfully. ClassId: {ClassId}, Code: {Code}", newClass.Id, newClass.Code);

            return new ClassDto(newClass.Id, newClass.Name, newClass.Code, newClass.Description, newClass.CreatedAt);
        }

        public async Task<ClassDto> GetClassAsync(Guid id)
        {
            var c = await _context.Classes.FindAsync(id);
            if (c == null) throw new KeyNotFoundException("Class not found.");
            
            return new ClassDto(c.Id, c.Name, c.Code, c.Description, c.CreatedAt);
        }

        public async Task<ClassDto> UpdateClassAsync(Guid id, UpdateClassDto dto)
        {
            var existingClass = await _context.Classes.FindAsync(id);
            if (existingClass == null) throw new KeyNotFoundException("Class not found.");

            if (existingClass.Code != dto.Code && await _context.Classes.AnyAsync(c => c.Code == dto.Code))
                throw new InvalidOperationException("Class code already exists."); // Mapping to 400

            existingClass.Name = dto.Name;
            existingClass.Code = dto.Code;
            existingClass.Description = dto.Description;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Class updated successfully. ClassId: {ClassId}", existingClass.Id);

            return new ClassDto(existingClass.Id, existingClass.Name, existingClass.Code, existingClass.Description, existingClass.CreatedAt);
        }

        public async Task DeleteClassAsync(Guid id)
        {
            var existingClass = await _context.Classes.FindAsync(id);
            if (existingClass == null) throw new KeyNotFoundException("Class not found.");

            _context.Classes.Remove(existingClass);

            try
            {
                await _context.SaveChangesAsync();
                _logger.LogInformation("Class deleted successfully. ClassId: {ClassId}", id);
            }
            catch (DbUpdateException)
            {
                throw new ArgumentException("Cannot delete class because it is currently assigned to teachers or students.");
            }
        }

        public async Task<IEnumerable<SubjectDto>> GetSubjectsAsync()
        {
            return await _context.Subjects
                .Select(s => new SubjectDto(s.Id, s.Name, s.Code, s.Description, s.CreatedAt))
                .ToListAsync();
        }

        public async Task<SubjectDto> CreateSubjectAsync(CreateSubjectDto dto)
        {
            if (await _context.Subjects.AnyAsync(s => s.Code == dto.Code))
                throw new ArgumentException("Subject code already exists.");

            var newSubject = new Subject
            {
                Id = Guid.NewGuid(),
                Name = dto.Name,
                Code = dto.Code,
                Description = dto.Description
            };

            _context.Subjects.Add(newSubject);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Subject created successfully. SubjectId: {SubjectId}, Code: {Code}", newSubject.Id, newSubject.Code);

            return new SubjectDto(newSubject.Id, newSubject.Name, newSubject.Code, newSubject.Description, newSubject.CreatedAt);
        }

        public async Task<SubjectDto> GetSubjectAsync(Guid id)
        {
            var s = await _context.Subjects.FindAsync(id);
            if (s == null) throw new KeyNotFoundException("Subject not found.");
            
            return new SubjectDto(s.Id, s.Name, s.Code, s.Description, s.CreatedAt);
        }

        public async Task<SubjectDto> UpdateSubjectAsync(Guid id, UpdateSubjectDto dto)
        {
            var existingSubject = await _context.Subjects.FindAsync(id);
            if (existingSubject == null) throw new KeyNotFoundException("Subject not found.");

            if (existingSubject.Code != dto.Code && await _context.Subjects.AnyAsync(s => s.Code == dto.Code))
                throw new InvalidOperationException("Subject code already exists.");

            existingSubject.Name = dto.Name;
            existingSubject.Code = dto.Code;
            existingSubject.Description = dto.Description;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Subject updated successfully. SubjectId: {SubjectId}", existingSubject.Id);

            return new SubjectDto(existingSubject.Id, existingSubject.Name, existingSubject.Code, existingSubject.Description, existingSubject.CreatedAt);
        }

        public async Task DeleteSubjectAsync(Guid id)
        {
            var existingSubject = await _context.Subjects.FindAsync(id);
            if (existingSubject == null) throw new KeyNotFoundException("Subject not found.");

            _context.Subjects.Remove(existingSubject);

            try
            {
                await _context.SaveChangesAsync();
                _logger.LogInformation("Subject deleted successfully. SubjectId: {SubjectId}", id);
            }
            catch (DbUpdateException)
            {
                throw new ArgumentException("Cannot delete subject because it is currently assigned to teachers.");
            }
        }

        public async Task<TeacherAssignmentDto> AssignTeacherAsync(AssignTeacherDto dto)
        {
            var teacher = await _context.Users.FindAsync(dto.TeacherId);
            if (teacher == null) throw new KeyNotFoundException("Teacher not found.");
            if (teacher.Role != "Teacher") throw new ArgumentException("User is not a Teacher.");

            var classExists = await _context.Classes.AnyAsync(c => c.Id == dto.ClassId);
            if (!classExists) throw new KeyNotFoundException("Class not found.");

            var subjectExists = await _context.Subjects.AnyAsync(s => s.Id == dto.SubjectId);
            if (!subjectExists) throw new KeyNotFoundException("Subject not found.");

            var exists = await _context.TeacherAssignments
                .AnyAsync(ta => ta.TeacherId == dto.TeacherId && ta.ClassId == dto.ClassId && ta.SubjectId == dto.SubjectId);
            if (exists) throw new ArgumentException("Teacher is already assigned to this class and subject.");

            var assignment = new TeacherAssignment
            {
                Id = Guid.NewGuid(),
                TeacherId = dto.TeacherId,
                ClassId = dto.ClassId,
                SubjectId = dto.SubjectId
            };

            _context.TeacherAssignments.Add(assignment);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Teacher assigned to class successfully. TeacherId: {TeacherId}, ClassId: {ClassId}, SubjectId: {SubjectId}", dto.TeacherId, dto.ClassId, dto.SubjectId);

            return new TeacherAssignmentDto(assignment.Id, assignment.TeacherId, assignment.ClassId, assignment.SubjectId, assignment.CreatedAt);
        }

        public async Task<StudentClassDto> EnrollStudentAsync(EnrollStudentDto dto)
        {
            var student = await _context.Users.FindAsync(dto.StudentId);
            if (student == null) throw new KeyNotFoundException("Student not found.");
            if (student.Role != "Student") throw new ArgumentException("User is not a Student.");

            var classExists = await _context.Classes.AnyAsync(c => c.Id == dto.ClassId);
            if (!classExists) throw new KeyNotFoundException("Class not found.");

            var exists = await _context.StudentClasses
                .AnyAsync(sc => sc.StudentId == dto.StudentId && sc.ClassId == dto.ClassId);
            if (exists) throw new ArgumentException("Student is already enrolled in this class.");

            var enrollment = new StudentClass
            {
                StudentId = dto.StudentId,
                ClassId = dto.ClassId
            };

            _context.StudentClasses.Add(enrollment);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Student enrolled in class successfully. StudentId: {StudentId}, ClassId: {ClassId}", dto.StudentId, dto.ClassId);

            return new StudentClassDto(enrollment.StudentId, enrollment.ClassId, enrollment.JoinedAt);
        }
    }
}
