using System;

namespace AssignmentSystem.Core.Entities
{
    public class StudentClass
    {
        public Guid StudentId { get; set; }
        public User Student { get; set; } = null!;

        public Guid ClassId { get; set; }
        public Class Class { get; set; } = null!;

        public DateTimeOffset JoinedAt { get; set; } = DateTimeOffset.UtcNow;
    }
}
