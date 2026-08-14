import { SubmissionDto } from './submission';

export interface AssignmentAttachmentDto {
  id: string;
  fileName: string;
  contentType: string;
  fileSize: number;
  uploadedAt: string;
}

export enum AssignmentStatus {
  Draft = 0,
  Published = 1
}

export interface AssignmentDto {
  id: string;
  title: string;
  description: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  deadline: string;
  maximumMarks: number;
  status: AssignmentStatus;
  createdAt: string;
  updatedAt: string;
  attachments?: AssignmentAttachmentDto[];
}

export interface CreateAssignmentDto {
  title: string;
  description?: string;
  classId: string;
  subjectId: string;
  deadline: string;
  maximumMarks: number;
  status: AssignmentStatus;
}

export interface UpdateAssignmentDto {
  title: string;
  description?: string;
  deadline: string;
  maximumMarks: number;
}

export interface StudentAssignmentDto {
  id: string;
  title: string;
  description: string;
  classId: string;
  subjectId: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
  deadline: string;
  maximumMarks: number;
  createdAt: string;
}

export interface StudentAssignmentDetailsDto {
  id: string;
  title: string;
  description: string;
  classId: string;
  subjectId: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
  deadline: string;
  maximumMarks: number;
  createdAt: string;
  submission?: SubmissionDto;
  teacherAttachments?: AssignmentAttachmentDto[];
}

export interface StudentAssignmentResultDto {
  assignmentId: string;
  assignmentTitle: string;
  subjectName: string;
  teacherName: string;
  deadline: string;
  maxMarks: number;
  submissionId: string;
  submittedAt: string;
  updatedAt?: string;
  answer?: string;
  marks?: number;
  feedback?: string;
  status: string;
  attachments: {
    id: string;
    fileName: string;
    contentType: string;
    fileSize: number;
    uploadedAt: string;
  }[];
}
