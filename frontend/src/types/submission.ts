export enum SubmissionStatus {
  Submitted = 1,
  Graded = 2
}

export interface SubmissionAttachmentDto {
  id: string;
  fileName: string;
  contentType: string;
  fileSize: number;
  uploadedAt: string;
}

export interface SubmissionDto {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName?: string;
  studentEmail?: string;
  answer?: string;
  submittedAt: string;
  updatedAt?: string;
  status: SubmissionStatus;
  marks?: number;
  feedback?: string;
  attachments: SubmissionAttachmentDto[];
}

export interface CreateSubmissionDto {
  assignmentId: string;
  answer?: string;
}

export interface UpdateSubmissionDto {
  answer?: string;
}

export interface GradeSubmissionDto {
  marks: number;
  feedback?: string;
}

