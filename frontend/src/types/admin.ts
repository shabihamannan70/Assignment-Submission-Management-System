export interface ClassDto {
  id: string;
  name: string;
  code: string;
  description: string;
  createdAt: string;
}

export interface CreateClassDto {
  name: string;
  code: string;
  description?: string;
}

export interface UpdateClassDto {
  name: string;
  code: string;
  description?: string;
}

export interface SubjectDto {
  id: string;
  name: string;
  code: string;
  description: string;
  createdAt: string;
}

export interface CreateSubjectDto {
  name: string;
  code: string;
  description?: string;
}

export interface UpdateSubjectDto {
  name: string;
  code: string;
  description?: string;
}

export interface TeacherAssignmentDto {
  id: string;
  teacherId: string;
  classId: string;
  subjectId: string;
  createdAt: string;
}

export interface AssignTeacherDto {
  teacherId: string;
  classId: string;
  subjectId: string;
}

export interface StudentClassDto {
  studentId: string;
  classId: string;
  joinedAt: string;
}

export interface EnrollStudentDto {
  studentId: string;
  classId: string;
}

export interface UserDto {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreateUserDto {
  name: string;
  email: string;
  password?: string;
  role: string;
}

export interface UpdateUserDto {
  name: string;
  email: string;
}

export interface AdminAssignmentDto {
  id: string;
  title: string;
  teacherName: string;
  className: string;
  subjectName: string;
  maximumMarks: number;
  deadline: string;
  status: string;
  createdAt: string;
}

export interface AdminSubmissionDto {
  id: string;
  assignmentId: string;
  assignmentTitle: string;
  studentName: string;
  studentEmail: string;
  className: string;
  subjectName: string;
  teacherName: string;
  submittedAt: string;
  status: string;
  marks?: number;
  feedback?: string;
}

export interface TeacherAssignmentViewDto {
  id: string;
  teacherId: string;
  teacherName: string;
  teacherEmail: string;
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  createdAt: string;
}

export interface StudentClassViewDto {
  studentId: string;
  studentName: string;
  studentEmail: string;
  classId: string;
  className: string;
  joinedAt: string;
}

export interface AdminDashboardSummaryDto {
  totalUsers: number;
  totalTeachers: number;
  totalStudents: number;
  totalClasses: number;
  totalSubjects: number;
  totalTeacherAssignments: number;
  totalStudentEnrollments: number;
  totalAssignments: number;
  totalSubmissions: number;
}
