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
        Task<AssignmentDto> GetAssignmentAsync(Guid teacherId, Guid assignmentId);
        Task<IEnumerable<AssignmentDto>> GetMyAssignmentsAsync(Guid teacherId);
    }
}
