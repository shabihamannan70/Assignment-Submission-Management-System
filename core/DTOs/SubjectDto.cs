using System;
using System.ComponentModel.DataAnnotations;

namespace AssignmentSystem.Core.DTOs
{
    public record SubjectDto(Guid Id, string Name, string Code, string Description, DateTimeOffset CreatedAt);
    
    public record CreateSubjectDto(
        [Required] string Name, 
        [Required] string Code, 
        string Description
    );
    
    public record UpdateSubjectDto(
        [Required] string Name, 
        [Required] string Code, 
        string Description
    );
}
