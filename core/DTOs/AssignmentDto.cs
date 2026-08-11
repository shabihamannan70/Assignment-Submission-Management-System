using System;
using AssignmentSystem.Core.Enums;

namespace AssignmentSystem.Core.DTOs
{
    public record CreateAssignmentDto(string Title, string Description, Guid ClassId, Guid SubjectId, DateTimeOffset Deadline, int MaximumMarks);
    public record UpdateAssignmentDto(string Title, string Description, DateTimeOffset Deadline, int MaximumMarks);
    public record AssignmentDto(Guid Id, string Title, string Description, Guid ClassId, Guid SubjectId, Guid TeacherId, DateTimeOffset Deadline, int MaximumMarks, AssignmentStatus Status, DateTimeOffset CreatedAt, DateTimeOffset UpdatedAt);
}
