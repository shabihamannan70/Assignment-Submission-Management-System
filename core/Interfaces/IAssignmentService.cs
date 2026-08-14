using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using AssignmentSystem.Core.DTOs;

namespace AssignmentSystem.Core.Interfaces
{
    public interface IAssignmentService
    {
        Task<AssignmentDto> CreateAssignmentAsync(Guid teacherId, CreateAssignmentDto dto);
        Task<AssignmentDto> UpdateAssignmentAsync(Guid teacherId, Guid assignmentId, UpdateAssignmentDto dto);
        Task DeleteAssignmentAsync(Guid teacherId, Guid assignmentId);
        Task<AssignmentDto> PublishAssignmentAsync(Guid teacherId, Guid assignmentId);
        Task<AssignmentDto> ToggleAssignmentStatusAsync(Guid teacherId, Guid assignmentId);
        Task<AssignmentDto> GetAssignmentAsync(Guid teacherId, Guid assignmentId);
        Task<PaginatedResult<AssignmentDto>> GetMyAssignmentsAsync(Guid teacherId, string? search = null, int page = 1, int pageSize = 10);
        
        Task<AssignmentAttachmentDto> UploadAttachmentAsync(Guid teacherId, Guid assignmentId, string fileName, string contentType, long fileSize, System.IO.Stream fileStream);
        Task DeleteAttachmentAsync(Guid teacherId, Guid assignmentId, Guid attachmentId);
        Task<(System.IO.Stream FileStream, string ContentType, string FileName)> DownloadAttachmentAsync(Guid userId, string role, Guid assignmentId, Guid attachmentId);
    }
}
