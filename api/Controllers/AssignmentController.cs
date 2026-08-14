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
            var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                ?? User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value;
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
        public async Task<IActionResult> GetMyAssignments([FromQuery] string? search, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            var teacherId = GetUserId();
            var assignments = await _assignmentService.GetMyAssignmentsAsync(teacherId, search, page, pageSize);
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

        [HttpPatch("{id}/toggle-status")]
        public async Task<IActionResult> ToggleAssignmentStatus(Guid id)
        {
            var teacherId = GetUserId();
            var result = await _assignmentService.ToggleAssignmentStatusAsync(teacherId, id);
            return Ok(result);
        }

        [HttpPost("{id}/attachments")]
        public async Task<IActionResult> UploadAttachment(Guid id, Microsoft.AspNetCore.Http.IFormFile file)
        {
            var teacherId = GetUserId();
            if (file == null || file.Length == 0) return BadRequest("File is empty.");

            using var stream = file.OpenReadStream();
            var attachment = await _assignmentService.UploadAttachmentAsync(
                teacherId, 
                id, 
                file.FileName, 
                file.ContentType, 
                file.Length, 
                stream);
            
            return Ok(attachment);
        }

        [HttpDelete("{id}/attachments/{attachmentId}")]
        public async Task<IActionResult> DeleteAttachment(Guid id, Guid attachmentId)
        {
            var teacherId = GetUserId();
            await _assignmentService.DeleteAttachmentAsync(teacherId, id, attachmentId);
            return NoContent();
        }
    }
}
