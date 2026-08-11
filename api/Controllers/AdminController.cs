using AssignmentSystem.Core.DTOs;
using AssignmentSystem.Core.Entities;
using AssignmentSystem.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace AssignmentSystem.Api.Controllers
{
    [ApiController]
    [Route("api/admin")]
    [Authorize(Roles = "Admin")]
    public class AdminController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public AdminController(ApplicationDbContext context)
        {
            _context = context;
        }

        // --- CLASSES ---

        [HttpGet("classes")]
        public async Task<IActionResult> GetClasses()
        {
            var classes = await _context.Classes
                .Select(c => new ClassDto(c.Id, c.Name, c.Code, c.Description, c.CreatedAt))
                .ToListAsync();
            return Ok(classes);
        }

        [HttpPost("classes")]
        public async Task<IActionResult> CreateClass([FromBody] CreateClassDto dto)
        {
            if (await _context.Classes.AnyAsync(c => c.Code == dto.Code))
                return BadRequest("Class code already exists.");

            var newClass = new Class
            {
                Id = Guid.NewGuid(),
                Name = dto.Name,
                Code = dto.Code,
                Description = dto.Description
            };

            _context.Classes.Add(newClass);
            await _context.SaveChangesAsync();

            return Ok(new ClassDto(newClass.Id, newClass.Name, newClass.Code, newClass.Description, newClass.CreatedAt));
        }

        [HttpGet("classes/{id}")]
        public async Task<IActionResult> GetClass(Guid id)
        {
            var c = await _context.Classes.FindAsync(id);
            if (c == null) return NotFound("Class not found.");
            
            return Ok(new ClassDto(c.Id, c.Name, c.Code, c.Description, c.CreatedAt));
        }

        [HttpPut("classes/{id}")]
        public async Task<IActionResult> UpdateClass(Guid id, [FromBody] UpdateClassDto dto)
        {
            var existingClass = await _context.Classes.FindAsync(id);
            if (existingClass == null) return NotFound("Class not found.");

            if (existingClass.Code != dto.Code && await _context.Classes.AnyAsync(c => c.Code == dto.Code))
                return Conflict("Class code already exists.");

            existingClass.Name = dto.Name;
            existingClass.Code = dto.Code;
            existingClass.Description = dto.Description;

            await _context.SaveChangesAsync();
            return Ok(new ClassDto(existingClass.Id, existingClass.Name, existingClass.Code, existingClass.Description, existingClass.CreatedAt));
        }

        [HttpDelete("classes/{id}")]
        public async Task<IActionResult> DeleteClass(Guid id)
        {
            var existingClass = await _context.Classes.FindAsync(id);
            if (existingClass == null) return NotFound("Class not found.");

            _context.Classes.Remove(existingClass);

            try
            {
                await _context.SaveChangesAsync();
                return NoContent();
            }
            catch (DbUpdateException)
            {
                return BadRequest("Cannot delete class because it is currently assigned to teachers or students.");
            }
        }

        // --- SUBJECTS ---

        [HttpGet("subjects")]
        public async Task<IActionResult> GetSubjects()
        {
            var subjects = await _context.Subjects
                .Select(s => new SubjectDto(s.Id, s.Name, s.Code, s.Description, s.CreatedAt))
                .ToListAsync();
            return Ok(subjects);
        }

        [HttpPost("subjects")]
        public async Task<IActionResult> CreateSubject([FromBody] CreateSubjectDto dto)
        {
            if (await _context.Subjects.AnyAsync(s => s.Code == dto.Code))
                return BadRequest("Subject code already exists.");

            var newSubject = new Subject
            {
                Id = Guid.NewGuid(),
                Name = dto.Name,
                Code = dto.Code,
                Description = dto.Description
            };

            _context.Subjects.Add(newSubject);
            await _context.SaveChangesAsync();

            return Ok(new SubjectDto(newSubject.Id, newSubject.Name, newSubject.Code, newSubject.Description, newSubject.CreatedAt));
        }

        [HttpGet("subjects/{id}")]
        public async Task<IActionResult> GetSubject(Guid id)
        {
            var s = await _context.Subjects.FindAsync(id);
            if (s == null) return NotFound("Subject not found.");
            
            return Ok(new SubjectDto(s.Id, s.Name, s.Code, s.Description, s.CreatedAt));
        }

        [HttpPut("subjects/{id}")]
        public async Task<IActionResult> UpdateSubject(Guid id, [FromBody] UpdateSubjectDto dto)
        {
            var existingSubject = await _context.Subjects.FindAsync(id);
            if (existingSubject == null) return NotFound("Subject not found.");

            if (existingSubject.Code != dto.Code && await _context.Subjects.AnyAsync(s => s.Code == dto.Code))
                return Conflict("Subject code already exists.");

            existingSubject.Name = dto.Name;
            existingSubject.Code = dto.Code;
            existingSubject.Description = dto.Description;

            await _context.SaveChangesAsync();
            return Ok(new SubjectDto(existingSubject.Id, existingSubject.Name, existingSubject.Code, existingSubject.Description, existingSubject.CreatedAt));
        }

        [HttpDelete("subjects/{id}")]
        public async Task<IActionResult> DeleteSubject(Guid id)
        {
            var existingSubject = await _context.Subjects.FindAsync(id);
            if (existingSubject == null) return NotFound("Subject not found.");

            _context.Subjects.Remove(existingSubject);

            try
            {
                await _context.SaveChangesAsync();
                return NoContent();
            }
            catch (DbUpdateException)
            {
                return BadRequest("Cannot delete subject because it is currently assigned to teachers.");
            }
        }

        // --- TEACHER ASSIGNMENTS ---

        [HttpPost("teacher-assignments")]
        public async Task<IActionResult> AssignTeacher([FromBody] AssignTeacherDto dto)
        {
            var teacher = await _context.Users.FindAsync(dto.TeacherId);
            if (teacher == null) return NotFound("Teacher not found.");
            if (teacher.Role != "Teacher") return BadRequest("User is not a Teacher.");

            var classExists = await _context.Classes.AnyAsync(c => c.Id == dto.ClassId);
            if (!classExists) return NotFound("Class not found.");

            var subjectExists = await _context.Subjects.AnyAsync(s => s.Id == dto.SubjectId);
            if (!subjectExists) return NotFound("Subject not found.");

            var exists = await _context.TeacherAssignments
                .AnyAsync(ta => ta.TeacherId == dto.TeacherId && ta.ClassId == dto.ClassId && ta.SubjectId == dto.SubjectId);
            if (exists) return BadRequest("Teacher is already assigned to this class and subject.");

            var assignment = new TeacherAssignment
            {
                Id = Guid.NewGuid(),
                TeacherId = dto.TeacherId,
                ClassId = dto.ClassId,
                SubjectId = dto.SubjectId
            };

            _context.TeacherAssignments.Add(assignment);
            await _context.SaveChangesAsync();

            return Ok(new TeacherAssignmentDto(assignment.Id, assignment.TeacherId, assignment.ClassId, assignment.SubjectId, assignment.CreatedAt));
        }

        // --- STUDENT ENROLLMENTS ---

        [HttpPost("student-enrollments")]
        public async Task<IActionResult> EnrollStudent([FromBody] EnrollStudentDto dto)
        {
            var student = await _context.Users.FindAsync(dto.StudentId);
            if (student == null) return NotFound("Student not found.");
            if (student.Role != "Student") return BadRequest("User is not a Student.");

            var classExists = await _context.Classes.AnyAsync(c => c.Id == dto.ClassId);
            if (!classExists) return NotFound("Class not found.");

            var exists = await _context.StudentClasses
                .AnyAsync(sc => sc.StudentId == dto.StudentId && sc.ClassId == dto.ClassId);
            if (exists) return BadRequest("Student is already enrolled in this class.");

            var enrollment = new StudentClass
            {
                StudentId = dto.StudentId,
                ClassId = dto.ClassId
            };

            _context.StudentClasses.Add(enrollment);
            await _context.SaveChangesAsync();

            return Ok(new StudentClassDto(enrollment.StudentId, enrollment.ClassId, enrollment.JoinedAt));
        }
    }
}
