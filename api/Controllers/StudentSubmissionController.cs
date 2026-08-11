using System;
using System.Security.Claims;
using System.Threading.Tasks;
using AssignmentSystem.Core.DTOs;
using AssignmentSystem.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace AssignmentSystem.Api.Controllers
{
    [ApiController]
    [Route("api/student/submissions")]
    [Authorize(Roles = "Student")]
    public class StudentSubmissionController : ControllerBase
    {
        private readonly ISubmissionService _submissionService;

        public StudentSubmissionController(ISubmissionService submissionService)
        {
            _submissionService = submissionService;
        }

        private Guid GetStudentId()
        {
            var idStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (Guid.TryParse(idStr, out var id)) return id;
            throw new UnauthorizedAccessException("Invalid student token.");
        }

        [HttpPost]
        public async Task<IActionResult> SubmitAnswer([FromBody] CreateSubmissionDto dto)
        {
            try
            {
                var studentId = GetStudentId();
                var submission = await _submissionService.SubmitAnswerAsync(studentId, dto);
                // Return 201 Created. The route to GET is below.
                return CreatedAtAction(nameof(GetSubmission), new { submissionId = submission.Id }, submission);
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(StatusCodes.Status403Forbidden, ex.Message);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("{submissionId}")]
        public async Task<IActionResult> GetSubmission(Guid submissionId)
        {
            try
            {
                var studentId = GetStudentId();
                var submission = await _submissionService.GetSubmissionAsync(studentId, submissionId);
                if (submission == null) return NotFound("Submission not found.");
                return Ok(submission);
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(StatusCodes.Status403Forbidden, ex.Message);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPut("{submissionId}")]
        public async Task<IActionResult> UpdateSubmission(Guid submissionId, [FromBody] UpdateSubmissionDto dto)
        {
            try
            {
                var studentId = GetStudentId();
                var submission = await _submissionService.UpdateSubmissionAsync(studentId, submissionId, dto);
                return Ok(submission);
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(StatusCodes.Status403Forbidden, ex.Message);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("{submissionId}/attachments")]
        public async Task<IActionResult> UploadAttachment(Guid submissionId, IFormFile file)
        {
            try
            {
                var studentId = GetStudentId();
                if (file == null || file.Length == 0) return BadRequest("File is empty.");

                using var stream = file.OpenReadStream();
                var attachment = await _submissionService.UploadAttachmentAsync(
                    studentId, 
                    submissionId, 
                    file.FileName, 
                    file.ContentType, 
                    file.Length, 
                    stream);
                
                return Ok(attachment);
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(StatusCodes.Status403Forbidden, ex.Message);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpDelete("{submissionId}/attachments/{attachmentId}")]
        public async Task<IActionResult> DeleteAttachment(Guid submissionId, Guid attachmentId)
        {
            try
            {
                var studentId = GetStudentId();
                await _submissionService.DeleteAttachmentAsync(studentId, submissionId, attachmentId);
                return NoContent();
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(StatusCodes.Status403Forbidden, ex.Message);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}
