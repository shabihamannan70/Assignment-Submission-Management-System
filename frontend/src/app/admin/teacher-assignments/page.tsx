'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorState, EmptyState } from '@/components/ui/Feedback';
import { GraduationCap, Pencil, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { adminService } from '@/services/adminService';
import { TeacherAssignmentViewDto, ClassDto, SubjectDto, UserDto } from '@/types/admin';
import { IconButton } from '@/components/ui/IconButton';
import { Pagination } from '@/components/ui/Pagination';
import { Input } from '@/components/ui/Input';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { useToast } from '@/hooks/useToast';

const assignSchema = z.object({
  teacherId: z.string().min(1, 'Please select a teacher'),
  classId: z.string().min(1, 'Please select a class'),
  subjectId: z.string().min(1, 'Please select a subject')
});

type AssignForm = z.infer<typeof assignSchema>;

export default function TeacherAssignmentsPage() {
  const [assignments, setAssignments] = useState<TeacherAssignmentViewDto[]>([]);
  const [teachers, setTeachers] = useState<UserDto[]>([]);
  const [classes, setClasses] = useState<ClassDto[]>([]);
  const [subjects, setSubjects] = useState<SubjectDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;

  const toast = useToast();
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = useState<{ id: string, name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const form = useForm<AssignForm>({
    resolver: zodResolver(assignSchema)
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [assignmentsData, teachersData, classesData, subjectsData] = await Promise.all([
        adminService.getTeacherAssignments({ search: searchTerm || undefined, page, pageSize }),
        adminService.getUsers('Teacher', { page: 1, pageSize: 1000 }),
        adminService.getClasses({ page: 1, pageSize: 1000 }),
        adminService.getSubjects({ page: 1, pageSize: 1000 })
      ]);
      setAssignments(assignmentsData.items);
      setTotalCount(assignmentsData.totalCount);
      setTeachers(teachersData.items.filter(t => t.isActive));
      setClasses(classesData.items);
      setSubjects(subjectsData.items);
      setError(null);
    } catch (err: any) {
      setError(err.name === 'ApiError' ? err.message : 'Failed to load data');
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

  const onSubmit = async (data: AssignForm) => {
    try {
      if (editingId) {
        await adminService.updateTeacherAssignment(editingId, data);
        setEditingId(null);
        toast.success('Assignment updated successfully.');
      } else {
        await adminService.assignTeacher(data);
        toast.success('Teacher assigned successfully.');
      }
      form.reset();
      loadData();
    } catch (err: any) {
      if (err.name === 'ApiError') {
        form.setError('root', { message: err.message });
      } else {
        form.setError('root', { message: editingId ? 'Failed to update assignment' : 'Failed to assign teacher' });
      }
    }
  };

  const handleEdit = (assignment: TeacherAssignmentViewDto) => {
    setEditingId(assignment.id);
    form.reset({
      teacherId: assignment.teacherId,
      classId: classes.find(c => c.name === assignment.className)?.id || '',
      subjectId: subjects.find(s => s.name === assignment.subjectName)?.id || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    form.reset({
      teacherId: '',
      classId: '',
      subjectId: ''
    });
    form.clearErrors();
  };

  const handleDeleteClick = (id: string, teacherName: string, teacherEmail: string, className: string, subjectName: string) => {
    setAssignmentToDelete({
      id,
      name: `Teacher: ${teacherName}\nEmail: ${teacherEmail}\nClass: ${className}\nSubject: ${subjectName}`
    });
    setConfirmDeleteOpen(true);
  };

  const executeDelete = async () => {
    if (!assignmentToDelete) return;
    setIsDeleting(true);
    try {
      await adminService.deleteTeacherAssignment(assignmentToDelete.id);
      toast.success('Assignment deleted successfully.');
      loadData();
    } catch (err: any) {
      toast.error(err.name === 'ApiError' ? err.message : 'Failed to delete assignment');
    } finally {
      setIsDeleting(false);
      setConfirmDeleteOpen(false);
      setAssignmentToDelete(null);
    }
  };

  const teacherOptions = [
    { value: '', label: 'Select teacher...' },
    ...teachers.map(t => ({ value: t.id, label: `${t.name} — ${t.email}` }))
  ];

  const classOptions = [
    { value: '', label: 'Select class...' },
    ...classes.map(c => ({ value: c.id, label: c.name }))
  ];

  const subjectOptions = [
    { value: '', label: 'Select subject...' },
    ...subjects.map(s => ({ value: s.id, label: s.name }))
  ];

  return (
    <AppShell requireRole="Admin">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Teacher Assignments</h1>
        <p className="text-gray-500">Assign teachers to specific classes and subjects.</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h2 className="text-lg font-medium mb-4">{editingId ? 'Edit Teacher Assignment' : 'Assign Teacher'}</h2>
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <Select
              label="Teacher"
              options={teacherOptions}
              {...form.register('teacherId')}
              error={form.formState.errors.teacherId?.message}
            />
            <Select
              label="Class"
              options={classOptions}
              {...form.register('classId')}
              error={form.formState.errors.classId?.message}
            />
            <Select
              label="Subject"
              options={subjectOptions}
              {...form.register('subjectId')}
              error={form.formState.errors.subjectId?.message}
            />
          </div>

          {form.formState.errors.root && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded mb-4">{form.formState.errors.root.message}</div>
          )}

          <div className="flex space-x-3 justify-end">
            <Button type="submit" isLoading={form.formState.isSubmitting}>
              {editingId ? 'Update Assignment' : 'Assign Teacher'}
            </Button>
            {editingId && (
              <Button type="button" variant="secondary" onClick={handleCancelEdit}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </div>

      <h2 className="text-lg font-medium mb-4">Assigned Teacher List</h2>

      <div className="mb-6 flex gap-4">
        <Input
          placeholder="Search by teacher, class, or subject..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      {loading ? (
        <div className="flex justify-center p-8"><Spinner /></div>
      ) : error ? (
        <ErrorState message={error} onRetry={loadData} />
      ) : assignments.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No assignments found"
          message="Assign a teacher to a class and subject to see them here."
        />
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teacher</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {assignments.map((assignment) => (
                <tr key={assignment.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {assignment.teacherName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {assignment.teacherEmail}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {assignment.className}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {assignment.subjectName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <IconButton
                      icon={<Pencil className="h-4 w-4" />}
                      aria-label="Edit Teacher Assignment"
                      title="Edit Teacher Assignment"
                      variant="primary"
                      onClick={() => handleEdit(assignment)}
                    />
                    <IconButton
                      icon={<Trash2 className="h-4 w-4" />}
                      aria-label="Delete Teacher Assignment"
                      title="Delete Teacher Assignment"
                      variant="danger"
                      onClick={() => handleDeleteClick(assignment.id, assignment.teacherName, assignment.teacherEmail, assignment.className, assignment.subjectName)}
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

      <ConfirmationDialog
        isOpen={confirmDeleteOpen}
        title="Remove Teacher Assignment?"
        description={<div className="whitespace-pre-line">Are you sure you want to remove this teacher assignment?{'\n\n'}{assignmentToDelete?.name}</div>}
        confirmText="Remove"
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
