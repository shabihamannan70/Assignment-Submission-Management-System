using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using AssignmentSystem.Core.DTOs;

namespace AssignmentSystem.Core.Interfaces
{
    public interface IAdminService
    {
        Task<PaginatedResult<ClassDto>> GetClassesAsync(string? search = null, int page = 1, int pageSize = 10);
        Task<ClassDto> CreateClassAsync(CreateClassDto dto);
        Task<ClassDto> GetClassAsync(Guid id);
        Task<ClassDto> UpdateClassAsync(Guid id, UpdateClassDto dto);
        Task<OperationResult> DeleteClassAsync(Guid id);

        Task<PaginatedResult<SubjectDto>> GetSubjectsAsync(string? search = null, int page = 1, int pageSize = 10);
        Task<SubjectDto> CreateSubjectAsync(CreateSubjectDto dto);
        Task<SubjectDto> GetSubjectAsync(Guid id);
        Task<SubjectDto> UpdateSubjectAsync(Guid id, UpdateSubjectDto dto);
        Task<OperationResult> DeleteSubjectAsync(Guid id);

        Task<TeacherAssignmentDto> AssignTeacherAsync(AssignTeacherDto dto);
        Task<TeacherAssignmentViewDto> GetTeacherAssignmentAsync(Guid id);
        Task<TeacherAssignmentDto> UpdateTeacherAssignmentAsync(Guid id, AssignTeacherDto dto);
        Task DeleteTeacherAssignmentAsync(Guid id);

        Task<StudentClassDto> EnrollStudentAsync(EnrollStudentDto dto);
        Task<StudentClassDto> UpdateStudentEnrollmentAsync(Guid studentId, Guid oldClassId, EnrollStudentDto dto);
        Task DeleteStudentEnrollmentAsync(Guid studentId, Guid classId);

        Task<PaginatedResult<UserDto>> GetUsersAsync(string? role = null, string? search = null, int page = 1, int pageSize = 10);
        Task<UserDto> GetUserAsync(Guid id);
        Task<UserDto> CreateUserAsync(CreateUserDto dto);
        Task<UserDto> UpdateUserAsync(Guid id, UpdateUserDto dto);
        Task<UserDto> ToggleUserActiveStatusAsync(Guid id);

        Task<PaginatedResult<TeacherAssignmentViewDto>> GetTeacherAssignmentsAsync(string? search = null, int page = 1, int pageSize = 10);
        Task<PaginatedResult<StudentClassViewDto>> GetStudentClassesAsync(string? search = null, int page = 1, int pageSize = 10);
        
        Task<PaginatedResult<AdminAssignmentDto>> GetAssignmentsAsync(string? search = null, int page = 1, int pageSize = 10);
        Task<PaginatedResult<AdminSubmissionDto>> GetSubmissionsAsync(string? search = null, int page = 1, int pageSize = 10);
        Task<SubmissionDto> GetSubmissionAsync(Guid id);
        Task<AdminDashboardSummaryDto> GetDashboardSummaryAsync();
    }
}
