using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AssignmentSystem.Core.DTOs;
using AssignmentSystem.Core.Entities;
using AssignmentSystem.Core.Interfaces;
using AssignmentSystem.Core.Exceptions;
using AssignmentSystem.Infrastructure.Data;
using AssignmentSystem.Infrastructure.Extensions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace AssignmentSystem.Infrastructure.Services
{
    public class AdminService : IAdminService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<AdminService> _logger;
        private readonly IPasswordHasherService _passwordHasher;

        public AdminService(ApplicationDbContext context, ILogger<AdminService> logger, IPasswordHasherService passwordHasher)
        {
            _context = context;
            _logger = logger;
            _passwordHasher = passwordHasher;
        }

        public async Task<PaginatedResult<ClassDto>> GetClassesAsync(string? search = null, int page = 1, int pageSize = 10)
        {
            var query = _context.Classes.AsQueryable();
            if (!string.IsNullOrWhiteSpace(search))
            {
                var sl = search.ToLower();
                query = query.Where(c => c.Name.ToLower().Contains(sl));
            }
            return await query
                .OrderBy(c => c.Name)
                .Select(c => new ClassDto(c.Id, c.Name, c.Code, c.Description, c.CreatedAt))
                .ToPaginatedResultAsync(page, pageSize);
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

        public async Task<OperationResult> DeleteClassAsync(Guid id)
        {
            var existingClass = await _context.Classes.FindAsync(id);
            if (existingClass == null) throw new KeyNotFoundException("Class not found.");

            // Pre-validation to avoid DB constraint exception round-trips
            var isAssigned = await _context.TeacherAssignments.AnyAsync(ta => ta.ClassId == id) ||
                             await _context.StudentClasses.AnyAsync(sc => sc.ClassId == id) ||
                             await _context.Assignments.AnyAsync(a => a.ClassId == id);

            if (isAssigned)
            {
                return OperationResult.Fail("Cannot delete this class because it is currently assigned to teachers, students, or assignments.");
            }

            _context.Classes.Remove(existingClass);

            try
            {
                await _context.SaveChangesAsync();
                _logger.LogInformation("Class deleted successfully. ClassId: {ClassId}", id);
                return OperationResult.Ok();
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(ex, "Database constraint violation when deleting ClassId: {ClassId}", id);
                return OperationResult.Fail("Cannot delete this class because it is currently assigned to teachers, students, or assignments.");
            }
        }

        public async Task<PaginatedResult<SubjectDto>> GetSubjectsAsync(string? search = null, int page = 1, int pageSize = 10)
        {
            var query = _context.Subjects.AsQueryable();
            if (!string.IsNullOrWhiteSpace(search))
            {
                var sl = search.ToLower();
                query = query.Where(s => s.Name.ToLower().Contains(sl));
            }
            return await query
                .OrderBy(s => s.Name)
                .Select(s => new SubjectDto(s.Id, s.Name, s.Code, s.Description, s.CreatedAt))
                .ToPaginatedResultAsync(page, pageSize);
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

        public async Task<OperationResult> DeleteSubjectAsync(Guid id)
        {
            var existingSubject = await _context.Subjects.FindAsync(id);
            if (existingSubject == null) throw new KeyNotFoundException("Subject not found.");

            // Pre-validation to avoid DB constraint exception round-trips
            var isAssigned = await _context.TeacherAssignments.AnyAsync(ta => ta.SubjectId == id) ||
                             await _context.Assignments.AnyAsync(a => a.SubjectId == id);

            if (isAssigned)
            {
                return OperationResult.Fail("Cannot delete this subject because it is currently assigned and cannot be deleted.");
            }

            _context.Subjects.Remove(existingSubject);

            try
            {
                await _context.SaveChangesAsync();
                _logger.LogInformation("Subject deleted successfully. SubjectId: {SubjectId}", id);
                return OperationResult.Ok();
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(ex, "Database constraint violation when deleting SubjectId: {SubjectId}", id);
                return OperationResult.Fail("Cannot delete this subject because it is currently assigned and cannot be deleted.");
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

        public async Task<TeacherAssignmentViewDto> GetTeacherAssignmentAsync(Guid id)
        {
            var ta = await _context.TeacherAssignments
                .Include(ta => ta.Teacher)
                .Include(ta => ta.Class)
                .Include(ta => ta.Subject)
                .FirstOrDefaultAsync(ta => ta.Id == id);
                
            if (ta == null) throw new KeyNotFoundException("Teacher assignment not found.");

            return new TeacherAssignmentViewDto
            {
                Id = ta.Id,
                TeacherId = ta.TeacherId,
                TeacherName = ta.Teacher.Name,
                TeacherEmail = ta.Teacher.Email,
                ClassId = ta.ClassId,
                ClassName = ta.Class.Name,
                SubjectId = ta.SubjectId,
                SubjectName = ta.Subject.Name,
                CreatedAt = ta.CreatedAt
            };
        }

        public async Task<TeacherAssignmentDto> UpdateTeacherAssignmentAsync(Guid id, AssignTeacherDto dto)
        {
            var assignment = await _context.TeacherAssignments.FindAsync(id);
            if (assignment == null) throw new KeyNotFoundException("Teacher assignment not found.");

            var teacher = await _context.Users.FindAsync(dto.TeacherId);
            if (teacher == null) throw new KeyNotFoundException("Teacher not found.");
            if (teacher.Role != "Teacher") throw new ArgumentException("User is not a Teacher.");

            var classExists = await _context.Classes.AnyAsync(c => c.Id == dto.ClassId);
            if (!classExists) throw new KeyNotFoundException("Class not found.");

            var subjectExists = await _context.Subjects.AnyAsync(s => s.Id == dto.SubjectId);
            if (!subjectExists) throw new KeyNotFoundException("Subject not found.");

            var duplicateExists = await _context.TeacherAssignments
                .AnyAsync(ta => ta.Id != id && ta.TeacherId == dto.TeacherId && ta.ClassId == dto.ClassId && ta.SubjectId == dto.SubjectId);
            if (duplicateExists) throw new ArgumentException("This combination of Teacher, Class, and Subject already exists.");

            assignment.TeacherId = dto.TeacherId;
            assignment.ClassId = dto.ClassId;
            assignment.SubjectId = dto.SubjectId;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Teacher assignment updated successfully. AssignmentId: {AssignmentId}", id);

            return new TeacherAssignmentDto(assignment.Id, assignment.TeacherId, assignment.ClassId, assignment.SubjectId, assignment.CreatedAt);
        }

        public async Task DeleteTeacherAssignmentAsync(Guid id)
        {
            var assignment = await _context.TeacherAssignments.FindAsync(id);
            if (assignment == null) throw new KeyNotFoundException("Teacher assignment not found.");

            _context.TeacherAssignments.Remove(assignment);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Teacher assignment deleted successfully. AssignmentId: {AssignmentId}", id);
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

        public async Task<StudentClassDto> UpdateStudentEnrollmentAsync(Guid studentId, Guid oldClassId, EnrollStudentDto dto)
        {
            var oldEnrollment = await _context.StudentClasses
                .FirstOrDefaultAsync(sc => sc.StudentId == studentId && sc.ClassId == oldClassId);
            if (oldEnrollment == null) throw new KeyNotFoundException("Original student enrollment not found.");

            if (dto.StudentId != studentId) throw new ArgumentException("Cannot change the student ID of an enrollment. Please create a new enrollment instead.");

            var classExists = await _context.Classes.AnyAsync(c => c.Id == dto.ClassId);
            if (!classExists) throw new KeyNotFoundException("New class not found.");

            if (oldClassId != dto.ClassId)
            {
                var exists = await _context.StudentClasses
                    .AnyAsync(sc => sc.StudentId == dto.StudentId && sc.ClassId == dto.ClassId);
                if (exists) throw new ArgumentException("Student is already enrolled in the new class.");

                _context.StudentClasses.Remove(oldEnrollment);
                
                var newEnrollment = new StudentClass
                {
                    StudentId = dto.StudentId,
                    ClassId = dto.ClassId,
                    JoinedAt = oldEnrollment.JoinedAt // Preserve join date
                };

                _context.StudentClasses.Add(newEnrollment);
                await _context.SaveChangesAsync();
                
                _logger.LogInformation("Student enrollment updated successfully. StudentId: {StudentId}, OldClassId: {OldClassId}, NewClassId: {NewClassId}", studentId, oldClassId, dto.ClassId);
                return new StudentClassDto(newEnrollment.StudentId, newEnrollment.ClassId, newEnrollment.JoinedAt);
            }

            return new StudentClassDto(oldEnrollment.StudentId, oldEnrollment.ClassId, oldEnrollment.JoinedAt);
        }

        public async Task DeleteStudentEnrollmentAsync(Guid studentId, Guid classId)
        {
            var enrollment = await _context.StudentClasses
                .FirstOrDefaultAsync(sc => sc.StudentId == studentId && sc.ClassId == classId);
            if (enrollment == null) throw new KeyNotFoundException("Student enrollment not found.");

            _context.StudentClasses.Remove(enrollment);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Student enrollment deleted successfully. StudentId: {StudentId}, ClassId: {ClassId}", studentId, classId);
        }


        public async Task<PaginatedResult<UserDto>> GetUsersAsync(string? role = null, string? search = null, int page = 1, int pageSize = 10)
        {
            var query = _context.Users.AsQueryable();
            
            if (!string.IsNullOrEmpty(role))
            {
                query = query.Where(u => u.Role == role);
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                var sl = search.ToLower();
                query = query.Where(u => u.Name.ToLower().Contains(sl) || 
                                         u.Email.ToLower().Contains(sl) ||
                                         u.Role.ToLower().Contains(sl));
            }

            return await query
                .OrderBy(u => u.Role)
                .ThenBy(u => u.Name)
                .Select(u => new UserDto 
                { 
                    Id = u.Id, 
                    Name = u.Name, 
                    Email = u.Email, 
                    Role = u.Role, 
                    IsActive = u.IsActive, 
                    CreatedAt = u.CreatedAt 
                })
                .ToPaginatedResultAsync(page, pageSize);
        }

        public async Task<UserDto> GetUserAsync(Guid id)
        {
            var u = await _context.Users.FindAsync(id);
            if (u == null) throw new KeyNotFoundException("User not found.");

            return new UserDto 
            { 
                Id = u.Id, 
                Name = u.Name, 
                Email = u.Email, 
                Role = u.Role, 
                IsActive = u.IsActive, 
                CreatedAt = u.CreatedAt 
            };
        }

        public async Task<UserDto> CreateUserAsync(CreateUserDto dto)
        {
            if (await _context.Users.AnyAsync(u => u.Email == dto.Email))
                throw new ArgumentException("Email already in use.");

            if (dto.Role != "Teacher" && dto.Role != "Student" && dto.Role != "Admin")
                throw new ArgumentException("Invalid role specified.");

            var newUser = new User
            {
                Id = Guid.NewGuid(),
                Name = dto.Name,
                Email = dto.Email,
                Role = dto.Role,
                IsActive = true,
                PasswordHash = _passwordHasher.HashPassword(dto.Password)
            };

            _context.Users.Add(newUser);
            await _context.SaveChangesAsync();

            _logger.LogInformation("User created successfully. UserId: {UserId}, Role: {Role}", newUser.Id, newUser.Role);

            return new UserDto 
            { 
                Id = newUser.Id, 
                Name = newUser.Name, 
                Email = newUser.Email, 
                Role = newUser.Role, 
                IsActive = newUser.IsActive, 
                CreatedAt = newUser.CreatedAt 
            };
        }

        public async Task<UserDto> UpdateUserAsync(Guid id, UpdateUserDto dto)
        {
            var existingUser = await _context.Users.FindAsync(id);
            if (existingUser == null) throw new KeyNotFoundException("User not found.");

            if (existingUser.Email != dto.Email && await _context.Users.AnyAsync(u => u.Email == dto.Email))
                throw new InvalidOperationException("Email already in use by another user.");

            existingUser.Name = dto.Name;
            existingUser.Email = dto.Email;

            await _context.SaveChangesAsync();

            _logger.LogInformation("User updated successfully. UserId: {UserId}", existingUser.Id);

            return new UserDto 
            { 
                Id = existingUser.Id, 
                Name = existingUser.Name, 
                Email = existingUser.Email, 
                Role = existingUser.Role, 
                IsActive = existingUser.IsActive, 
                CreatedAt = existingUser.CreatedAt 
            };
        }

        public async Task<UserDto> ToggleUserActiveStatusAsync(Guid id)
        {
            var existingUser = await _context.Users.FindAsync(id);
            if (existingUser == null) throw new KeyNotFoundException("User not found.");
            
            if (existingUser.Role == "Admin")
                throw new InvalidOperationException("Cannot change the active status of an Admin user.");

            existingUser.IsActive = !existingUser.IsActive;

            await _context.SaveChangesAsync();

            _logger.LogInformation("User active status toggled. UserId: {UserId}, IsActive: {IsActive}", existingUser.Id, existingUser.IsActive);

            return new UserDto 
            { 
                Id = existingUser.Id, 
                Name = existingUser.Name, 
                Email = existingUser.Email, 
                Role = existingUser.Role, 
                IsActive = existingUser.IsActive, 
                CreatedAt = existingUser.CreatedAt 
            };
        }

        public async Task<PaginatedResult<TeacherAssignmentViewDto>> GetTeacherAssignmentsAsync(string? search = null, int page = 1, int pageSize = 10)
        {
            var query = _context.TeacherAssignments
                .Include(ta => ta.Teacher)
                .Include(ta => ta.Class)
                .Include(ta => ta.Subject)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                var sl = search.ToLower();
                query = query.Where(ta => ta.Teacher.Name.ToLower().Contains(sl) ||
                                          ta.Teacher.Email.ToLower().Contains(sl) ||
                                          ta.Class.Name.ToLower().Contains(sl) ||
                                          ta.Subject.Name.ToLower().Contains(sl));
            }

            return await query
                .OrderByDescending(ta => ta.CreatedAt)
                .Select(ta => new TeacherAssignmentViewDto
                {
                    Id = ta.Id,
                    TeacherId = ta.TeacherId,
                    TeacherName = ta.Teacher.Name,
                    TeacherEmail = ta.Teacher.Email,
                    ClassId = ta.ClassId,
                    ClassName = ta.Class.Name,
                    SubjectId = ta.SubjectId,
                    SubjectName = ta.Subject.Name,
                    CreatedAt = ta.CreatedAt
                })
                .ToPaginatedResultAsync(page, pageSize);
        }

        public async Task<PaginatedResult<StudentClassViewDto>> GetStudentClassesAsync(string? search = null, int page = 1, int pageSize = 10)
        {
            var query = _context.StudentClasses
                .Include(sc => sc.Student)
                .Include(sc => sc.Class)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                var sl = search.ToLower();
                query = query.Where(sc => sc.Student.Name.ToLower().Contains(sl) ||
                                          sc.Student.Email.ToLower().Contains(sl) ||
                                          sc.Class.Name.ToLower().Contains(sl));
            }

            return await query
                .OrderByDescending(sc => sc.JoinedAt)
                .Select(sc => new StudentClassViewDto
                {
                    StudentId = sc.StudentId,
                    StudentName = sc.Student.Name,
                    StudentEmail = sc.Student.Email,
                    ClassId = sc.ClassId,
                    ClassName = sc.Class.Name,
                    JoinedAt = sc.JoinedAt
                })
                .ToPaginatedResultAsync(page, pageSize);
        }

        public async Task<PaginatedResult<AdminAssignmentDto>> GetAssignmentsAsync(string? search = null, int page = 1, int pageSize = 10)
        {
            var query = _context.Assignments
                .Include(a => a.Teacher)
                .Include(a => a.Class)
                .Include(a => a.Subject)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                var sl = search.ToLower();
                query = query.Where(a => a.Title.ToLower().Contains(sl) ||
                                         a.Teacher.Name.ToLower().Contains(sl) ||
                                         a.Class.Name.ToLower().Contains(sl) ||
                                         a.Subject.Name.ToLower().Contains(sl));
            }

            return await query
                .OrderByDescending(a => a.CreatedAt)
                .Select(a => new AdminAssignmentDto
                {
                    Id = a.Id,
                    Title = a.Title,
                    TeacherName = a.Teacher.Name,
                    ClassName = a.Class.Name,
                    SubjectName = a.Subject.Name,
                    MaximumMarks = a.MaximumMarks,
                    Deadline = a.Deadline,
                    Status = a.Status.ToString(),
                    CreatedAt = a.CreatedAt
                })
                .ToPaginatedResultAsync(page, pageSize);
        }

        public async Task<PaginatedResult<AdminSubmissionDto>> GetSubmissionsAsync(string? search = null, int page = 1, int pageSize = 10)
        {
            var query = _context.Submissions
                .Include(s => s.Assignment)
                    .ThenInclude(a => a.Teacher)
                .Include(s => s.Assignment)
                    .ThenInclude(a => a.Class)
                .Include(s => s.Assignment)
                    .ThenInclude(a => a.Subject)
                .Include(s => s.Student)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                var sl = search.ToLower();
                query = query.Where(s => s.Student.Name.ToLower().Contains(sl) ||
                                         s.Student.Email.ToLower().Contains(sl) ||
                                         s.Assignment.Title.ToLower().Contains(sl) ||
                                         s.Assignment.Class.Name.ToLower().Contains(sl) ||
                                         s.Assignment.Subject.Name.ToLower().Contains(sl));
            }

            return await query
                .OrderByDescending(s => s.SubmittedAt)
                .Select(s => new AdminSubmissionDto
                {
                    Id = s.Id,
                    AssignmentId = s.AssignmentId,
                    AssignmentTitle = s.Assignment.Title,
                    StudentName = s.Student.Name,
                    StudentEmail = s.Student.Email,
                    ClassName = s.Assignment.Class.Name,
                    SubjectName = s.Assignment.Subject.Name,
                    TeacherName = s.Assignment.Teacher.Name,
                    SubmittedAt = s.SubmittedAt,
                    Status = s.Status.ToString(),
                    Marks = (int?)s.Marks,
                    Feedback = s.Feedback
                })
                .ToPaginatedResultAsync(page, pageSize);
        }
        public async Task<AdminDashboardSummaryDto> GetDashboardSummaryAsync()
        {
            return new AdminDashboardSummaryDto
            {
                TotalUsers = await _context.Users.CountAsync(),
                TotalTeachers = await _context.Users.CountAsync(u => u.Role == "Teacher"),
                TotalStudents = await _context.Users.CountAsync(u => u.Role == "Student"),
                TotalClasses = await _context.Classes.CountAsync(),
                TotalSubjects = await _context.Subjects.CountAsync(),
                TotalTeacherAssignments = await _context.TeacherAssignments.CountAsync(),
                TotalStudentEnrollments = await _context.StudentClasses.CountAsync(),
                TotalAssignments = await _context.Assignments.CountAsync(),
                TotalSubmissions = await _context.Submissions.CountAsync()
            };
        }

        public async Task<SubmissionDto> GetSubmissionAsync(Guid id)
        {
            var submission = await _context.Submissions
                .Include(s => s.Student)
                .Include(s => s.Attachments)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (submission == null) throw new KeyNotFoundException("Submission not found.");

            return new SubmissionDto(
                submission.Id,
                submission.AssignmentId,
                submission.StudentId,
                submission.Student?.Name,
                submission.Student?.Email,
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
