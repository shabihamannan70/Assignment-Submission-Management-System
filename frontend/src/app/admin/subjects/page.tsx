'use client';

import React, { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { adminService } from '@/services/adminService';
import { SubjectDto, CreateSubjectDto, UpdateSubjectDto } from '@/types/admin';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorState, EmptyState } from '@/components/ui/Feedback';
import { BookOpen, Plus, Trash2, Pencil } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { IconButton } from '@/components/ui/IconButton';
import { Pagination } from '@/components/ui/Pagination';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import * as z from 'zod';
import { ApiError } from '@/services/apiClient';
import { useToast } from '@/hooks/useToast';

const subjectSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().min(1, 'Code is required'),
  description: z.string().optional(),
});

type SubjectFormValues = z.infer<typeof subjectSchema>;

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<SubjectDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;
  const toast = useToast();
  
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<SubjectFormValues>({
    resolver: zodResolver(subjectSchema),
  });

  const fetchSubjects = async () => {
    setIsLoading(true);
    try {
      const data = await adminService.getSubjects({
        search: searchTerm || undefined,
        page,
        pageSize
      });
      setSubjects(data.items);
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
      fetchSubjects();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, page]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  const handleAddNew = () => {
    setEditingId(null);
    reset({ name: '', code: '', description: '' });
    setShowForm(!showForm);
    setSubmitError(null);
    setSuccessMessage(null);
  };

  const handleEdit = (sub: SubjectDto) => {
    setEditingId(sub.id);
    setValue('name', sub.name);
    setValue('code', sub.code);
    setValue('description', sub.description || '');
    setShowForm(true);
    setSubmitError(null);
    setSuccessMessage(null);
  };

  const onSubmit = async (data: SubjectFormValues) => {
    setSubmitError(null);
    setSuccessMessage(null);
    try {
      if (editingId) {
        await adminService.updateSubject(editingId, data as UpdateSubjectDto);
        toast.success('Subject updated successfully.');
      } else {
        await adminService.createSubject(data as CreateSubjectDto);
        toast.success('Subject created successfully.');
      }
      setShowForm(false);
      reset();
      fetchSubjects();
    } catch (err: any) {
      setSubmitError(err.message);
    }
  };

  const handleDeleteClick = (id: string) => {
    setSubjectToDelete(id);
    setConfirmDeleteOpen(true);
  };

  const executeDelete = async () => {
    if (!subjectToDelete) return;
    setIsDeleting(true);
    try {
      await adminService.deleteSubject(subjectToDelete);
      toast.success('Subject deleted successfully.');
      fetchSubjects();
    } catch (err: any) {
      if (err instanceof ApiError) {
        if (err.statusCode === 409) {
          toast.error(err.message || 'Cannot delete subject because it is currently assigned or referenced.');
        } else if (err.statusCode === 400) {
          toast.error(err.message || 'Validation error.');
        } else if (err.statusCode === 401 || err.statusCode === 403) {
          toast.error('Authorization error.');
        } else if (err.statusCode === 500) {
          toast.error('Generic server error.');
        } else {
          toast.error(err.message || 'Failed to delete subject.');
        }
      } else {
        toast.error('Unable to connect to the server.');
      }
    } finally {
      setIsDeleting(false);
      setConfirmDeleteOpen(false);
      setSubjectToDelete(null);
    }
  };

  return (
    <AppShell requireRole="Admin">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subjects</h1>
          <p className="text-gray-500">Manage subjects offered.</p>
        </div>
        <Button onClick={handleAddNew}>
          {showForm && !editingId ? 'Cancel' : <><Plus className="h-4 w-4 mr-2" /> Add Subject</>}
        </Button>
      </div>
      
      <div className="mb-6 flex gap-4">
        <Input 
          placeholder="Search subjects..." 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-md">
          {successMessage}
        </div>
      )}

      {submitError && !showForm && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
          {submitError}
        </div>
      )}

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">{editingId ? 'Edit Subject' : 'Create New Subject'}</h2>
            {editingId && (
               <button onClick={() => setShowForm(false)} className="text-sm text-gray-500 hover:text-gray-700">Cancel</button>
            )}
          </div>
          {submitError && showForm && <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded">{submitError}</div>}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-lg">
            <Input label="Subject Name" {...register('name')} error={errors.name?.message} />
            <Input label="Subject Code" {...register('code')} error={errors.code?.message} />
            <Textarea label="Description" {...register('description')} error={errors.description?.message} />
            <Button type="submit" isLoading={isSubmitting}>{editingId ? 'Update Subject' : 'Save Subject'}</Button>
          </form>
        </div>
      )}

      {isLoading ? (
        <Spinner />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchSubjects} />
      ) : subjects.length === 0 ? (
        <EmptyState 
          icon={BookOpen} 
          title="No subjects found" 
          message="Get started by creating a new subject."
          action={<Button onClick={handleAddNew}>Add Subject</Button>}
        />
      ) : (
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {subjects.map((sub) => (
                <tr key={sub.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{sub.code}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sub.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 truncate max-w-xs">{sub.description}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <IconButton 
                      icon={<Pencil className="h-4 w-4" />} 
                      aria-label="Edit Subject" 
                      title="Edit Subject" 
                      variant="primary" 
                      onClick={() => handleEdit(sub)} 
                    />
                    <IconButton 
                      icon={<Trash2 className="h-4 w-4" />} 
                      aria-label="Delete Subject" 
                      title="Delete Subject" 
                      variant="danger" 
                      onClick={() => handleDeleteClick(sub.id)} 
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
        title="Delete Subject?"
        description="Are you sure you want to delete this subject? This action cannot be undone."
        confirmText="Delete"
        onConfirm={executeDelete}
        onCancel={() => {
          setConfirmDeleteOpen(false);
          setSubjectToDelete(null);
        }}
        loading={isDeleting}
      />
    </AppShell>
  );
}
