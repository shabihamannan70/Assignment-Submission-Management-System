import { apiClient } from './apiClient';
import { PaginatedResult, PaginationParams } from '../types/pagination';
import { 
  ClassDto, CreateClassDto, UpdateClassDto, 
  SubjectDto, CreateSubjectDto, UpdateSubjectDto, 
  TeacherAssignmentDto, AssignTeacherDto,
  StudentClassDto, EnrollStudentDto,
  UserDto, CreateUserDto, UpdateUserDto,
  AdminAssignmentDto, AdminSubmissionDto,
  TeacherAssignmentViewDto, StudentClassViewDto,
  AdminDashboardSummaryDto
} from '../types/admin';

export const adminService = {
  // Classes
  getClasses: (params?: PaginationParams) => {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.page) query.append('page', params.page.toString());
    if (params?.pageSize) query.append('pageSize', params.pageSize.toString());
    const qs = query.toString();
    return apiClient.get<PaginatedResult<ClassDto>>(`/api/admin/classes${qs ? `?${qs}` : ''}`);
  },
  getClass: (id: string) => apiClient.get<ClassDto>(`/api/admin/classes/${id}`),
  createClass: (data: CreateClassDto) => apiClient.post<ClassDto>('/api/admin/classes', data),
  updateClass: (id: string, data: UpdateClassDto) => apiClient.put<ClassDto>(`/api/admin/classes/${id}`, data),
  deleteClass: (id: string) => apiClient.delete<void>(`/api/admin/classes/${id}`),

  // Subjects
  getSubjects: (params?: PaginationParams) => {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.page) query.append('page', params.page.toString());
    if (params?.pageSize) query.append('pageSize', params.pageSize.toString());
    const qs = query.toString();
    return apiClient.get<PaginatedResult<SubjectDto>>(`/api/admin/subjects${qs ? `?${qs}` : ''}`);
  },
  getSubject: (id: string) => apiClient.get<SubjectDto>(`/api/admin/subjects/${id}`),
  createSubject: (data: CreateSubjectDto) => apiClient.post<SubjectDto>('/api/admin/subjects', data),
  updateSubject: (id: string, data: UpdateSubjectDto) => apiClient.put<SubjectDto>(`/api/admin/subjects/${id}`, data),
  deleteSubject: (id: string) => apiClient.delete<void>(`/api/admin/subjects/${id}`),

  // Assignments
  assignTeacher: (data: AssignTeacherDto) => apiClient.post<TeacherAssignmentDto>('/api/admin/teacher-assignments', data),
  enrollStudent: (data: EnrollStudentDto) => apiClient.post<StudentClassDto>('/api/admin/student-enrollments', data),
  getTeacherAssignments: (params?: PaginationParams) => {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.page) query.append('page', params.page.toString());
    if (params?.pageSize) query.append('pageSize', params.pageSize.toString());
    const qs = query.toString();
    return apiClient.get<PaginatedResult<TeacherAssignmentViewDto>>(`/api/admin/teacher-assignments${qs ? `?${qs}` : ''}`);
  },
  getTeacherAssignment: (id: string) => apiClient.get<TeacherAssignmentViewDto>(`/api/admin/teacher-assignments/${id}`),
  updateTeacherAssignment: (id: string, data: AssignTeacherDto) => apiClient.put<TeacherAssignmentDto>(`/api/admin/teacher-assignments/${id}`, data),
  deleteTeacherAssignment: (id: string) => apiClient.delete<void>(`/api/admin/teacher-assignments/${id}`),
  getStudentEnrollments: (params?: PaginationParams) => {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.page) query.append('page', params.page.toString());
    if (params?.pageSize) query.append('pageSize', params.pageSize.toString());
    const qs = query.toString();
    return apiClient.get<PaginatedResult<StudentClassViewDto>>(`/api/admin/student-enrollments${qs ? `?${qs}` : ''}`);
  },
  updateStudentEnrollment: (studentId: string, oldClassId: string, data: EnrollStudentDto) => apiClient.put<StudentClassDto>(`/api/admin/student-enrollments/${studentId}/${oldClassId}`, data),
  deleteStudentEnrollment: (studentId: string, classId: string) => apiClient.delete<void>(`/api/admin/student-enrollments/${studentId}/${classId}`),

  // Users
  getUsers: (role?: string, params?: PaginationParams) => {
    const query = new URLSearchParams();
    if (role) query.append('role', role);
    if (params?.search) query.append('search', params.search);
    if (params?.page) query.append('page', params.page.toString());
    if (params?.pageSize) query.append('pageSize', params.pageSize.toString());
    const qs = query.toString();
    return apiClient.get<PaginatedResult<UserDto>>(`/api/admin/users${qs ? `?${qs}` : ''}`);
  },
  getUser: (id: string) => apiClient.get<UserDto>(`/api/admin/users/${id}`),
  createUser: (data: CreateUserDto) => apiClient.post<UserDto>('/api/admin/users', data),
  updateUser: (id: string, data: UpdateUserDto) => apiClient.put<UserDto>(`/api/admin/users/${id}`, data),
  toggleUserActiveStatus: (id: string) => apiClient.put<UserDto>(`/api/admin/users/${id}/toggle-active`, {}),

  // Views
  getAssignments: (params?: PaginationParams) => {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.page) query.append('page', params.page.toString());
    if (params?.pageSize) query.append('pageSize', params.pageSize.toString());
    const qs = query.toString();
    return apiClient.get<PaginatedResult<AdminAssignmentDto>>(`/api/admin/assignments${qs ? `?${qs}` : ''}`);
  },
  getSubmissions: (params?: PaginationParams) => {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.page) query.append('page', params.page.toString());
    if (params?.pageSize) query.append('pageSize', params.pageSize.toString());
    const qs = query.toString();
    return apiClient.get<PaginatedResult<AdminSubmissionDto>>(`/api/admin/submissions${qs ? `?${qs}` : ''}`);
  },
  getSubmission: (id: string) => apiClient.get<any>(`/api/admin/submissions/${id}`),
  getDashboardSummary: () => apiClient.get<AdminDashboardSummaryDto>('/api/admin/dashboard'),
};
