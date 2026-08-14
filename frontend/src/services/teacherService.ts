import { apiClient } from './apiClient';
import { TeacherAssignmentViewDto } from '../types/admin';
import { PaginatedResult, PaginationParams } from '../types/pagination';

export const teacherService = {
  getTeacherAssignments: (params?: PaginationParams) => {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.page) query.append('page', params.page.toString());
    if (params?.pageSize) query.append('pageSize', params.pageSize.toString());
    const qs = query.toString();
    return apiClient.get<PaginatedResult<TeacherAssignmentViewDto>>(`/api/teacher/teacher-assignments${qs ? `?${qs}` : ''}`);
  }
};
