'use client';

import React, { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { assignmentService } from '@/services/assignmentService';
import { StudentAssignmentDto } from '@/types/assignment';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorState, EmptyState } from '@/components/ui/Feedback';
import { FileText, Eye } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { IconButton } from '@/components/ui/IconButton';
import { AssignmentDetailsDrawer, DrawerAssignmentDetails } from '@/components/student/AssignmentDetailsDrawer';
import { Pagination } from '@/components/ui/Pagination';
import { Input } from '@/components/ui/Input';

export default function StudentAssignmentsPage() {
  const [assignments, setAssignments] = useState<StudentAssignmentDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<DrawerAssignmentDetails | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const data = await assignmentService.getAvailableAssignments({
        search: searchTerm || undefined,
        page,
        pageSize
      });
      setAssignments(data.items);
      setTotalCount(data.totalCount);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, page]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  return (
    <AppShell requireRole="Student">
      <AssignmentDetailsDrawer 
        details={selectedAssignment} 
        isOpen={!!selectedAssignment} 
        onClose={() => setSelectedAssignment(null)} 
      />
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Available Assignments</h1>
        <p className="text-gray-500">Assignments for your enrolled classes.</p>
      </div>

      <div className="mb-6 flex gap-4">
        <Input 
          placeholder="Search assignments by title, subject, teacher..." 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      {isLoading ? (
        <Spinner />
      ) : error ? (
        <ErrorState message={error} onRetry={() => window.location.reload()} />
      ) : assignments.length === 0 ? (
        <EmptyState 
          icon={FileText} 
          title="No assignments" 
          message="You have no assignments available at this time."
        />
      ) : (
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assignment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teacher</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deadline</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {assignments.map((asg) => {
                const isOverdue = new Date(asg.deadline) < new Date();
                return (
                  <tr key={asg.id}>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{asg.title}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{asg.subjectName}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{asg.teacherName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={isOverdue ? 'text-red-600' : 'text-gray-500'}>
                        {new Date(asg.deadline).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <IconButton 
                        icon={<Eye className="h-4 w-4" />} 
                        aria-label="View Details" 
                        title="View Details" 
                        variant="primary" 
                        onClick={() => setSelectedAssignment({
                          assignmentId: asg.id,
                          title: asg.title,
                          description: asg.description,
                          subjectName: asg.subjectName,
                          teacherName: asg.teacherName,
                          deadline: asg.deadline,
                          maximumMarks: asg.maximumMarks,
                          dashboardStatus: 'Not Submitted'
                        })}
                      />
                    </td>
                  </tr>
                );
              })}
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
