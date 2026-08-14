'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { submissionService } from '@/services/submissionService';
import { assignmentService } from '@/services/assignmentService';
import { SubmissionDto, SubmissionStatus, GradeSubmissionDto } from '@/types/submission';
import { AssignmentDto } from '@/types/assignment';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorState } from '@/components/ui/Feedback';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { FileText, Download } from 'lucide-react';
import { IconButton } from '@/components/ui/IconButton';
import { useToast } from '@/hooks/useToast';

const gradeSchema = z.object({
  marks: z.coerce.number().min(0, 'Marks cannot be negative'),
  feedback: z.string().optional(),
});

type GradeFormValues = z.infer<typeof gradeSchema>;

export default function GradingPage() {
  const { id: assignmentId, submissionId } = useParams() as { id: string, submissionId: string };
  const router = useRouter();
  const toast = useToast();
  
  const [submission, setSubmission] = useState<SubmissionDto | null>(null);
  const [assignment, setAssignment] = useState<AssignmentDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<any>({
    resolver: zodResolver(gradeSchema),
  });

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [asg, sub] = await Promise.all([
          assignmentService.getAssignment(assignmentId),
          submissionService.getTeacherSubmission(submissionId)
        ]);
        setAssignment(asg);
        setSubmission(sub);
        reset({ marks: sub.marks || 0, feedback: sub.feedback || '' });
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to load details');
      } finally {
        setIsLoading(false);
      }
    };
    if (assignmentId && submissionId) fetchData();
  }, [assignmentId, submissionId, reset]);

  const onGradeSubmit = async (data: any) => {
    if (!assignment || !submission) return;
    if (data.marks > assignment.maximumMarks) {
      setSubmitError(`Marks cannot exceed maximum marks (${assignment.maximumMarks})`);
      return;
    }
    setSubmitError(null);
    try {
      const payload: GradeSubmissionDto = { marks: data.marks, feedback: data.feedback };
      await submissionService.gradeSubmission(submissionId, payload);
      toast.success('Grade updated successfully.');
      router.push(`/teacher/submissions/${assignmentId}`);
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit grade');
    }
  };

  if (isLoading) return <AppShell requireRole="Teacher"><Spinner /></AppShell>;
  if (error || !assignment || !submission) return <AppShell requireRole="Teacher"><ErrorState message={error || 'Not found'} /></AppShell>;

  return (
    <AppShell requireRole="Teacher">
      <div className="mb-6">
        <Link href={`/teacher/submissions/${assignmentId}`} className="text-blue-600 hover:underline text-sm mb-2 inline-block">&larr; Back to Submissions List</Link>
        <h1 className="text-2xl font-bold text-gray-900">Assign marks and provide feedback</h1>
        <p className="text-gray-500 mt-1">Student: <span className="font-medium text-gray-800">{submission.studentName || 'Unknown Student'}</span> ({submission.studentEmail || submission.studentId})</p>
      </div>

      {submitError && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {submitError}
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Student Answer & Attachments */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">Student Answer</h2>
            {submission.answer ? (
              <div className="prose max-w-none text-gray-800 whitespace-pre-wrap bg-gray-50 p-4 rounded-md border border-gray-100 min-h-[100px]">
                {submission.answer}
              </div>
            ) : (
              <p className="text-gray-500 italic">No text answer provided.</p>
            )}

            {submission.attachments && submission.attachments.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <h3 className="text-md font-bold text-gray-900 mb-3">Attachments</h3>
                <ul className="space-y-3">
                  {submission.attachments.map(att => (
                    <li key={att.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <div className="flex items-center text-gray-900 text-sm">
                        <FileText className="h-5 w-5 mr-3 text-blue-500" /> 
                        <span className="font-medium truncate max-w-[200px] sm:max-w-xs">{att.fileName}</span>
                      </div>
                      <IconButton 
                        icon={<Download className="h-4 w-4" />} 
                        aria-label="Download Attachment" 
                        title="Download Attachment" 
                        variant="primary" 
                        onClick={async () => {
                          try {
                            await submissionService.downloadAttachment(submission.id, att.id, att.fileName);
                          } catch (err) {
                            toast.error('Failed to download file');
                          }
                        }}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Evaluation Form */}
        <div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 sticky top-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">Evaluation</h2>
            <form onSubmit={handleSubmit(onGradeSubmit)} className="space-y-5">
              <Input 
                type="number" 
                step="0.1"
                label={`Marks (out of ${assignment.maximumMarks})`}
                {...register('marks')} 
                error={errors.marks?.message as string} 
              />
              <Textarea 
                label="Feedback" 
                rows={5}
                {...register('feedback')} 
                error={errors.feedback?.message as string} 
                placeholder="Optional feedback for the student..."
              />
              <Button type="submit" isLoading={isSubmitting} className="w-full">
                {submission.status === SubmissionStatus.Graded ? 'Update Grade' : 'Submit Grade'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
