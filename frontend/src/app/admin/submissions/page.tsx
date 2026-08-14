'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorState, EmptyState } from '@/components/ui/Feedback';
import { CheckCircle, Eye, Download } from 'lucide-react';
import { adminService } from '@/services/adminService';
import { AdminSubmissionDto } from '@/types/admin';
import { IconButton } from '@/components/ui/IconButton';
import { Pagination } from '@/components/ui/Pagination';
import { useToast } from '@/hooks/useToast';

export default function AdminSubmissionsPage() {
  const [submissions, setSubmissions] = useState<AdminSubmissionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await adminService.getSubmissions({ search: searchTerm || undefined, page, pageSize });
      setSubmissions(data.items);
      setTotalCount(data.totalCount);
      setError(null);
    } catch (err: any) {
      setError(err.name === 'ApiError' ? err.message : 'Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, page]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  return (
    <AppShell requireRole="Admin">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Submissions</h1>
          <p className="text-gray-500">Read-only view of all submissions across all classes.</p>
        </div>
      </div>

      <div className="mb-6">
        <Input 
          placeholder="Search by student, email, assignment title, or class..." 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      {loading ? (
        <div className="flex justify-center p-8"><Spinner /></div>
      ) : error ? (
        <ErrorState message={error} onRetry={loadData} />
      ) : submissions.length === 0 ? (
        <EmptyState 
          icon={CheckCircle} 
          title="No submissions found" 
          message="No submissions match your search or none have been made yet." 
        />
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assignment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class / Subject</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marks</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted At</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {submissions.map((submission) => (
                <tr key={submission.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{submission.studentName}</div>
                    <div className="text-xs text-gray-500">{submission.studentEmail}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {submission.assignmentTitle}
                    <div className="text-xs text-gray-500">Teacher: {submission.teacherName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{submission.className}</div>
                    <div className="text-sm text-gray-500">{submission.subjectName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      submission.status === 'Graded' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {submission.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {submission.marks !== null ? submission.marks : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(submission.submittedAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <IconButton 
                      icon={<Eye className="h-4 w-4" />} 
                      aria-label="View Submission" 
                      title="View Submission" 
                      variant="primary" 
                      onClick={() => setSelectedSubmissionId(submission.id)} 
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination
            currentPage={page}
            totalCount={totalCount}
            pageSize={pageSize}
            onPageChange={setPage}
          />
        </div>
      )}

      {/* View Modal */}
      {selectedSubmissionId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Submission Details</h2>
              <button onClick={() => setSelectedSubmissionId(null)} className="text-gray-400 hover:text-gray-600">
                <span className="text-2xl">&times;</span>
              </button>
            </div>
            
            <SubmissionDetails submissionId={selectedSubmissionId} />
            
            <div className="mt-6 flex justify-end">
              <button 
                onClick={() => setSelectedSubmissionId(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function SubmissionDetails({ submissionId }: { submissionId: string }) {
  const [submission, setSubmission] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const data = await adminService.getSubmission(submissionId);
        setSubmission(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load details');
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [submissionId]);

  const handleDownload = async (attachment: any) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/submissions/${submissionId}/attachments/${attachment.id}/download`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      toast.error('Failed to download file');
    }
  };

  if (loading) return <div className="py-8 flex justify-center"><Spinner /></div>;
  if (error) return <div className="text-red-600">{error}</div>;
  if (!submission) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="font-semibold text-gray-500">Status</p>
          <p>{submission.status === 0 ? 'Submitted' : 'Graded'}</p>
        </div>
        <div>
          <p className="font-semibold text-gray-500">Submitted At</p>
          <p>{new Date(submission.submittedAt).toLocaleString()}</p>
        </div>
        <div>
          <p className="font-semibold text-gray-500">Marks</p>
          <p>{submission.marks !== null ? submission.marks : 'Not graded'}</p>
        </div>
      </div>

      <div>
        <p className="font-semibold text-gray-500 mb-2">Text Answer</p>
        <div className="p-4 bg-gray-50 rounded border border-gray-200 whitespace-pre-wrap">
          {submission.answer || <span className="text-gray-400 italic">No text answer provided.</span>}
        </div>
      </div>

      {submission.feedback && (
        <div>
          <p className="font-semibold text-gray-500 mb-2">Teacher Feedback</p>
          <div className="p-4 bg-blue-50 text-blue-900 rounded border border-blue-200 whitespace-pre-wrap">
            {submission.feedback}
          </div>
        </div>
      )}

      <div>
        <p className="font-semibold text-gray-500 mb-2">Attachments ({submission.attachments?.length || 0})</p>
        {submission.attachments?.length > 0 ? (
          <ul className="divide-y divide-gray-200 border border-gray-200 rounded">
            {submission.attachments.map((file: any) => (
              <li key={file.id} className="p-3 flex justify-between items-center bg-white hover:bg-gray-50">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-900 truncate max-w-xs">{file.fileName}</span>
                  <span className="ml-2 text-xs text-gray-500">({(file.fileSize / 1024 / 1024).toFixed(2)} MB)</span>
                </div>
                <IconButton
                  icon={<Download className="h-4 w-4" />}
                  aria-label="Download Attachment"
                  title="Download Attachment"
                  variant="primary"
                  onClick={() => handleDownload(file)}
                />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500 italic">No attachments</p>
        )}
      </div>
    </div>
  );
}
