using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using AssignmentSystem.Core.DTOs;

namespace AssignmentSystem.Core.Interfaces
{
    public interface ITeacherService
    {
        Task<PaginatedResult<TeacherAssignmentViewDto>> GetMyTeacherAssignmentsAsync(Guid teacherId, string? search = null, int page = 1, int pageSize = 10);
    }
}
