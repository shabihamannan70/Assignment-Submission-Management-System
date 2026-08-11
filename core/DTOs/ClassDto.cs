using System;

namespace AssignmentSystem.Core.DTOs
{
    public record ClassDto(Guid Id, string Name, string Code, string Description, DateTimeOffset CreatedAt);
    public record CreateClassDto(string Name, string Code, string Description);
    public record UpdateClassDto(string Name, string Code, string Description);
}
