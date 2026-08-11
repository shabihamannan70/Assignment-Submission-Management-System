using System.ComponentModel.DataAnnotations;

namespace AssignmentSystem.Core.DTOs
{
    public record LoginRequest(
        [Required] [EmailAddress] string Email, 
        [Required] string Password
    );
}
