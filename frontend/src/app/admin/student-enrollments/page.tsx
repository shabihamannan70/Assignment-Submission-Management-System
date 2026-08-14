'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorState, EmptyState } from '@/components/ui/Feedback';
import { Users, GraduationCap, Pencil, Trash2 } from 'lucide-react';
import { IconButton } from '@/components/ui/IconButton';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { adminService } from '@/services/adminService';
import { StudentClassViewDto, ClassDto, UserDto } from '@/types/admin';
import { Pagination } from '@/components/ui/Pagination';
import { Input } from '@/components/ui/Input';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { useToast } from '@/hooks/useToast';

const enrollSchema = z.object({
  studentId: z.string().min(1, 'Please select a student'),
  classId: z.string().min(1, 'Please select a class')
});

type EnrollForm = z.infer<typeof enrollSchema>;

export default function StudentEnrollmentsPage() {
  const [enrollments, setEnrollments] = useState<StudentClassViewDto[]>([]);
  const [students, setStudents] = useState<UserDto[]>([]);
  const [classes, setClasses] = useState<ClassDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [editingOldClassId, setEditingOldClassId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;
  const toast = useToast();

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [enrollmentToDelete, setEnrollmentToDelete] = useState<{ studentId: string, classId: string, name?: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const form = useForm<EnrollForm>({
    resolver: zodResolver(enrollSchema)
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [enrollmentsData, studentsData, classesData] = await Promise.all([
        adminService.getStudentEnrollments({ search: searchTerm || undefined, page, pageSize }),
        adminService.getUsers('Student', { page: 1, pageSize: 1000 }),
        adminService.getClasses({ page: 1, pageSize: 1000 })
      ]);
      setEnrollments(enrollmentsData.items);
      setTotalCount(enrollmentsData.totalCount);
      setStudents(studentsData.items.filter(s => s.isActive));
      setClasses(classesData.items);
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

  const onSubmit = async (data: EnrollForm) => {
    try {
      if (editingStudentId && editingOldClassId) {
        await adminService.updateStudentEnrollment(editingStudentId, editingOldClassId, data);
        setEditingStudentId(null);
        setEditingOldClassId(null);
        toast.success('Enrollment updated successfully.');
      } else {
        await adminService.enrollStudent(data);
        toast.success('Student enrolled successfully.');
      }
      form.reset();
      loadData();
    } catch (err: any) {
      if (err.name === 'ApiError') {
        form.setError('root', { message: err.message });
      } else {
        form.setError('root', { message: 'Failed to save enrollment' });
      }
    }
  };

  const handleEdit = (enrollment: StudentClassViewDto) => {
    setEditingStudentId(enrollment.studentId);
    setEditingOldClassId(enrollment.classId);
    form.setValue('studentId', enrollment.studentId);
    form.setValue('classId', enrollment.classId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingStudentId(null);
    setEditingOldClassId(null);
    form.reset();
    form.clearErrors();
  };

  const handleDeleteClick = (studentId: string, classId: string, studentName: string, className: string) => {
    setEnrollmentToDelete({ studentId, classId, name: `Student: ${studentName}\nClass: ${className}` });
    setConfirmDeleteOpen(true);
  };

  const executeDelete = async () => {
    if (!enrollmentToDelete) return;
    setIsDeleting(true);
    try {
      await adminService.deleteStudentEnrollment(enrollmentToDelete.studentId, enrollmentToDelete.classId);
      toast.success('Enrollment deleted successfully.');
      loadData();
    } catch (err: any) {
      toast.error(err.name === 'ApiError' ? err.message : 'Failed to delete enrollment');
    } finally {
      setIsDeleting(false);
      setConfirmDeleteOpen(false);
      setEnrollmentToDelete(null);
    }
  };

  const studentOptions = [
    { value: '', label: 'Select student...' },
    ...students.map(s => ({ value: s.id, label: `${s.name} — ${s.email}` }))
  ];

  const classOptions = [
    { value: '', label: 'Select class...' },
    ...classes.map(c => ({ value: c.id, label: c.name }))
  ];

  return (
    <AppShell requireRole="Admin">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Student Enrollments</h1>
        <p className="text-gray-500">Enroll students into specific classes.</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">{editingStudentId ? 'Edit Enrollment' : 'Enroll Student'}</h2>
          {editingStudentId && (
            <button type="button" onClick={handleCancelEdit} className="text-sm text-gray-500 hover:text-gray-700">Cancel</button>
          )}
        </div>
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Select
              label="Student"
              options={studentOptions}
              {...form.register('studentId')}
              error={form.formState.errors.studentId?.message}
            />
            <Select
              label="Class"
              options={classOptions}
              {...form.register('classId')}
              error={form.formState.errors.classId?.message}
            />
          </div>

          {form.formState.errors.root && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded mb-4">{form.formState.errors.root.message}</div>
          )}

          <div className="flex justify-end space-x-3">
            <Button type="submit" isLoading={form.formState.isSubmitting}>
              {editingStudentId ? 'Update Enrollment' : 'Enroll Student'}
            </Button>
            {editingStudentId && (
              <Button type="button" variant="secondary" onClick={handleCancelEdit}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </div>

      <h2 className="text-lg font-medium mb-4">Current Enrollments</h2>

      <div className="mb-6 flex gap-4">
        <Input
          placeholder="Search by student or class..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      {loading ? (
        <div className="flex justify-center p-8"><Spinner /></div>
      ) : error ? (
        <ErrorState message={error} onRetry={loadData} />
      ) : enrollments.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No enrollments found"
          message="Enroll a student in a class to see them here."
        />
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enrollment Date</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {enrollments.map((enrollment) => (
                <tr key={`${enrollment.studentId}-${enrollment.className}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{enrollment.studentName}</div>
                    <div className="text-sm text-gray-500">{enrollment.studentEmail}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {enrollment.className}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(enrollment.joinedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <IconButton
                      icon={<Pencil className="h-4 w-4" />}
                      aria-label="Edit Enrollment"
                      title="Edit Enrollment"
                      variant="primary"
                      onClick={() => handleEdit(enrollment)}
                    />
                    <IconButton
                      icon={<Trash2 className="h-4 w-4" />}
                      aria-label="Delete Enrollment"
                      title="Delete Enrollment"
                      variant="danger"
                      onClick={() => handleDeleteClick(enrollment.studentId, enrollment.classId, enrollment.studentName, enrollment.className)}
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
        title="Delete Enrollment?"
        description={<div className="whitespace-pre-line">Are you sure you want to delete this student enrollment?{'\n\n'}{enrollmentToDelete?.name}</div>}
        confirmText="Delete"
        onConfirm={executeDelete}
        onCancel={() => {
          setConfirmDeleteOpen(false);
          setEnrollmentToDelete(null);
        }}
        loading={isDeleting}
      />
    </AppShell>
  );
}
