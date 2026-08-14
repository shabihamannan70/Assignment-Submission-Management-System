using System;
using System.Collections.Generic;

namespace AssignmentSystem.Core.DTOs
{
    public record StudentDashboardDto(
        int TotalAssignments,
        int PendingCount,
        int SubmittedCount,
        int GradedCount,
        decimal? AverageScore,
        IEnumerable<StudentDashboardAssignmentDto> RecentAssignments
    );

    public record StudentDashboardAssignmentDto(
        Guid AssignmentId,
        string Title,
        string ClassName,
        string SubjectName,
        string TeacherName,
        string? TeacherEmail,
        DateTimeOffset Deadline,
        int MaximumMarks,
        string Description,
        Guid? SubmissionId,
        string DashboardStatus,
        decimal? Marks,
        string? Feedback,
        DateTimeOffset? SubmittedAt,
        string? Answer,
        IEnumerable<SubmissionAttachmentDto>? Attachments
    );
}
