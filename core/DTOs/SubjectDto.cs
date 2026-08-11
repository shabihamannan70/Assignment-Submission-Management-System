using System;

namespace AssignmentSystem.Core.DTOs
{
    public record SubjectDto(Guid Id, string Name, string Code, string Description, DateTimeOffset CreatedAt);
    public record CreateSubjectDto(string Name, string Code, string Description);
    public record UpdateSubjectDto(string Name, string Code, string Description);
}
