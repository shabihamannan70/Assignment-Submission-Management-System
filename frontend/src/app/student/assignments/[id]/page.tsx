'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { assignmentService } from '@/services/assignmentService';
import { submissionService } from '@/services/submissionService';
import { StudentAssignmentDetailsDto } from '@/types/assignment';
import { SubmissionStatus, CreateSubmissionDto, UpdateSubmissionDto } from '@/types/submission';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorState } from '@/components/ui/Feedback';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { UploadCloud, File as FileIcon, X, Download, Trash2 } from 'lucide-react';
import { AssignmentDescription } from '@/components/AssignmentDescription';
import { IconButton } from '@/components/ui/IconButton';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { ApiError } from '@/services/apiClient';
import { useToast } from '@/hooks/useToast';

const submissionSchema = z.object({
  answer: z.string().optional(),
});

type SubmissionFormValues = z.infer<typeof submissionSchema>;

export default function StudentAssignmentDetailsPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [details, setDetails] = useState<StudentAssignmentDetailsDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  
  const toast = useToast();
  
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [attachmentToDelete, setAttachmentToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<SubmissionFormValues>({
    resolver: zodResolver(submissionSchema),
  });

  const fetchDetails = async () => {
    setIsLoading(true);
    try {
      const data = await assignmentService.getStudentAssignmentDetails(id);
      setDetails(data);
      if (data.submission) {
        reset({ answer: data.submission.answer || '' });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchDetails();
  }, [id, reset]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const validFiles = newFiles.filter(f => {
        if (f.size > 10 * 1024 * 1024) {
          toast.error(`${f.name} exceeds 10MB limit.`);
          return false;
        }
        const ext = f.name.substring(f.name.lastIndexOf('.')).toLowerCase();
        const allowed = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.jpg', '.jpeg', '.png', '.txt'];
        if (!allowed.includes(ext)) {
          toast.error(`${f.name} has an unsupported file type.`);
          return false;
        }
        return true;
      });
      setFilesToUpload(prev => [...prev, ...validFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFilesToUpload(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: SubmissionFormValues) => {
    if (!details) return;
    if (!data.answer?.trim() && filesToUpload.length === 0 && (!details.submission?.attachments || details.submission.attachments.length === 0)) {
      setSubmitError('Please provide an answer or upload a file.');
      return;
    }
    setSubmitError(null);
    setSuccess(false);
    setUploading(true);
    try {
      let subId = details.submission?.id;
      
      if (details.submission) {
        const payload: UpdateSubmissionDto = { answer: data.answer };
        await submissionService.updateSubmission(subId!, payload);
      } else {
        const payload: CreateSubmissionDto = { assignmentId: details.id, answer: data.answer };
        const res = await submissionService.submitAnswer(payload);
        subId = res.id;
      }

      if (filesToUpload.length > 0 && subId) {
        for (const file of filesToUpload) {
          await submissionService.uploadAttachment(subId, file);
        }
        setFilesToUpload([]);
      }

      setSuccess(true);
      toast.success(details.submission ? 'Assignment updated successfully.' : 'Assignment submitted successfully.');
      setTimeout(() => {
        router.push('/student/dashboard');
      }, 1000);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setSubmitError(err.message);
      } else {
        setSubmitError('An unexpected error occurred.');
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAttachmentClick = (attachmentId: string) => {
    setAttachmentToDelete(attachmentId);
    setConfirmDeleteOpen(true);
  };

  const executeDeleteAttachment = async () => {
    if (!details?.submission || !attachmentToDelete) return;
    setIsDeleting(true);
    try {
      await submissionService.deleteAttachment(details.submission.id, attachmentToDelete);
      await fetchDetails();
      toast.success('Attachment deleted successfully.');
    } catch (err) {
      toast.error('Failed to delete attachment');
    } finally {
      setIsDeleting(false);
      setConfirmDeleteOpen(false);
      setAttachmentToDelete(null);
    }
  };

  const handleDownload = async (attachment: any) => {
    if (!details?.submission) return;
    try {
      await submissionService.downloadAttachment(details.submission.id, attachment.id, attachment.fileName);
    } catch (err) {
      toast.error('Failed to download file');
    }
  };

  if (isLoading) return <AppShell requireRole="Student"><Spinner /></AppShell>;
  if (error || !details) return <AppShell requireRole="Student"><ErrorState message={error || 'Not found'} /></AppShell>;

  const isOverdue = new Date(details.deadline) < new Date();
  const hasSubmission = !!details.submission;
  const isGraded = details.submission?.status === SubmissionStatus.Graded;

  return (
    <AppShell requireRole="Student">
      <div className="mb-6">
        <Link href="/student/assignments" className="text-blue-600 hover:underline text-sm mb-2 inline-block">&larr; Back to Assignments</Link>
        <h1 className="text-2xl font-bold text-gray-900">{details.title}</h1>
        <div className="flex gap-2 mt-2">
          <Badge variant={isOverdue ? 'danger' : 'info'}>Deadline: {new Date(details.deadline).toLocaleString()}</Badge>
          <Badge variant="default">Max Marks: {details.maximumMarks}</Badge>
        </div>
        <div className="mt-6 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-medium mb-4 border-b pb-2">Description</h2>
          <div className="mt-2">
            <AssignmentDescription content={details.description} />
          </div>
          {details.teacherAttachments && details.teacherAttachments.length > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Assignment Attachments:</h3>
              <ul className="space-y-2">
                {details.teacherAttachments.map(att => (
                  <li key={att.id} className="flex items-center justify-between p-3 border border-gray-200 rounded bg-gray-50">
                    <div className="flex items-center">
                      <FileIcon className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-sm font-medium">{att.fileName}</span>
                      <span className="text-xs text-gray-500 ml-2">({(att.fileSize / 1024 / 1024).toFixed(2)} MB)</span>
                    </div>
                    <IconButton 
                      icon={<Download className="h-4 w-4" />} 
                      aria-label="Download Attachment" 
                      title="Download Attachment" 
                      variant="primary" 
                      onClick={() => {
                        assignmentService.downloadAttachment(details.id, att.id, att.fileName).catch(() => toast.error('Failed to download'));
                      }} 
                    />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-medium">Your Submission</h2>
          {hasSubmission && (
            <Badge variant={isGraded ? 'success' : 'warning'}>
              {isGraded ? 'Graded' : 'Submitted'}
            </Badge>
          )}
        </div>

        {isGraded ? (
          <div>
            <div className="bg-gray-50 p-4 rounded-md border border-gray-200 mb-6 whitespace-pre-wrap">
              {details.submission?.answer || <span className="text-gray-400 italic">No text answer</span>}
            </div>
            
            {details.submission?.attachments && details.submission.attachments.length > 0 && (
              <div className="mb-6">
                <p className="font-medium text-gray-700 mb-3">Submitted Files:</p>
                <ul className="space-y-2">
                  {details.submission.attachments.map(att => (
                    <li key={att.id} className="flex items-center justify-between p-3 border border-gray-200 rounded">
                      <div className="flex items-center">
                        <FileIcon className="h-5 w-5 text-gray-400 mr-2" />
                        <span className="text-sm font-medium">{att.fileName}</span>
                      </div>
                      <IconButton 
                        icon={<Download className="h-4 w-4" />} 
                        aria-label="Download Attachment" 
                        title="Download Attachment" 
                        variant="primary" 
                        onClick={() => handleDownload(att)} 
                      />
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="bg-green-50 border border-green-200 rounded-md p-4 mt-6">
              <h3 className="text-green-800 font-medium text-lg mb-2">Grade: {details.submission?.marks} / {details.maximumMarks}</h3>
              {details.submission?.feedback && (
                <div className="mt-2 text-green-700">
                  <span className="font-medium">Teacher Feedback:</span> {details.submission.feedback}
                </div>
              )}
            </div>
            
            <div className="mt-4 text-gray-600 text-sm font-medium">
              This submission has been graded and can no longer be edited.
            </div>
          </div>
        ) : (
          <div>
            {success && (
              <div className="mb-4 p-4 bg-green-50 text-green-800 rounded border border-green-200">
                <p className="font-medium">Assignment submitted successfully. Redirecting to dashboard...</p>
              </div>
            )}
            
            {submitError && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                {submitError}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <Textarea 
                label="Text Answer (optional if files are uploaded)" 
                rows={6}
                {...register('answer')} 
                error={errors.answer?.message}
                disabled={isOverdue || uploading}
              />
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Attachments</label>
                
                {details.submission?.attachments && details.submission.attachments.length > 0 && (
                  <ul className="space-y-2 mb-4">
                    {details.submission.attachments.map(att => (
                      <li key={att.id} className="flex items-center justify-between p-3 border border-gray-200 rounded bg-gray-50">
                        <div className="flex items-center">
                          <FileIcon className="h-5 w-5 text-gray-400 mr-2" />
                          <span className="text-sm font-medium">{att.fileName}</span>
                          <span className="text-xs text-gray-500 ml-2">({(att.fileSize / 1024 / 1024).toFixed(2)} MB)</span>
                        </div>
                        <div className="flex space-x-2">
                          <IconButton 
                            type="button" 
                            icon={<Download className="h-4 w-4" />} 
                            aria-label="Download Attachment" 
                            title="Download Attachment" 
                            variant="primary" 
                            onClick={() => handleDownload(att)} 
                          />
                          {!isOverdue && (
                            <IconButton 
                              type="button" 
                              icon={<Trash2 className="h-4 w-4" />} 
                              aria-label="Delete Attachment" 
                              title="Delete Attachment" 
                              variant="danger" 
                              onClick={() => handleDeleteAttachmentClick(att.id)} 
                            />
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                {!isOverdue && (
                  <>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:bg-gray-50 relative">
                      <div className="space-y-1 text-center">
                        <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="flex text-sm text-gray-600">
                          <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                            <span>Upload files</span>
                            <input id="file-upload" name="file-upload" type="file" multiple className="sr-only" onChange={handleFileChange} disabled={uploading} />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">
                          PDF, Word, Excel, PowerPoint, JPG, PNG, TXT up to 10MB
                        </p>
                      </div>
                    </div>
                    
                    {filesToUpload.length > 0 && (
                      <ul className="mt-4 space-y-2">
                        {filesToUpload.map((file, idx) => (
                          <li key={idx} className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded">
                            <span className="text-sm text-blue-800">{file.name}</span>
                            <IconButton 
                              type="button" 
                              icon={<Trash2 className="h-4 w-4" />} 
                              aria-label="Remove File" 
                              title="Remove File" 
                              variant="danger" 
                              onClick={() => removeFile(idx)} 
                            />
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                )}
              </div>

              <div className="flex items-center gap-4">
                <Button type="submit" isLoading={isSubmitting || uploading} disabled={isOverdue}>
                  {hasSubmission ? 'Update Submission' : 'Submit Answer'}
                </Button>
                {isOverdue ? (
                  <span className="text-red-600 text-sm font-medium">Submission deadline has passed. You can no longer update this submission.</span>
                ) : (
                  <span className="text-gray-600 text-sm font-medium">Submission can be updated until {new Date(details.deadline).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}.</span>
                )}
              </div>
            </form>
          </div>
        )}
      </div>

      <ConfirmationDialog
        isOpen={confirmDeleteOpen}
        title="Delete Attachment?"
        description="Are you sure you want to delete this file? This action cannot be undone."
        confirmText="Delete"
        onConfirm={executeDeleteAttachment}
        onCancel={() => {
          setConfirmDeleteOpen(false);
          setAttachmentToDelete(null);
        }}
        loading={isDeleting}
      />
    </AppShell>
  );
}
