using System;
using System.Collections.Generic;
using AssignmentSystem.Core.Enums;

namespace AssignmentSystem.Core.Entities
{
    public class Submission
    {
        public Guid Id { get; set; }
        
        public Guid AssignmentId { get; set; }
        public Assignment Assignment { get; set; } = null!;
        
        public Guid StudentId { get; set; }
        public User Student { get; set; } = null!;
        
        public string? Answer { get; set; }
        
        public DateTimeOffset SubmittedAt { get; set; } = DateTimeOffset.UtcNow;
        public DateTimeOffset? UpdatedAt { get; set; }
        
        public SubmissionStatus Status { get; set; } = SubmissionStatus.Submitted;
        
        public decimal? Marks { get; set; }
        public string? Feedback { get; set; }
        
        public ICollection<SubmissionAttachment> Attachments { get; set; } = new List<SubmissionAttachment>();
    }
}
