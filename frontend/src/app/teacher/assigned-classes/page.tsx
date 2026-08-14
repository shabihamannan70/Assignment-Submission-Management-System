'use client';

import React, { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { teacherService } from '@/services/teacherService';
import { TeacherAssignmentViewDto } from '@/types/admin';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorState, EmptyState } from '@/components/ui/Feedback';
import { IconButton } from '@/components/ui/IconButton';
import { BookOpen, Eye } from 'lucide-react';
import { Drawer } from '@/components/ui/Drawer';
import { Pagination } from '@/components/ui/Pagination';
import { Input } from '@/components/ui/Input';

export default function AssignedClassesPage() {
  const [assignments, setAssignments] = useState<TeacherAssignmentViewDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedAssignment, setSelectedAssignment] = useState<TeacherAssignmentViewDto | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const data = await teacherService.getTeacherAssignments({ search: searchTerm || undefined, page, pageSize });
      setAssignments(data.items);
      setTotalCount(data.totalCount);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch assigned classes');
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

  const handleView = (asg: TeacherAssignmentViewDto) => {
    setSelectedAssignment(asg);
    setIsDrawerOpen(true);
  };

  return (
    <AppShell requireRole="Teacher">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Assigned Class & Subject</h1>
        <p className="text-gray-500">View the classes and subjects assigned to you.</p>
      </div>

      <div className="mb-6 flex gap-4">
        <Input 
          placeholder="Search by class or subject..." 
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
          icon={BookOpen} 
          title="No assignments found" 
          message="You have no classes or subjects assigned yet."
        />
      ) : (
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teacher Name</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {assignments.map((asg) => (
                  <tr key={`${asg.classId}-${asg.subjectId}`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{asg.className}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{asg.subjectName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{asg.teacherName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <IconButton 
                        icon={<Eye className="h-4 w-4" />} 
                        aria-label="View Details" 
                        title="View Details" 
                        variant="primary" 
                        onClick={() => handleView(asg)}
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
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Class Name</h3>
              <p className="mt-1 text-sm text-gray-900">{selectedAssignment.className}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Subject Name</h3>
              <p className="mt-1 text-sm text-gray-900">{selectedAssignment.subjectName}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Teacher Name</h3>
              <p className="mt-1 text-sm text-gray-900">{selectedAssignment.teacherName}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Teacher Email</h3>
              <p className="mt-1 text-sm text-gray-900">{selectedAssignment.teacherEmail}</p>
            </div>
          </div>
        )}
      </Drawer>
    </AppShell>
  );
}
