using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AssignmentSystem.Core.DTOs;
using AssignmentSystem.Core.Interfaces;
using AssignmentSystem.Infrastructure.Data;
using AssignmentSystem.Infrastructure.Extensions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace AssignmentSystem.Infrastructure.Services
{
    public class TeacherService : ITeacherService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<TeacherService> _logger;

        public TeacherService(ApplicationDbContext context, ILogger<TeacherService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<PaginatedResult<TeacherAssignmentViewDto>> GetMyTeacherAssignmentsAsync(Guid teacherId, string? search = null, int page = 1, int pageSize = 10)
        {
            var query = _context.TeacherAssignments
                .Include(ta => ta.Teacher)
                .Include(ta => ta.Class)
                .Include(ta => ta.Subject)
                .Where(ta => ta.TeacherId == teacherId);

            if (!string.IsNullOrWhiteSpace(search))
            {
                var sl = search.ToLower();
                query = query.Where(ta => ta.Class.Name.ToLower().Contains(sl) || 
                                          ta.Subject.Name.ToLower().Contains(sl));
            }

            return await query
                .OrderBy(ta => ta.Class.Name)
                .ThenBy(ta => ta.Subject.Name)
                .Select(ta => new TeacherAssignmentViewDto
                {
                    Id = ta.Id,
                    TeacherId = ta.TeacherId,
                    TeacherName = ta.Teacher.Name,
                    TeacherEmail = ta.Teacher.Email,
                    ClassId = ta.ClassId,
                    ClassName = ta.Class.Name,
                    SubjectId = ta.SubjectId,
                    SubjectName = ta.Subject.Name,
                    CreatedAt = ta.CreatedAt
                })
                .ToPaginatedResultAsync(page, pageSize);
        }
    }
}
