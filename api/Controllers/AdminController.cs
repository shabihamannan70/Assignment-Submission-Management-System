using AssignmentSystem.Core.DTOs;
using AssignmentSystem.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;

namespace AssignmentSystem.Api.Controllers
{
    [ApiController]
    [Route("api/admin")]
    [Authorize(Roles = "Admin")]
    public class AdminController : ControllerBase
    {
        private readonly IAdminService _adminService;

        public AdminController(IAdminService adminService)
        {
            _adminService = adminService;
        }

        // --- CLASSES ---

        [HttpGet("classes")]
        public async Task<IActionResult> GetClasses([FromQuery] string? search, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            var classes = await _adminService.GetClassesAsync(search, page, pageSize);
            return Ok(classes);
        }

        [HttpPost("classes")]
        public async Task<IActionResult> CreateClass([FromBody] CreateClassDto dto)
        {
            var newClass = await _adminService.CreateClassAsync(dto);
            return Ok(newClass);
        }

        [HttpGet("classes/{id}")]
        public async Task<IActionResult> GetClass(Guid id)
        {
            var c = await _adminService.GetClassAsync(id);
            return Ok(c);
        }

        [HttpPut("classes/{id}")]
        public async Task<IActionResult> UpdateClass(Guid id, [FromBody] UpdateClassDto dto)
        {
            var updatedClass = await _adminService.UpdateClassAsync(id, dto);
            return Ok(updatedClass);
        }

        [HttpDelete("classes/{id}")]
        public async Task<IActionResult> DeleteClass(Guid id)
        {
            var result = await _adminService.DeleteClassAsync(id);
            if (!result.Success)
            {
                return Conflict(new ApiErrorResponse { StatusCode = 409, Message = result.ErrorMessage! });
            }
            return NoContent();
        }

        // --- SUBJECTS ---

        [HttpGet("subjects")]
        public async Task<IActionResult> GetSubjects([FromQuery] string? search, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            var subjects = await _adminService.GetSubjectsAsync(search, page, pageSize);
            return Ok(subjects);
        }

        [HttpPost("subjects")]
        public async Task<IActionResult> CreateSubject([FromBody] CreateSubjectDto dto)
        {
            var newSubject = await _adminService.CreateSubjectAsync(dto);
            return Ok(newSubject);
        }

        [HttpGet("subjects/{id}")]
        public async Task<IActionResult> GetSubject(Guid id)
        {
            var s = await _adminService.GetSubjectAsync(id);
            return Ok(s);
        }

        [HttpPut("subjects/{id}")]
        public async Task<IActionResult> UpdateSubject(Guid id, [FromBody] UpdateSubjectDto dto)
        {
            var updatedSubject = await _adminService.UpdateSubjectAsync(id, dto);
            return Ok(updatedSubject);
        }

        [HttpDelete("subjects/{id}")]
        public async Task<IActionResult> DeleteSubject(Guid id)
        {
            var result = await _adminService.DeleteSubjectAsync(id);
            if (!result.Success)
            {
                return Conflict(new ApiErrorResponse { StatusCode = 409, Message = result.ErrorMessage! });
            }
            return NoContent();
        }

        // --- TEACHER ASSIGNMENTS ---

        [HttpGet("teacher-assignments")]
        public async Task<IActionResult> GetTeacherAssignments([FromQuery] string? search, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            var assignments = await _adminService.GetTeacherAssignmentsAsync(search, page, pageSize);
            return Ok(assignments);
        }

        [HttpGet("teacher-assignments/{id}")]
        public async Task<IActionResult> GetTeacherAssignment(Guid id)
        {
            var assignment = await _adminService.GetTeacherAssignmentAsync(id);
            return Ok(assignment);
        }

        [HttpPost("teacher-assignments")]
        public async Task<IActionResult> AssignTeacher([FromBody] AssignTeacherDto dto)
        {
            var assignment = await _adminService.AssignTeacherAsync(dto);
            return Ok(assignment);
        }

        [HttpPut("teacher-assignments/{id}")]
        public async Task<IActionResult> UpdateTeacherAssignment(Guid id, [FromBody] AssignTeacherDto dto)
        {
            var updatedAssignment = await _adminService.UpdateTeacherAssignmentAsync(id, dto);
            return Ok(updatedAssignment);
        }

        [HttpDelete("teacher-assignments/{id}")]
        public async Task<IActionResult> DeleteTeacherAssignment(Guid id)
        {
            await _adminService.DeleteTeacherAssignmentAsync(id);
            return NoContent();
        }

        // --- STUDENT ENROLLMENTS ---

        [HttpPost("student-enrollments")]
        public async Task<IActionResult> EnrollStudent([FromBody] EnrollStudentDto dto)
        {
            var enrollment = await _adminService.EnrollStudentAsync(dto);
            return Ok(enrollment);
        }

        [HttpGet("student-enrollments")]
        public async Task<IActionResult> GetStudentEnrollments([FromQuery] string? search, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            var enrollments = await _adminService.GetStudentClassesAsync(search, page, pageSize);
            return Ok(enrollments);
        }

        [HttpPut("student-enrollments/{studentId}/{oldClassId}")]
        public async Task<IActionResult> UpdateStudentEnrollment(Guid studentId, Guid oldClassId, [FromBody] EnrollStudentDto dto)
        {
            var enrollment = await _adminService.UpdateStudentEnrollmentAsync(studentId, oldClassId, dto);
            return Ok(enrollment);
        }

        [HttpDelete("student-enrollments/{studentId}/{classId}")]
        public async Task<IActionResult> DeleteStudentEnrollment(Guid studentId, Guid classId)
        {
            await _adminService.DeleteStudentEnrollmentAsync(studentId, classId);
            return NoContent();
        }

        // --- USERS ---

        [HttpGet("users")]
        public async Task<IActionResult> GetUsers([FromQuery] string? role, [FromQuery] string? search, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            var users = await _adminService.GetUsersAsync(role, search, page, pageSize);
            return Ok(users);
        }

        [HttpGet("users/{id}")]
        public async Task<IActionResult> GetUser(Guid id)
        {
            var user = await _adminService.GetUserAsync(id);
            return Ok(user);
        }

        [HttpPost("users")]
        public async Task<IActionResult> CreateUser([FromBody] CreateUserDto dto)
        {
            var user = await _adminService.CreateUserAsync(dto);
            return Ok(user);
        }

        [HttpPut("users/{id}")]
        public async Task<IActionResult> UpdateUser(Guid id, [FromBody] UpdateUserDto dto)
        {
            var user = await _adminService.UpdateUserAsync(id, dto);
            return Ok(user);
        }

        [HttpPut("users/{id}/toggle-active")]
        public async Task<IActionResult> ToggleUserActiveStatus(Guid id)
        {
            var user = await _adminService.ToggleUserActiveStatusAsync(id);
            return Ok(user);
        }

        // --- ASSIGNMENT & SUBMISSION VIEWS ---

        [HttpGet("assignments")]
        public async Task<IActionResult> GetAssignments([FromQuery] string? search, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            var assignments = await _adminService.GetAssignmentsAsync(search, page, pageSize);
            return Ok(assignments);
        }

        [HttpGet("submissions")]
        public async Task<IActionResult> GetSubmissions([FromQuery] string? search, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            var submissions = await _adminService.GetSubmissionsAsync(search, page, pageSize);
            return Ok(submissions);
        }

        [HttpGet("submissions/{id}")]
        public async Task<IActionResult> GetSubmission(Guid id)
        {
            var submission = await _adminService.GetSubmissionAsync(id);
            return Ok(submission);
        }

        [HttpGet("dashboard")]
        public async Task<IActionResult> GetDashboardSummary()
        {
            var summary = await _adminService.GetDashboardSummaryAsync();
            return Ok(summary);
        }
    }
}
