import { apiClient } from './apiClient';
import { StudentDashboardDto } from '@/types/dashboard';

export const dashboardService = {
  getStudentDashboard: async (): Promise<StudentDashboardDto> => {
    return apiClient.get<StudentDashboardDto>('/api/student/dashboard');
  }
};
