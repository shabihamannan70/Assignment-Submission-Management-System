'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { assignmentService } from '@/services/assignmentService';
import { submissionService } from '@/services/submissionService';
import { StudentAssignmentResultDto } from '@/types/assignment';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorState } from '@/components/ui/Feedback';
import { Badge } from '@/components/ui/Badge';
import { FileIcon, Download, ArrowLeft } from 'lucide-react';
import { IconButton } from '@/components/ui/IconButton';
import { useToast } from '@/hooks/useToast';

export default function ResultDetailsPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [details, setDetails] = useState<StudentAssignmentResultDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const data = await assignmentService.getStudentAssignmentResult(id);
        setDetails(data);
      } catch (err: any) {
        if (err.response?.status === 404) setError('No submission found for this assignment.');
        else if (err.response?.status === 400) setError(err.response.data || 'Assignment has not been graded yet.');
        else if (err.response?.status === 403) setError('You are not authorized to view this result.');
        else setError(err.message || 'Failed to load result');
      } finally {
        setIsLoading(false);
      }
    };
    if (id) fetchDetails();
  }, [id]);

  const handleDownload = async (attachment: any) => {
    if (!details) return;
    try {
      await submissionService.downloadAttachment(details.submissionId, attachment.id, attachment.fileName);
    } catch (err) {
      toast.error('Failed to download file');
    }
  };

  if (isLoading) return <AppShell requireRole="Student"><Spinner /></AppShell>;
  if (error || !details) return <AppShell requireRole="Student"><ErrorState message={error || 'Not found'} /></AppShell>;

  const percentage = details.marks !== undefined && details.marks !== null && details.maxMarks > 0
    ? ((details.marks / details.maxMarks) * 100).toFixed(1)
    : null;

  return (
    <AppShell requireRole="Student">
      <div className="mb-6">
        <button onClick={() => router.back()} className="text-blue-600 hover:underline text-sm mb-4 inline-flex items-center">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </button>
        <h1 className="text-2xl font-bold text-gray-900">{details.assignmentTitle}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-bold border-b pb-2 mb-4">Assignment Information</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-gray-500 font-medium">Subject</span><span className="font-medium text-gray-900">{details.subjectName}</span></div>
            <div className="flex justify-between"><span className="text-gray-500 font-medium">Teacher</span><span className="font-medium text-gray-900">{details.teacherName}</span></div>
            <div className="flex justify-between"><span className="text-gray-500 font-medium">Deadline</span><span className="text-gray-900">{new Date(details.deadline).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span></div>
            <div className="flex justify-between"><span className="text-gray-500 font-medium">Max Marks</span><span className="text-gray-900">{details.maxMarks}</span></div>
          </div>
        </div>

        <div className="bg-green-50 p-6 rounded-lg shadow-sm border border-green-200">
          <h2 className="text-lg font-bold border-b border-green-300 pb-2 mb-4 text-green-800">Result</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center"><span className="text-green-700 font-medium">Status</span><Badge variant="success">Graded</Badge></div>
            <div className="flex justify-between"><span className="text-green-700 font-medium">Marks</span><span className="font-bold text-green-900 text-base">{details.marks} / {details.maxMarks}</span></div>
            {percentage && <div className="flex justify-between"><span className="text-green-700 font-medium">Percentage</span><span className="font-medium text-green-900">{percentage}%</span></div>}
            <div className="flex justify-between"><span className="text-green-700 font-medium">Submitted At</span><span className="text-green-900">{new Date(details.submittedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span></div>
            <div className="flex justify-between"><span className="text-green-700 font-medium">Graded At</span><span className="text-green-900">{details.updatedAt ? new Date(details.updatedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '-'}</span></div>
          </div>
          {details.feedback && (
            <div className="mt-4 pt-4 border-t border-green-300">
              <span className="text-green-800 font-bold block mb-1">Teacher Feedback:</span>
              <p className="text-green-900 whitespace-pre-wrap">{details.feedback}</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
        <h2 className="text-lg font-bold border-b pb-2 mb-4">Student Answer</h2>
        <div className="bg-gray-50 p-4 rounded-md border border-gray-200 whitespace-pre-wrap">
          {details.answer || <span className="text-gray-400 italic">No text answer provided.</span>}
        </div>
      </div>

      {details.attachments && details.attachments.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-bold border-b pb-2 mb-4">Attachments</h2>
          <ul className="space-y-3">
            {details.attachments.map(att => (
              <li key={att.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center">
                  <FileIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <span className="text-sm font-medium block">{att.fileName}</span>
                    <span className="text-xs text-gray-500">{(att.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
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
    </AppShell>
  );
}
