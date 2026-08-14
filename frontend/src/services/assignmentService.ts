import { apiClient, API_BASE_URL } from './apiClient';
import { 
  AssignmentDto, CreateAssignmentDto, UpdateAssignmentDto, 
  StudentAssignmentDto, StudentAssignmentDetailsDto, StudentAssignmentResultDto,
  AssignmentAttachmentDto
} from '../types/assignment';
import { PaginatedResult, PaginationParams } from '../types/pagination';
import { StudentDashboardAssignmentDto } from '../types/dashboard';

export const assignmentService = {
  // Teacher endpoints
  createAssignment: (data: CreateAssignmentDto) => apiClient.post<AssignmentDto>('/api/assignments', data),
  getMyAssignments: (params?: PaginationParams) => {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.page) query.append('page', params.page.toString());
    if (params?.pageSize) query.append('pageSize', params.pageSize.toString());
    const qs = query.toString();
    return apiClient.get<PaginatedResult<AssignmentDto>>(`/api/assignments/my${qs ? `?${qs}` : ''}`);
  },
  getAssignment: (id: string) => apiClient.get<AssignmentDto>(`/api/assignments/${id}`),
  updateAssignment: (id: string, data: UpdateAssignmentDto) => apiClient.put<AssignmentDto>(`/api/assignments/${id}`, data),
  deleteAssignment: (id: string) => apiClient.delete<void>(`/api/assignments/${id}`),
  publishAssignment: (id: string) => apiClient.post<AssignmentDto>(`/api/assignments/${id}/publish`, {}),
  toggleAssignmentStatus: (id: string) => apiClient.patch<AssignmentDto>(`/api/assignments/${id}/toggle-status`, {}),
  
  uploadAttachment: (assignmentId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post<AssignmentAttachmentDto>(`/api/assignments/${assignmentId}/attachments`, formData);
  },
  deleteAttachment: (assignmentId: string, attachmentId: string) => 
    apiClient.delete<void>(`/api/assignments/${assignmentId}/attachments/${attachmentId}`),
  downloadAttachment: async (assignmentId: string, attachmentId: string, fileName: string) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/api/assignments/${assignmentId}/attachments/${attachmentId}/download`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to download file');
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },

  // Student endpoints
  getAvailableAssignments: (params?: PaginationParams) => {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.page) query.append('page', params.page.toString());
    if (params?.pageSize) query.append('pageSize', params.pageSize.toString());
    const qs = query.toString();
    return apiClient.get<PaginatedResult<StudentAssignmentDto>>(`/api/student/assignments${qs ? `?${qs}` : ''}`);
  },
  getStudentResults: (params?: PaginationParams) => {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.page) query.append('page', params.page.toString());
    if (params?.pageSize) query.append('pageSize', params.pageSize.toString());
    const qs = query.toString();
    return apiClient.get<PaginatedResult<StudentDashboardAssignmentDto>>(`/api/student/assignments/results${qs ? `?${qs}` : ''}`);
  },
  getStudentAssignmentDetails: (id: string) => apiClient.get<StudentAssignmentDetailsDto>(`/api/student/assignments/${id}`),
  getStudentAssignmentResult: (id: string) => apiClient.get<StudentAssignmentResultDto>(`/api/student/assignments/${id}/result`),
};
