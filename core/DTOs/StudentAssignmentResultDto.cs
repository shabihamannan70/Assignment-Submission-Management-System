using System;
using System.Collections.Generic;

namespace AssignmentSystem.Core.DTOs
{
    public record StudentAssignmentResultDto(
        Guid AssignmentId,
        string AssignmentTitle,
        string SubjectName,
        string TeacherName,
        DateTimeOffset Deadline,
        int MaxMarks,
        Guid SubmissionId,
        DateTimeOffset SubmittedAt,
        DateTimeOffset? UpdatedAt,
        string? Answer,
        decimal? Marks,
        string? Feedback,
        string Status,
        IEnumerable<SubmissionAttachmentDto> Attachments
    );
}
