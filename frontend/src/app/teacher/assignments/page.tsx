'use client';

import React, { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { assignmentService } from '@/services/assignmentService';
import { teacherService } from '@/services/teacherService';
import { AssignmentDto, AssignmentStatus } from '@/types/assignment';
import { TeacherAssignmentViewDto } from '@/types/admin';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorState, EmptyState } from '@/components/ui/Feedback';
import { FileText, Trash2, Eye, Pencil, List, Download, Calendar, Users, BookOpen, File as FileIcon, Clock, CheckCircle2, Circle } from 'lucide-react';
import { Drawer } from '@/components/ui/Drawer';
import { Switch } from '@/components/ui/Switch';
import Link from 'next/link';
import { Pagination } from '@/components/ui/Pagination';
import { Input } from '@/components/ui/Input';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { useToast } from '@/hooks/useToast';

export default function AssignmentListPage() {
  const [assignments, setAssignments] = useState<AssignmentDto[]>([]);
  const [teacherAssignments, setTeacherAssignments] = useState<TeacherAssignmentViewDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentDto | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;
  
  const toast = useToast();
  
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [confirmStatusOpen, setConfirmStatusOpen] = useState(false);
  const [assignmentToStatusToggle, setAssignmentToStatusToggle] = useState<AssignmentDto | null>(null);
  const [isStatusSwitching, setIsStatusSwitching] = useState<Record<string, boolean>>({});

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

  const handleToggleStatusClick = (asg: AssignmentDto) => {
    setAssignmentToStatusToggle(asg);
    setConfirmStatusOpen(true);
  };

  const executeToggleStatus = async () => {
    if (!assignmentToStatusToggle) return;
    setIsStatusSwitching(prev => ({ ...prev, [assignmentToStatusToggle.id]: true }));
    try {
      await assignmentService.toggleAssignmentStatus(assignmentToStatusToggle.id);
      await fetchData();
      toast.success(
        assignmentToStatusToggle.status === AssignmentStatus.Draft 
          ? 'Assignment published successfully.' 
          : 'Assignment moved to draft successfully.'
      );
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status');
    } finally {
      setIsStatusSwitching(prev => ({ ...prev, [assignmentToStatusToggle.id]: false }));
      setConfirmStatusOpen(false);
      setAssignmentToStatusToggle(null);
    }
  };

  const handleView = (assignment: AssignmentDto) => {
    setSelectedAssignment(assignment);
    setIsDrawerOpen(true);
  };

  const getClassName = (classId: string) => {
    return teacherAssignments.find(ta => ta.classId === classId)?.className || classId.substring(0, 8) + '...';
  };

  const getSubjectName = (subjectId: string) => {
    return teacherAssignments.find(ta => ta.subjectId === subjectId)?.subjectName || subjectId.substring(0, 8) + '...';
  };

  return (
    <AppShell requireRole="Teacher">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Assignment List</h1>
          <p className="text-gray-500">Manage your created assignments.</p>
        </div>
        <Link href="/teacher/assignments/create">
          <Button>
            Create Assignment
          </Button>
        </Link>
      </div>

      <div className="mb-6 flex gap-4">
        <Input 
          placeholder="Search assignments by title, class, subject..." 
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
          icon={List} 
          title="No assignments found" 
          message="Create your first assignment to get started."
          action={
            <Link href="/teacher/assignments/create">
              <Button>Create Assignment</Button>
            </Link>
          }
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
                      <div className="flex items-center space-x-2" title={asg.status === AssignmentStatus.Published ? 'Published' : 'Draft'}>
                        <Switch 
                           checked={asg.status === AssignmentStatus.Published} 
                           onChange={() => handleToggleStatusClick(asg)} 
                           disabled={isStatusSwitching[asg.id]}
                        />
                        {asg.status === AssignmentStatus.Published ? (
                          <Badge variant="success">Published</Badge>
                        ) : (
                          <Badge variant="warning">Draft</Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <IconButton 
                        icon={<Eye className="h-4 w-4" />} 
                        aria-label="View Assignment Details" 
                        title="View Assignment Details" 
                        variant="primary" 
                        onClick={() => handleView(asg)}
                      />
                      <Link href={`/teacher/assignments/create?id=${asg.id}`}>
                        <IconButton 
                          icon={<Pencil className="h-4 w-4" />} 
                          aria-label="Edit Assignment" 
                          title="Edit Assignment" 
                          variant="secondary" 
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

      <Drawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        title="Assignment Details"
      >
        {selectedAssignment && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-base font-bold border-b pb-2 mb-4 text-gray-800">Assignment Information</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-gray-500 font-medium">Title</span><span className="font-medium text-gray-900">{selectedAssignment.title}</span></div>
                <div className="flex justify-between"><span className="text-gray-500 font-medium">Class</span><span className="font-medium text-gray-900">{getClassName(selectedAssignment.classId)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500 font-medium">Subject</span><span className="font-medium text-gray-900">{getSubjectName(selectedAssignment.subjectId)}</span></div>
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">Status</span>
                  <span className="font-medium text-gray-900 flex items-center">
                    {selectedAssignment.status === AssignmentStatus.Published ? (
                      <Badge variant="success">Published</Badge>
                    ) : (
                      <Badge variant="warning">Draft</Badge>
                    )}
                  </span>
                </div>
                <div className="flex justify-between"><span className="text-gray-500 font-medium">Deadline</span><span className="text-gray-900">{new Date(selectedAssignment.deadline).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span></div>
                <div className="flex justify-between"><span className="text-gray-500 font-medium">Max Marks</span><span className="text-gray-900">{selectedAssignment.maximumMarks}</span></div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <span className="text-gray-500 font-medium block mb-2">Description</span>
                  <div className="text-gray-900 whitespace-pre-wrap">
                    {selectedAssignment.description || <span className="italic text-gray-500">No description provided.</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Attachments Section */}
            {selectedAssignment.attachments && selectedAssignment.attachments.length > 0 && (
              <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-base font-bold border-b pb-2 mb-4 text-gray-800">Attachments ({selectedAssignment.attachments.length})</h3>
                <ul className="space-y-3">
                  {selectedAssignment.attachments.map(att => (
                    <li key={att.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="flex items-center">
                        <FileIcon className="h-5 w-5 text-blue-500 mr-3 shrink-0" />
                        <div className="min-w-0">
                          <span className="text-sm font-medium text-gray-900 block truncate max-w-[150px] sm:max-w-[200px]">{att.fileName}</span>
                          <span className="text-xs text-gray-500">{(att.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                        </div>
                      </div>
                      <IconButton 
                        type="button" 
                        icon={<Download className="h-4 w-4" />} 
                        aria-label="Download Attachment" 
                        title="Download Attachment" 
                        variant="primary" 
                        onClick={() => {
                          assignmentService.downloadAttachment(selectedAssignment.id, att.id, att.fileName).catch(() => toast.error('Failed to download'));
                        }} 
                      />
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="pt-4 flex justify-end">
               <Link href={`/teacher/assignments/create?id=${selectedAssignment.id}`}>
                  <Button variant="secondary" className="w-full sm:w-auto">
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit Assignment
                  </Button>
               </Link>
            </div>
          </div>
        )}
      </Drawer>

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

      <ConfirmationDialog
        isOpen={confirmStatusOpen}
        title={assignmentToStatusToggle?.status === AssignmentStatus.Draft ? 'Publish Assignment?' : 'Move Assignment to Draft?'}
        description={
          assignmentToStatusToggle?.status === AssignmentStatus.Draft 
            ? 'Are you sure you want to publish this assignment? Students will be able to see it.' 
            : 'Are you sure you want to move this assignment back to draft?'
        }
        confirmText={assignmentToStatusToggle?.status === AssignmentStatus.Draft ? 'Publish' : 'Move to Draft'}
        onConfirm={executeToggleStatus}
        onCancel={() => {
          setConfirmStatusOpen(false);
          setAssignmentToStatusToggle(null);
        }}
        loading={assignmentToStatusToggle ? isStatusSwitching[assignmentToStatusToggle.id] : false}
      />
    </AppShell>
  );
}
