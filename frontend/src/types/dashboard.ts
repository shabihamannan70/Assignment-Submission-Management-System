export interface StudentDashboardAssignmentDto {
  assignmentId: string;
  title: string;
  className: string;
  subjectName: string;
  teacherName: string;
  teacherEmail?: string;
  deadline: string;
  maximumMarks: number;
  description: string;
  submissionId?: string;
  dashboardStatus: 'Pending' | 'Submitted' | 'Graded' | 'Overdue';
  marks?: number;
  feedback?: string;
  submittedAt?: string;
  answer?: string;
  attachments?: {
    id: string;
    fileName: string;
    contentType: string;
    fileSize: number;
    uploadedAt: string;
  }[];
}

export interface StudentDashboardDto {
  totalAssignments: number;
  pendingCount: number;
  submittedCount: number;
  gradedCount: number;
  averageScore: number | null;
  recentAssignments: StudentDashboardAssignmentDto[];
}
