using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AssignmentSystem.Api.Controllers
{
    [ApiController]
    [Route("api/authorization-test")]
    public class AuthorizationTestController : ControllerBase
    {
        [HttpGet("admin")]
        [Authorize(Roles = "Admin")]
        public IActionResult AdminEndpoint()
        {
            return Ok(new { message = "Admin authorization successful" });
        }

        [HttpGet("teacher")]
        [Authorize(Roles = "Teacher")]
        public IActionResult TeacherEndpoint()
        {
            return Ok(new { message = "Teacher authorization successful" });
        }

        [HttpGet("student")]
        [Authorize(Roles = "Student")]
        public IActionResult StudentEndpoint()
        {
            return Ok(new { message = "Student authorization successful" });
        }
    }
}
