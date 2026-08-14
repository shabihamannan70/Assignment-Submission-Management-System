using System;
using System.Security.Claims;
using System.Threading.Tasks;
using AssignmentSystem.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AssignmentSystem.Api.Controllers
{
    [ApiController]
    [Route("api/submissions")]
    public class SubmissionDownloadController : ControllerBase
    {
        private readonly ISubmissionService _submissionService;

        public SubmissionDownloadController(ISubmissionService submissionService)
        {
            _submissionService = submissionService;
        }

        private (Guid userId, string role) GetUserIdentity()
        {
            var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                ?? User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value;
                
            var roleClaim = User.FindFirst(ClaimTypes.Role)?.Value;

            if (string.IsNullOrEmpty(idClaim) || !Guid.TryParse(idClaim, out var userId) || string.IsNullOrEmpty(roleClaim))
            {
                throw new UnauthorizedAccessException("User ID or Role is missing from token.");
            }
            return (userId, roleClaim);
        }

        [HttpGet("{submissionId}/attachments/{attachmentId}/download")]
        [Authorize]
        public async Task<IActionResult> DownloadAttachment(Guid submissionId, Guid attachmentId)
        {
            var (userId, role) = GetUserIdentity();
            var (stream, contentType, fileName) = await _submissionService.DownloadAttachmentAsync(userId, role, submissionId, attachmentId);
            return File(stream, contentType, fileName);
        }
    }
}
