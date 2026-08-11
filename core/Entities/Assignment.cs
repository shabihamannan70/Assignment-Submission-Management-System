using System;
using AssignmentSystem.Core.Enums;

namespace AssignmentSystem.Core.Entities
{
    public class Assignment
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        
        public Guid ClassId { get; set; }
        public Class Class { get; set; } = null!;

        public Guid SubjectId { get; set; }
        public Subject Subject { get; set; } = null!;

        public Guid TeacherId { get; set; }
        public User Teacher { get; set; } = null!;

        public DateTimeOffset Deadline { get; set; }
        public int MaximumMarks { get; set; }
        
        public AssignmentStatus Status { get; set; } = AssignmentStatus.Draft;
        
        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
        public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
        
        public ICollection<Submission> Submissions { get; set; } = new List<Submission>();
    }
}
