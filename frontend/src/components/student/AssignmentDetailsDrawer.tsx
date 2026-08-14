import React, { useEffect, useCallback } from 'react';
import { submissionService } from '@/services/submissionService';
import { Badge } from '@/components/ui/Badge';
import { FileIcon, Download, X } from 'lucide-react';
import { IconButton } from '@/components/ui/IconButton';
import { AssignmentDescription } from '@/components/AssignmentDescription';
import { useToast } from '@/hooks/useToast';

interface Attachment {
  id: string;
  fileName: string;
  contentType: string;
  fileSize: number;
  uploadedAt: string;
}

export interface DrawerAssignmentDetails {
  assignmentId: string;
  title: string;
  description: string;
  subjectName: string;
  teacherName: string;
  deadline: string;
  maximumMarks: number;
  dashboardStatus?: 'Pending' | 'Submitted' | 'Graded' | 'Overdue' | 'Not Submitted';
  submissionId?: string;
  submittedAt?: string;
  updatedAt?: string;
  marks?: number;
  feedback?: string;
  answer?: string;
  attachments?: Attachment[];
}

interface AssignmentDetailsDrawerProps {
  details: DrawerAssignmentDetails | null;
  isOpen: boolean;
  onClose: () => void;
  viewMode?: 'assignment' | 'result';
}

export const AssignmentDetailsDrawer: React.FC<AssignmentDetailsDrawerProps> = ({ details, isOpen, onClose, viewMode = 'assignment' }) => {
  const toast = useToast();

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && isOpen) {
      onClose();
    }
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'unset';
      document.removeEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  const handleDownload = async (attachment: Attachment) => {
    if (!details || !details.submissionId) return;
    try {
      await submissionService.downloadAttachment(details.submissionId, attachment.id, attachment.fileName);
    } catch (err) {
      toast.error('Failed to download file');
    }
  };

  if (!details) return null;

  const percentage = details.marks !== undefined && details.marks !== null && details.maximumMarks > 0
    ? ((details.marks / details.maximumMarks) * 100).toFixed(1)
    : null;
    
  const status = details.dashboardStatus || 'Not Submitted';
  const hasSubmission = status === 'Submitted' || status === 'Graded' || (status === 'Overdue' && details.submissionId);

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`} 
        onClick={onClose}
        aria-hidden="true"
      />
      <div 
        className={`fixed inset-y-0 right-0 z-50 w-full sm:w-[100vw] md:w-[75vw] lg:w-[600px] bg-white shadow-2xl border-l border-gray-200 transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white shrink-0">
          <div>
            <h2 id="drawer-title" className="text-xl font-bold text-gray-900">
              {viewMode === 'assignment' ? 'Assignment Details' : 'Submission Result'}
            </h2>
            <p className="text-sm text-gray-500 truncate max-w-sm sm:max-w-xs">{details.title}</p>
          </div>
          <button 
            onClick={onClose}
            aria-label="Close drawer"
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1 bg-gray-50">
          <div className="space-y-6">
            {viewMode === 'assignment' && (
              <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-base font-bold border-b pb-2 mb-4 text-gray-800">Assignment Information</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500 font-medium">Title</span><span className="font-medium text-gray-900">{details.title}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500 font-medium">Subject</span><span className="font-medium text-gray-900">{details.subjectName}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500 font-medium">Teacher</span><span className="font-medium text-gray-900">{details.teacherName}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500 font-medium">Deadline</span><span className="text-gray-900">{new Date(details.deadline).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500 font-medium">Max Marks</span><span className="text-gray-900">{details.maximumMarks}</span></div>
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <span className="text-gray-500 font-medium block mb-2">Description</span>
                    <div className="text-gray-900">
                      {details.description ? (
                        <AssignmentDescription content={details.description} />
                      ) : (
                        <span className="italic text-gray-500">No description provided.</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {viewMode === 'result' && (
              <div className={`p-5 rounded-lg shadow-sm border ${status === 'Graded' ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}>
                <h3 className={`text-base font-bold border-b pb-2 mb-4 ${status === 'Graded' ? 'border-green-300 text-green-800' : 'text-gray-800'}`}>Submission Information</h3>
                {!hasSubmission ? (
                  <div className="text-sm text-gray-500 flex justify-between items-center">
                    <span>Status</span>
                    <Badge variant={status === 'Overdue' ? 'danger' : 'warning'}>{status}</Badge>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between items-center">
                        <span className={`${status === 'Graded' ? 'text-green-700' : 'text-gray-500'} font-medium`}>Status</span>
                        <Badge variant={status === 'Graded' ? 'success' : 'info'}>{status}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className={`${status === 'Graded' ? 'text-green-700' : 'text-gray-500'} font-medium`}>Submitted At</span>
                        <span className={status === 'Graded' ? 'text-green-900' : 'text-gray-900'}>{details.submittedAt ? new Date(details.submittedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '-'}</span>
                      </div>
                      {status === 'Graded' && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-green-700 font-medium">Marks</span>
                            <span className="font-bold text-green-900 text-base">{details.marks} / {details.maximumMarks}</span>
                          </div>
                          {percentage && (
                            <div className="flex justify-between">
                              <span className="text-green-700 font-medium">Percentage</span>
                              <span className="font-medium text-green-900">{percentage}%</span>
                            </div>
                          )}
                          {details.updatedAt && (
                            <div className="flex justify-between">
                              <span className="text-green-700 font-medium">Graded At</span>
                              <span className="text-green-900">{new Date(details.updatedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    {status === 'Graded' && details.feedback && (
                      <div className="pt-4 border-t border-green-300">
                        <span className="text-green-800 font-bold block mb-1">Teacher Feedback:</span>
                        <p className="text-green-900 whitespace-pre-wrap text-sm">{details.feedback}</p>
                      </div>
                    )}
                    <div className="pt-4 border-t border-gray-200">
                      <span className="text-gray-800 font-bold block mb-2">Student Answer</span>
                      <div className="bg-gray-50 p-4 rounded-md border border-gray-200 whitespace-pre-wrap text-gray-800 text-sm leading-relaxed min-h-[4rem]">
                        {details.answer || <span className="text-gray-500 italic">No text answer. The submission contains attached files.</span>}
                      </div>
                    </div>
                    {details.attachments && details.attachments.length > 0 && (
                      <div className="pt-4 border-t border-gray-200">
                        <span className="text-gray-800 font-bold block mb-2">Attachments</span>
                        <ul className="space-y-3">
                          {details.attachments.map(att => (
                            <li key={att.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50">
                              <div className="flex items-center">
                                <FileIcon className="h-5 w-5 text-blue-500 mr-3 shrink-0" />
                                <div className="min-w-0">
                                  <span className="text-sm font-medium text-gray-900 block truncate max-w-[150px] sm:max-w-[200px]">{att.fileName}</span>
                                  <span className="text-xs text-gray-500">{(att.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                                </div>
                              </div>
                              <IconButton 
                                icon={<Download className="h-4 w-4" />} 
                                aria-label="Download Attachment" 
                                title="Download Attachment" 
                                variant="primary" 
                                onClick={() => handleDownload(att)} 
                              />
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
