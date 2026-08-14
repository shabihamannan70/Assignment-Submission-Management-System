using System;
using System.Security.Claims;
using System.Threading.Tasks;
using AssignmentSystem.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AssignmentSystem.Api.Controllers
{
    [ApiController]
    [Route("api/student/dashboard")]
    [Authorize(Roles = "Student")]
    public class StudentDashboardController : ControllerBase
    {
        private readonly ISubmissionService _submissionService;

        public StudentDashboardController(ISubmissionService submissionService)
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
        public async Task<IActionResult> GetDashboard()
        {
            var studentId = GetStudentId();
            var dashboard = await _submissionService.GetStudentDashboardAsync(studentId);
            return Ok(dashboard);
        }
    }
}
