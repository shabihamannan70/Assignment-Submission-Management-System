'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { submissionService } from '@/services/submissionService';
import { assignmentService } from '@/services/assignmentService';
import { teacherService } from '@/services/teacherService';
import { SubmissionDto, SubmissionStatus, GradeSubmissionDto } from '@/types/submission';
import { AssignmentDto, AssignmentStatus } from '@/types/assignment';
import { TeacherAssignmentViewDto } from '@/types/admin';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorState } from '@/components/ui/Feedback';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';
import { Pencil } from 'lucide-react';
import { IconButton } from '@/components/ui/IconButton';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Pagination';
import { Input } from '@/components/ui/Input';


export default function AssignmentSubmissionsPage() {
  const { id: assignmentId } = useParams() as { id: string };
  const [submissions, setSubmissions] = useState<SubmissionDto[]>([]);
  const [assignment, setAssignment] = useState<AssignmentDto | null>(null);
  const [teacherAssignments, setTeacherAssignments] = useState<TeacherAssignmentViewDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;


  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [asg, subsData, taData] = await Promise.all([
        assignmentService.getAssignment(assignmentId),
        submissionService.getAssignmentSubmissions(assignmentId, { search: searchTerm || undefined, page, pageSize }),
        teacherService.getTeacherAssignments({ page: 1, pageSize: 1000 })
      ]);
      setAssignment(asg);
      setSubmissions(subsData.items);
      setTotalCount(subsData.totalCount);
      setTeacherAssignments(taData.items);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load assignment submissions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!assignmentId) return;
    const timer = setTimeout(() => {
      fetchData();
    }, 300);
    return () => clearTimeout(timer);
  }, [assignmentId, searchTerm, page]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  const getClassName = (classId: string) => teacherAssignments.find(ta => ta.classId === classId)?.className || classId.substring(0, 8) + '...';
  const getSubjectName = (subjectId: string) => teacherAssignments.find(ta => ta.subjectId === subjectId)?.subjectName || subjectId.substring(0, 8) + '...';

  if (isLoading) return <AppShell requireRole="Teacher"><Spinner /></AppShell>;
  if (error || !assignment) return <AppShell requireRole="Teacher"><ErrorState message={error || 'Not found'} /></AppShell>;

  return (
    <AppShell requireRole="Teacher">
      <div className="mb-6">
        <Link href={`/teacher/submissions`} className="text-blue-600 hover:underline text-sm mb-2 inline-block">&larr; Back to Submissions List</Link>
        <h1 className="text-2xl font-bold text-gray-900">Submission & Feedback</h1>
      </div>

      {/* Assignment Header Info */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">{assignment.title}</h2>
        <p className="text-sm text-gray-600 mb-1"><span className="font-medium text-gray-800">Deadline:</span> {new Date(assignment.deadline).toLocaleString()}</p>
        <p className="text-sm text-gray-600 mb-4"><span className="font-medium text-gray-800">Max Marks:</span> {assignment.maximumMarks}</p>
        <div className="text-sm text-gray-800 border-t border-gray-100 pt-4">
          <span className="font-medium text-gray-900 block mb-2">Description:</span>
          <div className="whitespace-pre-wrap">{assignment.description || <span className="text-gray-400 italic">No description provided.</span>}</div>
        </div>
      </div>

      <div className="mb-6 flex gap-4">
        <Input 
          placeholder="Search by student name, email, or status..." 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted At</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marks</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {submissions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">No submissions found.</td>
                </tr>
              ) : (
                submissions.map((sub) => (
                  <tr key={sub.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{sub.studentName || 'Unknown Student'}</div>
                      <div className="text-sm text-gray-500">{sub.studentEmail || sub.studentId}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getClassName(assignment.classId)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getSubjectName(assignment.subjectId)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(sub.submittedAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {sub.status === SubmissionStatus.Graded ? (
                        <Badge variant="success">Graded</Badge>
                      ) : (
                        <Badge variant="warning">Pending</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {sub.status === SubmissionStatus.Graded ? `${sub.marks} / ${assignment.maximumMarks}` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <Link href={`/teacher/submissions/${assignmentId}/grade/${sub.id}`}>
                        <IconButton 
                          icon={<Pencil className="h-4 w-4" />} 
                          aria-label="Update Grade" 
                          title="Update Grade" 
                          variant="primary" 
                        />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <Pagination
            currentPage={page}
            totalCount={totalCount}
            pageSize={pageSize}
            onPageChange={setPage}
          />
        </div>
      </div>


    </AppShell>
  );
}
