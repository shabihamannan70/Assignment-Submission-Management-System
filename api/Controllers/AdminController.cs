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
        public async Task<IActionResult> GetClasses()
        {
            var classes = await _adminService.GetClassesAsync();
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
            await _adminService.DeleteClassAsync(id);
            return NoContent();
        }

        // --- SUBJECTS ---

        [HttpGet("subjects")]
        public async Task<IActionResult> GetSubjects()
        {
            var subjects = await _adminService.GetSubjectsAsync();
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
            await _adminService.DeleteSubjectAsync(id);
            return NoContent();
        }

        // --- TEACHER ASSIGNMENTS ---

        [HttpPost("teacher-assignments")]
        public async Task<IActionResult> AssignTeacher([FromBody] AssignTeacherDto dto)
        {
            var assignment = await _adminService.AssignTeacherAsync(dto);
            return Ok(assignment);
        }

        // --- STUDENT ENROLLMENTS ---

        [HttpPost("student-enrollments")]
        public async Task<IActionResult> EnrollStudent([FromBody] EnrollStudentDto dto)
        {
            var enrollment = await _adminService.EnrollStudentAsync(dto);
            return Ok(enrollment);
        }
    }
}
