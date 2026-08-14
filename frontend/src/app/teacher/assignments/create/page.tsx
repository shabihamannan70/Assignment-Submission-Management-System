'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { assignmentService } from '@/services/assignmentService';
import { teacherService } from '@/services/teacherService';
import { CreateAssignmentDto, UpdateAssignmentDto, AssignmentStatus, AssignmentAttachmentDto } from '@/types/assignment';
import { TeacherAssignmentViewDto } from '@/types/admin';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorState } from '@/components/ui/Feedback';
import { IconButton } from '@/components/ui/IconButton';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { UploadCloud, File as FileIcon, Download, Trash2 } from 'lucide-react';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { useToast } from '@/hooks/useToast';

const assignmentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  classId: z.string().min(1, 'Class is required'),
  subjectId: z.string().min(1, 'Subject is required'),
  deadline: z.string().refine((val) => new Date(val) > new Date(), { message: 'Deadline must be in the future' }),
  maximumMarks: z.coerce.number().min(1, 'Must be greater than 0'),
  status: z.coerce.number().pipe(z.nativeEnum(AssignmentStatus)),
});

type AssignmentFormValues = z.infer<typeof assignmentSchema>;

function CreateAssignmentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');
  const isEditMode = !!editId;

  const [teacherAssignments, setTeacherAssignments] = useState<TeacherAssignmentViewDto[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<AssignmentAttachmentDto[]>([]);
  const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  
  const toast = useToast();
  
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [attachmentToDelete, setAttachmentToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { register, handleSubmit, reset, control, setValue, formState: { errors, isSubmitting } } = useForm<any>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      status: AssignmentStatus.Draft,
    }
  });

  const selectedClassId = useWatch({ control, name: 'classId' });
  const selectedStatus = useWatch({ control, name: 'status' });

  const fetchAssignmentData = async () => {
    setIsLoading(true);
    try {
      const taData = await teacherService.getTeacherAssignments({ page: 1, pageSize: 1000 });
      setTeacherAssignments(taData.items);

      if (isEditMode && editId) {
        const assignment = await assignmentService.getAssignment(editId);
        const dt = new Date(assignment.deadline);
        const formattedDt = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
        reset({
          title: assignment.title,
          description: assignment.description || '',
          classId: assignment.classId,
          subjectId: assignment.subjectId,
          deadline: formattedDt,
          maximumMarks: assignment.maximumMarks,
          status: assignment.status,
        });
        setExistingAttachments(assignment.attachments || []);
      }
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignmentData();
  }, [editId, isEditMode, reset]);

  const classOptions = useMemo(() => {
    const uniqueClasses = Array.from(new Set(teacherAssignments.map(ta => ta.className)));
    return [
      { value: '', label: 'Select class...' },
      ...uniqueClasses.map(className => {
        const ta = teacherAssignments.find(t => t.className === className);
        return { value: ta?.classId || '', label: className };
      })
    ];
  }, [teacherAssignments]);

  const subjectOptions = useMemo(() => {
    if (!selectedClassId) return [{ value: '', label: 'Select subject...' }];
    
    const subjectsForClass = teacherAssignments.filter(ta => ta.classId === selectedClassId);
    return [
      { value: '', label: 'Select subject...' },
      ...subjectsForClass.map(ta => ({ value: ta.subjectId, label: ta.subjectName }))
    ];
  }, [selectedClassId, teacherAssignments]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const validFiles = newFiles.filter(f => {
        if (f.size > 10 * 1024 * 1024) {
          toast.error(`${f.name} exceeds 10MB limit.`);
          return false;
        }
        const ext = f.name.substring(f.name.lastIndexOf('.')).toLowerCase();
        const allowed = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.jpg', '.jpeg', '.png', '.txt'];
        if (!allowed.includes(ext)) {
          toast.error(`${f.name} has an unsupported file type.`);
          return false;
        }
        return true;
      });
      setFilesToUpload(prev => [...prev, ...validFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFilesToUpload(prev => prev.filter((_, i) => i !== index));
  };

  const handleDeleteAttachmentClick = (attachmentId: string) => {
    setAttachmentToDelete(attachmentId);
    setConfirmDeleteOpen(true);
  };

  const executeDeleteAttachment = async () => {
    if (!editId || !attachmentToDelete) return;
    setIsDeleting(true);
    try {
      await assignmentService.deleteAttachment(editId, attachmentToDelete);
      setExistingAttachments(prev => prev.filter(a => a.id !== attachmentToDelete));
      toast.success('Attachment deleted successfully.');
    } catch (err) {
      toast.error('Failed to delete attachment');
    } finally {
      setIsDeleting(false);
      setConfirmDeleteOpen(false);
      setAttachmentToDelete(null);
    }
  };

  const handleDownload = async (attachment: AssignmentAttachmentDto) => {
    if (!editId) return;
    try {
      await assignmentService.downloadAttachment(editId, attachment.id, attachment.fileName);
    } catch (err) {
      toast.error('Failed to download file');
    }
  };

  const onSubmit = async (data: any) => {
    setSubmitError(null);
    setUploading(true);
    try {
      let assignmentId = editId;
      if (isEditMode && editId) {
        const payload: UpdateAssignmentDto = {
          title: data.title,
          description: data.description,
          deadline: new Date(data.deadline).toISOString(),
          maximumMarks: data.maximumMarks,
        };
        await assignmentService.updateAssignment(editId, payload);
      } else {
        const payload: CreateAssignmentDto = {
          title: data.title,
          description: data.description,
          classId: data.classId,
          subjectId: data.subjectId,
          deadline: new Date(data.deadline).toISOString(),
          maximumMarks: data.maximumMarks,
          status: Number(data.status),
        };
        const res = await assignmentService.createAssignment(payload);
        assignmentId = res.id;
      }

      if (filesToUpload.length > 0 && assignmentId) {
        for (const file of filesToUpload) {
          await assignmentService.uploadAttachment(assignmentId, file);
        }
        setFilesToUpload([]);
        toast.success(isEditMode ? 'Assignment updated and attachments uploaded successfully.' : 'Assignment created and attachments uploaded successfully.');
      } else {
        toast.success(isEditMode ? 'Assignment updated successfully.' : 'Assignment created successfully.');
      }

      router.push('/teacher/assignments');
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to save assignment');
    } finally {
      setUploading(false);
    }
  };

  if (isLoading) {
    return (
      <AppShell requireRole="Teacher">
        <Spinner />
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell requireRole="Teacher">
        <ErrorState message={error} />
      </AppShell>
    );
  }

  return (
    <AppShell requireRole="Teacher">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditMode ? 'Edit Assignment' : 'Create Assignment'}
        </h1>
        <p className="text-gray-500">
          {isEditMode ? 'Update assignment details.' : 'Fill out the form below to create a new assignment.'}
        </p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6 max-w-4xl">
        {submitError && <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded">{submitError}</div>}
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="Title" {...register('title')} error={errors.title?.message as string} />
            <Select 
              label="Subject" 
              {...register('subjectId')} 
              error={errors.subjectId?.message as string}
              options={subjectOptions}
              disabled={!selectedClassId || isEditMode}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Select 
              label="Class" 
              {...register('classId')} 
              error={errors.classId?.message as string}
              options={classOptions}
              disabled={isEditMode}
              onChange={(e) => {
                 setValue('classId', e.target.value);
                 setValue('subjectId', '');
              }}
            />
            <Input type="number" label="Maximum Marks" {...register('maximumMarks')} error={errors.maximumMarks?.message as string} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input type="datetime-local" label="Deadline" {...register('deadline')} error={errors.deadline?.message as string} />
            
            <div className="flex flex-col space-y-2">
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <div className="flex items-center space-x-4 mt-2">
                <label className="inline-flex items-center">
                  <input 
                    type="radio" 
                    className="form-radio text-blue-600 focus:ring-blue-500 h-4 w-4" 
                    value={AssignmentStatus.Draft}
                    checked={Number(selectedStatus) === AssignmentStatus.Draft}
                    {...register('status')}
                    disabled={isEditMode}
                  />
                  <span className="ml-2 text-sm text-gray-700">Draft</span>
                </label>
                <label className="inline-flex items-center">
                  <input 
                    type="radio" 
                    className="form-radio text-blue-600 focus:ring-blue-500 h-4 w-4" 
                    value={AssignmentStatus.Published}
                    checked={Number(selectedStatus) === AssignmentStatus.Published}
                    {...register('status')}
                    disabled={isEditMode}
                  />
                  <span className="ml-2 text-sm text-gray-700">Published</span>
                </label>
              </div>
              {errors.status && <span className="text-red-500 text-sm">{errors.status.message as string}</span>}
            </div>
          </div>

          <div>
            <Textarea 
              label="Description" 
              {...register('description')} 
              error={errors.description?.message as string} 
              rows={4} 
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Attachments</label>
            
            {existingAttachments.length > 0 && (
              <ul className="space-y-2 mb-4">
                {existingAttachments.map(att => (
                  <li key={att.id} className="flex items-center justify-between p-3 border border-gray-200 rounded bg-gray-50">
                    <div className="flex items-center">
                      <FileIcon className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-sm font-medium">{att.fileName}</span>
                      <span className="text-xs text-gray-500 ml-2">({(att.fileSize / 1024 / 1024).toFixed(2)} MB)</span>
                    </div>
                    <div className="flex space-x-2">
                      <IconButton 
                        type="button" 
                        icon={<Download className="h-4 w-4" />} 
                        aria-label="Download Attachment" 
                        title="Download Attachment" 
                        variant="primary" 
                        onClick={() => handleDownload(att)} 
                      />
                      <IconButton 
                        type="button" 
                        icon={<Trash2 className="h-4 w-4" />} 
                        aria-label="Delete Attachment" 
                        title="Delete Attachment" 
                        variant="danger" 
                        onClick={() => handleDeleteAttachmentClick(att.id)} 
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:bg-gray-50 relative">
              <div className="space-y-1 text-center">
                <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                    <span>Upload files</span>
                    <input id="file-upload" name="file-upload" type="file" multiple className="sr-only" onChange={handleFileChange} disabled={uploading} />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">
                  PDF, Word, Excel, PowerPoint, JPG, PNG, TXT up to 10MB
                </p>
              </div>
            </div>
            
            {filesToUpload.length > 0 && (
              <ul className="mt-4 space-y-2">
                {filesToUpload.map((file, idx) => (
                  <li key={idx} className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded">
                    <span className="text-sm text-blue-800">{file.name}</span>
                    <IconButton 
                      type="button" 
                      icon={<Trash2 className="h-4 w-4" />} 
                      aria-label="Remove File" 
                      title="Remove File" 
                      variant="danger" 
                      onClick={() => removeFile(idx)} 
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex justify-end">
            <Button type="submit" isLoading={isSubmitting || uploading}>
              {isEditMode ? 'Update' : 'Submit'}
            </Button>
          </div>
        </form>
      </div>

      <ConfirmationDialog
        isOpen={confirmDeleteOpen}
        title="Delete Attachment?"
        description="Are you sure you want to delete this file? This action cannot be undone."
        confirmText="Delete"
        onConfirm={executeDeleteAttachment}
        onCancel={() => {
          setConfirmDeleteOpen(false);
          setAttachmentToDelete(null);
        }}
        loading={isDeleting}
      />
    </AppShell>
  );
}

export default function MyAssignmentsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CreateAssignmentContent />
    </Suspense>
  );
}
