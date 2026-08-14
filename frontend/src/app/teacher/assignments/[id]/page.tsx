'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { assignmentService } from '@/services/assignmentService';
import { submissionService } from '@/services/submissionService';
import { AssignmentDto, AssignmentStatus } from '@/types/assignment';
import { SubmissionDto, SubmissionStatus } from '@/types/submission';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorState, EmptyState } from '@/components/ui/Feedback';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { CheckCircle, Clock, FileText, Pencil } from 'lucide-react';
import { AssignmentDescription } from '@/components/AssignmentDescription';
import Link from 'next/link';
import { IconButton } from '@/components/ui/IconButton';
import { Pagination } from '@/components/ui/Pagination';
import { Input } from '@/components/ui/Input';

export default function AssignmentDetailsPage() {
  const { id } = useParams() as { id: string };
  const [assignment, setAssignment] = useState<AssignmentDto | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const [asg, subsData] = await Promise.all([
          assignmentService.getAssignment(id),
          submissionService.getAssignmentSubmissions(id, { search: searchTerm || undefined, page, pageSize }),
        ]);
        setAssignment(asg);
        setSubmissions(subsData.items);
        setTotalCount(subsData.totalCount);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    if (!id) return;
    const timer = setTimeout(() => {
      fetchDetails();
    }, 300);
    return () => clearTimeout(timer);
  }, [id, searchTerm, page]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  if (isLoading) return <AppShell requireRole="Teacher"><Spinner /></AppShell>;
  if (error || !assignment) return <AppShell requireRole="Teacher"><ErrorState message={error || 'Not found'} /></AppShell>;

  const gradedCount = submissions.filter(s => s.status === SubmissionStatus.Graded).length;

  return (
    <AppShell requireRole="Teacher">
      <div className="mb-6">
        <Link href="/teacher/assignments" className="text-blue-600 hover:underline text-sm mb-2 inline-block">&larr; Back to Assignments</Link>
        <h1 className="text-2xl font-bold text-gray-900">{assignment.title}</h1>
        <div className="flex gap-2 mt-2">
          {assignment.status === AssignmentStatus.Published ? (
            <Badge variant="success">Published</Badge>
          ) : (
            <Badge variant="warning">Draft</Badge>
          )}
          <Badge variant="info">Deadline: {new Date(assignment.deadline).toLocaleString()}</Badge>
          <Badge variant="default">Max Marks: {assignment.maximumMarks}</Badge>
        </div>
        <div className="mt-4">
          <AssignmentDescription content={assignment.description} />
        </div>
      </div>

      <h2 className="text-xl font-bold text-gray-900 mb-4 mt-8">Submissions ({totalCount})</h2>

      <div className="mb-6 flex gap-4">
        <Input 
          placeholder="Search by student or status..." 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>
      
      {submissions.length === 0 ? (
        <EmptyState 
          icon={FileText} 
          title="No submissions yet" 
          message="Students have not submitted answers for this assignment."
        />
      ) : (
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted At</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marks</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {submissions.map((sub) => (
                <tr key={sub.id}>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{sub.studentName || 'Unknown Student'}</div>
                    <div className="text-sm text-gray-500">{sub.studentEmail || sub.studentId}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(sub.submittedAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {sub.status === SubmissionStatus.Graded ? (
                      <Badge variant="success"><CheckCircle className="w-3 h-3 inline mr-1"/> Graded</Badge>
                    ) : (
                      <Badge variant="warning"><Clock className="w-3 h-3 inline mr-1"/> Pending</Badge>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                    {sub.status === SubmissionStatus.Graded ? `${sub.marks} / ${assignment.maximumMarks}` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link href={`/teacher/submissions/${sub.id}`}>
                      <IconButton 
                        icon={<Pencil className="h-4 w-4" />} 
                        aria-label={sub.status === SubmissionStatus.Graded ? 'Update Grade' : 'Grade Submission'} 
                        title={sub.status === SubmissionStatus.Graded ? 'Update Grade' : 'Grade Submission'} 
                        variant="primary" 
                      />
                    </Link>
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
    </AppShell>
  );
}
