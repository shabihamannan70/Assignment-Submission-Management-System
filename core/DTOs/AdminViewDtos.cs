using System;

namespace AssignmentSystem.Core.DTOs
{
    public class AdminAssignmentDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string TeacherName { get; set; } = string.Empty;
        public string ClassName { get; set; } = string.Empty;
        public string SubjectName { get; set; } = string.Empty;
        public int MaximumMarks { get; set; }
        public DateTimeOffset Deadline { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTimeOffset CreatedAt { get; set; }
    }

    public class AdminSubmissionDto
    {
        public Guid Id { get; set; }
        public Guid AssignmentId { get; set; }
        public string AssignmentTitle { get; set; } = string.Empty;
        public string StudentName { get; set; } = string.Empty;
        public string StudentEmail { get; set; } = string.Empty;
        public string ClassName { get; set; } = string.Empty;
        public string SubjectName { get; set; } = string.Empty;
        public string TeacherName { get; set; } = string.Empty;
        public DateTimeOffset SubmittedAt { get; set; }
        public string Status { get; set; } = string.Empty;
        public int? Marks { get; set; }
        public string? Feedback { get; set; }
    }

    public class TeacherAssignmentViewDto
    {
        public Guid Id { get; set; }
        public Guid TeacherId { get; set; }
        public string TeacherName { get; set; } = string.Empty;
        public string TeacherEmail { get; set; } = string.Empty;
        public Guid ClassId { get; set; }
        public string ClassName { get; set; } = string.Empty;
        public Guid SubjectId { get; set; }
        public string SubjectName { get; set; } = string.Empty;
        public DateTimeOffset CreatedAt { get; set; }
    }

    public class StudentClassViewDto
    {
        public Guid StudentId { get; set; }
        public string StudentName { get; set; } = string.Empty;
        public string StudentEmail { get; set; } = string.Empty;
        public Guid ClassId { get; set; }
        public string ClassName { get; set; } = string.Empty;
        public DateTimeOffset JoinedAt { get; set; }
    }

    public class AdminDashboardSummaryDto
    {
        public int TotalUsers { get; set; }
        public int TotalTeachers { get; set; }
        public int TotalStudents { get; set; }
        public int TotalClasses { get; set; }
        public int TotalSubjects { get; set; }
        public int TotalTeacherAssignments { get; set; }
        public int TotalStudentEnrollments { get; set; }
        public int TotalAssignments { get; set; }
        public int TotalSubmissions { get; set; }
    }
}
