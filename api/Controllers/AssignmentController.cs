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
    [Route("api/assignments")]
    [Authorize(Roles = "Teacher")]
    public class AssignmentController : ControllerBase
    {
        private readonly IAssignmentService _assignmentService;

        public AssignmentController(IAssignmentService assignmentService)
        {
            _assignmentService = assignmentService;
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

        [HttpPost]
        public async Task<IActionResult> CreateAssignment([FromBody] CreateAssignmentDto dto)
        {
            var teacherId = GetUserId();
            var result = await _assignmentService.CreateAssignmentAsync(teacherId, dto);
            return CreatedAtAction(nameof(GetAssignment), new { id = result.Id }, result);
        }

        [HttpGet("my")]
        public async Task<IActionResult> GetMyAssignments()
        {
            var teacherId = GetUserId();
            var assignments = await _assignmentService.GetMyAssignmentsAsync(teacherId);
            return Ok(assignments);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetAssignment(Guid id)
        {
            var teacherId = GetUserId();
            var result = await _assignmentService.GetAssignmentAsync(teacherId, id);
            return Ok(result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateAssignment(Guid id, [FromBody] UpdateAssignmentDto dto)
        {
            var teacherId = GetUserId();
            var result = await _assignmentService.UpdateAssignmentAsync(teacherId, id, dto);
            return Ok(result);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAssignment(Guid id)
        {
            var teacherId = GetUserId();
            await _assignmentService.DeleteAssignmentAsync(teacherId, id);
            return NoContent();
        }

        [HttpPost("{id}/publish")]
        public async Task<IActionResult> PublishAssignment(Guid id)
        {
            var teacherId = GetUserId();
            var result = await _assignmentService.PublishAssignmentAsync(teacherId, id);
            return Ok(result);
        }
    }
}
