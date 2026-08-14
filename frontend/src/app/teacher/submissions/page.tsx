'use client';

import React, { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { assignmentService } from '@/services/assignmentService';
import { AssignmentDto, AssignmentStatus } from '@/types/assignment';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Pagination } from '@/components/ui/Pagination';
import { Input } from '@/components/ui/Input';
import { TeacherAssignmentViewDto } from '@/types/admin';
import { teacherService } from '@/services/teacherService';
import { ErrorState, EmptyState } from '@/components/ui/Feedback';
import { ClipboardList, Trash2, Eye } from 'lucide-react';
import Link from 'next/link';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { useToast } from '@/hooks/useToast';

export default function ViewSubmissionsPage() {
  const [assignments, setAssignments] = useState<AssignmentDto[]>([]);
  const [teacherAssignments, setTeacherAssignments] = useState<TeacherAssignmentViewDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;
  const toast = useToast();
  
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [asgData, taData] = await Promise.all([
        assignmentService.getMyAssignments({
          search: searchTerm || undefined,
          page,
          pageSize
        }),
        teacherService.getTeacherAssignments({ page: 1, pageSize: 1000 })
      ]);
      setAssignments(asgData.items);
      setTotalCount(asgData.totalCount);
      setTeacherAssignments(taData.items);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch assignments');
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

  const getClassName = (classId: string) => teacherAssignments.find(ta => ta.classId === classId)?.className || classId.substring(0, 8) + '...';
  const getSubjectName = (subjectId: string) => teacherAssignments.find(ta => ta.subjectId === subjectId)?.subjectName || subjectId.substring(0, 8) + '...';

  const handleDeleteClick = (id: string) => {
    setAssignmentToDelete(id);
    setConfirmDeleteOpen(true);
  };

  const executeDelete = async () => {
    if (!assignmentToDelete) return;
    setIsDeleting(true);
    try {
      await assignmentService.deleteAssignment(assignmentToDelete);
      fetchData();
      toast.success('Assignment deleted successfully.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete assignment');
    } finally {
      setIsDeleting(false);
      setConfirmDeleteOpen(false);
      setAssignmentToDelete(null);
    }
  };

  return (
    <AppShell requireRole="Teacher">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">View Submissions</h1>
          <p className="text-gray-500">Select an assignment to grade submissions.</p>
        </div>
      </div>

      <div className="mb-6 flex gap-4">
        <Input 
          placeholder="Search assignments by title..." 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      {isLoading ? (
        <Spinner />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchData} />
      ) : assignments.length === 0 ? (
        <EmptyState 
          icon={ClipboardList} 
          title="No assignments found" 
          message="You haven't created any assignments yet."
        />
      ) : (
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deadline</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marks</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {assignments.map((asg) => (
                  <tr key={asg.id}>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 truncate max-w-[200px]" title={asg.title}>
                      {asg.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getClassName(asg.classId)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getSubjectName(asg.subjectId)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(asg.deadline).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{asg.maximumMarks}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {asg.status === AssignmentStatus.Published ? (
                        <Badge variant="success">Published</Badge>
                      ) : (
                        <Badge variant="warning">Draft</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <Link href={`/teacher/submissions/${asg.id}`}>
                        <IconButton 
                          icon={<Eye className="h-4 w-4" />} 
                          aria-label="View Submissions" 
                          title="View Submissions" 
                          variant="primary" 
                        />
                      </Link>
                      <IconButton 
                        icon={<Trash2 className="h-4 w-4" />} 
                        aria-label="Delete Assignment" 
                        title="Delete Assignment" 
                        variant="danger" 
                        onClick={() => handleDeleteClick(asg.id)} 
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
        </div>
      )}

      <ConfirmationDialog
        isOpen={confirmDeleteOpen}
        title="Delete Assignment?"
        description="Are you sure you want to delete this assignment? This action cannot be undone."
        confirmText="Delete"
        onConfirm={executeDelete}
        onCancel={() => {
          setConfirmDeleteOpen(false);
          setAssignmentToDelete(null);
        }}
        loading={isDeleting}
      />
    </AppShell>
  );
}
