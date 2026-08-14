using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using AssignmentSystem.Core.Enums;

namespace AssignmentSystem.Core.DTOs
{
    public record CreateAssignmentDto(
        [Required] string Title, 
        string Description, 
        [Required] Guid ClassId, 
        [Required] Guid SubjectId, 
        [Required] DateTimeOffset Deadline, 
        [Range(1, int.MaxValue, ErrorMessage = "Maximum marks must be greater than zero.")] int MaximumMarks,
        AssignmentStatus Status = AssignmentStatus.Draft
    );
    
    public record UpdateAssignmentDto(
        [Required] string Title, 
        string Description, 
        [Required] DateTimeOffset Deadline, 
        [Range(1, int.MaxValue, ErrorMessage = "Maximum marks must be greater than zero.")] int MaximumMarks
    );
    
    public record AssignmentDto(Guid Id, string Title, string Description, Guid ClassId, Guid SubjectId, Guid TeacherId, DateTimeOffset Deadline, int MaximumMarks, AssignmentStatus Status, DateTimeOffset CreatedAt, DateTimeOffset UpdatedAt, IEnumerable<AssignmentAttachmentDto>? Attachments = null);
}
