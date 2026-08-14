'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorState, EmptyState } from '@/components/ui/Feedback';
import { FileText } from 'lucide-react';
import { adminService } from '@/services/adminService';
import { AdminAssignmentDto } from '@/types/admin';
import { Pagination } from '@/components/ui/Pagination';

export default function AdminAssignmentsPage() {
  const [assignments, setAssignments] = useState<AdminAssignmentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await adminService.getAssignments({ search: searchTerm || undefined, page, pageSize });
      setAssignments(data.items);
      setTotalCount(data.totalCount);
      setError(null);
    } catch (err: any) {
      setError(err.name === 'ApiError' ? err.message : 'Failed to load assignments');
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

  return (
    <AppShell requireRole="Admin">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Assignments</h1>
          <p className="text-gray-500">Read-only view of all assignments across all classes.</p>
        </div>
      </div>

      <div className="mb-6">
        <Input 
          placeholder="Search by title, teacher, class, or subject..." 
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
          icon={FileText} 
          title="No assignments found" 
          message="No assignments match your search or none have been created yet." 
        />
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teacher</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class / Subject</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deadline</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {assignments.map((assignment) => (
                <tr key={assignment.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{assignment.title}</div>
                    <div className="text-xs text-gray-500">Max Marks: {assignment.maximumMarks}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {assignment.teacherName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{assignment.className}</div>
                    <div className="text-sm text-gray-500">{assignment.subjectName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      assignment.status === 'Published' ? 'bg-green-100 text-green-800' : 
                      assignment.status === 'Draft' ? 'bg-gray-100 text-gray-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {assignment.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(assignment.deadline).toLocaleString()}
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
