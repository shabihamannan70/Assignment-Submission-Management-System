using System;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using AssignmentSystem.Core.DTOs;

namespace AssignmentSystem.Core.Interfaces
{
    public interface ISubmissionService
    {
        Task<PaginatedResult<StudentAssignmentDto>> GetStudentAssignmentsAsync(Guid studentId, string? search = null, int page = 1, int pageSize = 10);
        
        Task<StudentAssignmentDetailsDto?> GetStudentAssignmentDetailsAsync(Guid studentId, Guid assignmentId);
        
        Task<StudentAssignmentResultDto> GetStudentAssignmentResultAsync(Guid studentId, Guid assignmentId);
        
        Task<PaginatedResult<StudentDashboardAssignmentDto>> GetStudentResultsAsync(Guid studentId, string? search = null, int page = 1, int pageSize = 10);
        
        Task<StudentDashboardDto> GetStudentDashboardAsync(Guid studentId);
        
        Task<SubmissionDto> SubmitAnswerAsync(Guid studentId, CreateSubmissionDto dto);
        
        Task<SubmissionDto> UpdateSubmissionAsync(Guid studentId, Guid submissionId, UpdateSubmissionDto dto);
        
        Task<SubmissionDto?> GetSubmissionAsync(Guid studentId, Guid submissionId);
        
        Task<SubmissionAttachmentDto> UploadAttachmentAsync(Guid studentId, Guid submissionId, string fileName, string contentType, long fileSize, Stream fileStream);
        
        Task DeleteAttachmentAsync(Guid studentId, Guid submissionId, Guid attachmentId);

        Task<PaginatedResult<SubmissionDto>> GetSubmissionsForAssignmentAsync(Guid teacherId, Guid assignmentId, string? search = null, int page = 1, int pageSize = 10);
        
        Task<SubmissionDto> GetSubmissionForTeacherAsync(Guid teacherId, Guid submissionId);
        
        Task<SubmissionDto> GradeSubmissionAsync(Guid teacherId, Guid submissionId, GradeSubmissionDto dto);
        
        Task<(Stream FileStream, string ContentType, string FileName)> DownloadAttachmentAsync(Guid userId, string role, Guid submissionId, Guid attachmentId);
    }
}
