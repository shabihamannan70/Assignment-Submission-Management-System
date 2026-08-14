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
            var idStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                ?? User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value;
            if (Guid.TryParse(idStr, out var id)) return id;
            throw new UnauthorizedAccessException("Invalid student token.");
        }

        [HttpGet]
        public async Task<IActionResult> GetMyAssignments([FromQuery] string? search, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            var studentId = GetStudentId();
            var assignments = await _submissionService.GetStudentAssignmentsAsync(studentId, search, page, pageSize);
            return Ok(assignments);
        }

        [HttpGet("results")]
        public async Task<IActionResult> GetMyResults([FromQuery] string? search, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            var studentId = GetStudentId();
            var results = await _submissionService.GetStudentResultsAsync(studentId, search, page, pageSize);
            return Ok(results);
        }

        [HttpGet("{assignmentId}")]
        public async Task<IActionResult> GetAssignmentDetails(Guid assignmentId)
        {
            var studentId = GetStudentId();
            var details = await _submissionService.GetStudentAssignmentDetailsAsync(studentId, assignmentId);
            if (details == null) return NotFound("Assignment not found or access denied.");
            return Ok(details);
        }
        [HttpGet("{assignmentId}/result")]
        public async Task<IActionResult> GetAssignmentResult(Guid assignmentId)
        {
            try
            {
                var studentId = GetStudentId();
                var result = await _submissionService.GetStudentAssignmentResultAsync(studentId, assignmentId);
                return Ok(result);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}
