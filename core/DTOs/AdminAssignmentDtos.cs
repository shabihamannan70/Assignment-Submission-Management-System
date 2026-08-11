using System;
using System.ComponentModel.DataAnnotations;

namespace AssignmentSystem.Core.DTOs
{
    public record AssignTeacherDto(
        [Required] Guid TeacherId, 
        [Required] Guid ClassId, 
        [Required] Guid SubjectId
    );
    
    public record TeacherAssignmentDto(Guid Id, Guid TeacherId, Guid ClassId, Guid SubjectId, DateTimeOffset CreatedAt);

    public record EnrollStudentDto(
        [Required] Guid StudentId, 
        [Required] Guid ClassId
    );
    
    public record StudentClassDto(Guid StudentId, Guid ClassId, DateTimeOffset JoinedAt);
}
