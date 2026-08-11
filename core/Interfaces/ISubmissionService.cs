using System;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using AssignmentSystem.Core.DTOs;

namespace AssignmentSystem.Core.Interfaces
{
    public interface ISubmissionService
    {
        Task<IEnumerable<StudentAssignmentDto>> GetStudentAssignmentsAsync(Guid studentId);
        
        Task<StudentAssignmentDetailsDto?> GetStudentAssignmentDetailsAsync(Guid studentId, Guid assignmentId);
        
        Task<SubmissionDto> SubmitAnswerAsync(Guid studentId, CreateSubmissionDto dto);
        
        Task<SubmissionDto> UpdateSubmissionAsync(Guid studentId, Guid submissionId, UpdateSubmissionDto dto);
        
        Task<SubmissionDto?> GetSubmissionAsync(Guid studentId, Guid submissionId);
        
        Task<SubmissionAttachmentDto> UploadAttachmentAsync(Guid studentId, Guid submissionId, string fileName, string contentType, long fileSize, Stream fileStream);
        
        Task DeleteAttachmentAsync(Guid studentId, Guid submissionId, Guid attachmentId);
    }
}
