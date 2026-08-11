using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using AssignmentSystem.Core.DTOs;

namespace AssignmentSystem.Core.Interfaces
{
    public interface IAdminService
    {
        Task<IEnumerable<ClassDto>> GetClassesAsync();
        Task<ClassDto> CreateClassAsync(CreateClassDto dto);
        Task<ClassDto> GetClassAsync(Guid id);
        Task<ClassDto> UpdateClassAsync(Guid id, UpdateClassDto dto);
        Task DeleteClassAsync(Guid id);

        Task<IEnumerable<SubjectDto>> GetSubjectsAsync();
        Task<SubjectDto> CreateSubjectAsync(CreateSubjectDto dto);
        Task<SubjectDto> GetSubjectAsync(Guid id);
        Task<SubjectDto> UpdateSubjectAsync(Guid id, UpdateSubjectDto dto);
        Task DeleteSubjectAsync(Guid id);

        Task<TeacherAssignmentDto> AssignTeacherAsync(AssignTeacherDto dto);
        Task<StudentClassDto> EnrollStudentAsync(EnrollStudentDto dto);
    }
}
