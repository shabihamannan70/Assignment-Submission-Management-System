using System;
using System.Security.Claims;
using System.Threading.Tasks;
using AssignmentSystem.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AssignmentSystem.Api.Controllers
{
    [ApiController]
    [Route("api/student/assignments")]
    [Authorize(Roles = "Student")]
    public class StudentAssignmentController : ControllerBase
    {
        private readonly ISubmissionService _submissionService;

        public StudentAssignmentController(ISubmissionService submissionService)
        {
            _submissionService = submissionService;
        }

        private Guid GetStudentId()
        {
            var idStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (Guid.TryParse(idStr, out var id)) return id;
            throw new UnauthorizedAccessException("Invalid student token.");
        }

        [HttpGet]
        public async Task<IActionResult> GetMyAssignments()
        {
            var studentId = GetStudentId();
            var assignments = await _submissionService.GetStudentAssignmentsAsync(studentId);
            return Ok(assignments);
        }

        [HttpGet("{assignmentId}")]
        public async Task<IActionResult> GetAssignmentDetails(Guid assignmentId)
        {
            var studentId = GetStudentId();
            var details = await _submissionService.GetStudentAssignmentDetailsAsync(studentId, assignmentId);
            if (details == null) return NotFound("Assignment not found or access denied.");
            return Ok(details);
        }
    }
}
