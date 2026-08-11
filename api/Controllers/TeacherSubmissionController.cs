using System;
using System.Security.Claims;
using System.Threading.Tasks;
using AssignmentSystem.Core.DTOs;
using AssignmentSystem.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AssignmentSystem.Api.Controllers
{
    [ApiController]
    [Route("api/teacher")]
    [Authorize(Roles = "Teacher")]
    public class TeacherSubmissionController : ControllerBase
    {
        private readonly ISubmissionService _submissionService;

        public TeacherSubmissionController(ISubmissionService submissionService)
        {
            _submissionService = submissionService;
        }

        private Guid GetUserId()
        {
            var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(idClaim) || !Guid.TryParse(idClaim, out var userId))
            {
                throw new UnauthorizedAccessException("User ID is missing from token.");
            }
            return userId;
        }

        [HttpGet("assignments/{assignmentId}/submissions")]
        public async Task<IActionResult> GetSubmissionsForAssignment(Guid assignmentId)
        {
            var teacherId = GetUserId();
            var submissions = await _submissionService.GetSubmissionsForAssignmentAsync(teacherId, assignmentId);
            return Ok(submissions);
        }

        [HttpGet("submissions/{submissionId}")]
        public async Task<IActionResult> GetSubmission(Guid submissionId)
        {
            var teacherId = GetUserId();
            var submission = await _submissionService.GetSubmissionForTeacherAsync(teacherId, submissionId);
            return Ok(submission);
        }

        [HttpPut("submissions/{submissionId}/grade")]
        public async Task<IActionResult> GradeSubmission(Guid submissionId, [FromBody] GradeSubmissionDto dto)
        {
            var teacherId = GetUserId();
            var result = await _submissionService.GradeSubmissionAsync(teacherId, submissionId, dto);
            return Ok(result);
        }
    }
}
