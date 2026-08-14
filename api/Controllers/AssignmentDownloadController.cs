using System;
using System.Security.Claims;
using System.Threading.Tasks;
using AssignmentSystem.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AssignmentSystem.Api.Controllers
{
    [ApiController]
    [Route("api/assignments")]
    public class AssignmentDownloadController : ControllerBase
    {
        private readonly IAssignmentService _assignmentService;

        public AssignmentDownloadController(IAssignmentService assignmentService)
        {
            _assignmentService = assignmentService;
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

        [HttpGet("{assignmentId}/attachments/{attachmentId}/download")]
        [Authorize]
        public async Task<IActionResult> DownloadAttachment(Guid assignmentId, Guid attachmentId)
        {
            var (userId, role) = GetUserIdentity();
            var (stream, contentType, fileName) = await _assignmentService.DownloadAttachmentAsync(userId, role, assignmentId, attachmentId);
            return File(stream, contentType, fileName);
        }
    }
}
