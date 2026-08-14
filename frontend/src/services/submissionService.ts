import { apiClient, API_BASE_URL } from './apiClient';
import { 
  SubmissionDto, CreateSubmissionDto, UpdateSubmissionDto, GradeSubmissionDto 
} from '../types/submission';
import { PaginatedResult, PaginationParams } from '../types/pagination';

export const submissionService = {
  // Teacher endpoints
  getAssignmentSubmissions: (assignmentId: string, params?: PaginationParams) => {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.page) query.append('page', params.page.toString());
    if (params?.pageSize) query.append('pageSize', params.pageSize.toString());
    const qs = query.toString();
    return apiClient.get<PaginatedResult<SubmissionDto>>(`/api/teacher/assignments/${assignmentId}/submissions${qs ? `?${qs}` : ''}`);
  },
  getTeacherSubmission: (id: string) => apiClient.get<SubmissionDto>(`/api/teacher/submissions/${id}`),
  gradeSubmission: (id: string, data: GradeSubmissionDto) => apiClient.put<SubmissionDto>(`/api/teacher/submissions/${id}/grade`, data),

  // Student endpoints
  submitAnswer: (data: CreateSubmissionDto) => apiClient.post<SubmissionDto>('/api/student/submissions', data),
  getStudentSubmission: (id: string) => apiClient.get<SubmissionDto>(`/api/student/submissions/${id}`),
  updateSubmission: (id: string, data: UpdateSubmissionDto) => apiClient.put<SubmissionDto>(`/api/student/submissions/${id}`, data),
  
  // Attachments
  uploadAttachment: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post<any>(`/api/student/submissions/${id}/attachments`, formData);
  },
  deleteAttachment: (id: string, attachmentId: string) => apiClient.delete<void>(`/api/student/submissions/${id}/attachments/${attachmentId}`),
  
  downloadAttachment: async (submissionId: string, attachmentId: string, fileName: string) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/api/submissions/${submissionId}/attachments/${attachmentId}/download`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
        throw new Error('Failed to download file');
    }
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
};
