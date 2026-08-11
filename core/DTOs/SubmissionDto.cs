using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using AssignmentSystem.Core.Enums;

namespace AssignmentSystem.Core.DTOs
{
    public record StudentAssignmentDto(
        Guid Id,
        string Title,
        Guid ClassId,
        Guid SubjectId,
        Guid TeacherId,
        DateTimeOffset Deadline,
        int MaximumMarks,
        DateTimeOffset CreatedAt
    );

    public record StudentAssignmentDetailsDto(
        Guid Id,
        string Title,
        string Description,
        Guid ClassId,
        Guid SubjectId,
        Guid TeacherId,
        DateTimeOffset Deadline,
        int MaximumMarks,
        DateTimeOffset CreatedAt,
        SubmissionDto? Submission
    );

    public record CreateSubmissionDto(
        [Required] Guid AssignmentId,
        string? Answer
    );

    public record UpdateSubmissionDto(
        string? Answer
    );

    public record SubmissionDto(
        Guid Id,
        Guid AssignmentId,
        Guid StudentId,
        string? Answer,
        DateTimeOffset SubmittedAt,
        DateTimeOffset? UpdatedAt,
        SubmissionStatus Status,
        decimal? Marks,
        string? Feedback,
        IEnumerable<SubmissionAttachmentDto> Attachments
    );

    public record SubmissionAttachmentDto(
        Guid Id,
        string FileName,
        string ContentType,
        long FileSize,
        DateTimeOffset UploadedAt
    );

    public record GradeSubmissionDto(
        [Range(0, double.MaxValue, ErrorMessage = "Marks cannot be negative.")] decimal Marks,
        string? Feedback
    );
}
