using System;

namespace AssignmentSystem.Core.DTOs
{
    public record AssignTeacherDto(Guid TeacherId, Guid ClassId, Guid SubjectId);
    public record TeacherAssignmentDto(Guid Id, Guid TeacherId, Guid ClassId, Guid SubjectId, DateTimeOffset CreatedAt);

    public record EnrollStudentDto(Guid StudentId, Guid ClassId);
    public record StudentClassDto(Guid StudentId, Guid ClassId, DateTimeOffset JoinedAt);
}
