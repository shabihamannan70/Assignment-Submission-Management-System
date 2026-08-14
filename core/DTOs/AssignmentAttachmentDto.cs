using System;

namespace AssignmentSystem.Core.DTOs
{
    public record AssignmentAttachmentDto(
        Guid Id,
        string FileName,
        string ContentType,
        long FileSize,
        DateTimeOffset UploadedAt
    );
}
