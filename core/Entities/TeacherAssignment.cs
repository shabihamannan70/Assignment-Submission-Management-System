using System;

namespace AssignmentSystem.Core.Entities
{
    public class TeacherAssignment
    {
        public Guid Id { get; set; }
        
        public Guid TeacherId { get; set; }
        public User Teacher { get; set; } = null!;

        public Guid ClassId { get; set; }
        public Class Class { get; set; } = null!;

        public Guid SubjectId { get; set; }
        public Subject Subject { get; set; } = null!;

        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    }
}
