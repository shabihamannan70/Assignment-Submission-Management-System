using System;

namespace AssignmentSystem.Core.Entities
{
    public class SubmissionAttachment
    {
        public Guid Id { get; set; }
        
        public Guid SubmissionId { get; set; }
        public Submission Submission { get; set; } = null!;
        
        public string FileName { get; set; } = string.Empty;
        public string StoredFileName { get; set; } = string.Empty;
        public string FilePath { get; set; } = string.Empty;
        public string ContentType { get; set; } = string.Empty;
        public long FileSize { get; set; }
        
        public DateTimeOffset UploadedAt { get; set; } = DateTimeOffset.UtcNow;
    }
}
