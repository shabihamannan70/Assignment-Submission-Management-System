using System;
using System.ComponentModel.DataAnnotations;

namespace AssignmentSystem.Core.DTOs
{
    public record ClassDto(Guid Id, string Name, string Code, string Description, DateTimeOffset CreatedAt);
    
    public record CreateClassDto(
        [Required] string Name, 
        [Required] string Code, 
        string Description
    );
    
    public record UpdateClassDto(
        [Required] string Name, 
        [Required] string Code, 
        string Description
    );
}
