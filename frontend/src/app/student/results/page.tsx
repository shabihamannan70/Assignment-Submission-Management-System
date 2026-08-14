'use client';

import React, { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { assignmentService } from '@/services/assignmentService';
import { StudentDashboardAssignmentDto } from '@/types/dashboard';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorState, EmptyState } from '@/components/ui/Feedback';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';
import { AssignmentDetailsDrawer, DrawerAssignmentDetails } from '@/components/student/AssignmentDetailsDrawer';
import { IconButton } from '@/components/ui/IconButton';
import { Pagination } from '@/components/ui/Pagination';
import { Input } from '@/components/ui/Input';
import { Eye, Award } from 'lucide-react';

export default function MyResultsPage() {
  const [results, setResults] = useState<StudentDashboardAssignmentDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<DrawerAssignmentDetails | null>(null);
  const [drawerMode, setDrawerMode] = useState<'assignment' | 'result'>('assignment');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const data = await assignmentService.getStudentResults({
        search: searchTerm || undefined,
        page,
        pageSize
      });
      setResults(data.items);
      setTotalCount(data.totalCount);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load results');
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Submitted': return <Badge variant="info">Submitted</Badge>;
      case 'Graded': return <Badge variant="success">Graded</Badge>;
      default: return <Badge variant="default">{status}</Badge>;
    }
  };

  return (
    <AppShell requireRole="Student">
      <AssignmentDetailsDrawer 
        details={selectedAssignment} 
        isOpen={!!selectedAssignment} 
        onClose={() => setSelectedAssignment(null)} 
        viewMode={drawerMode}
      />
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Results</h1>
        <p className="text-gray-500">Track your submitted and graded assignments.</p>
      </div>

      <div className="mb-6 flex gap-4">
        <Input 
          placeholder="Search results by title, subject, teacher, status..." 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      {isLoading ? (
        <Spinner />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchData} />
      ) : results.length === 0 ? (
        <EmptyState 
          icon={Award} 
          title="No results found" 
          message="You have no submitted or graded assignments matching your search." 
        />
      ) : (
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assignment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teacher</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted At</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marks</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {results.map((a) => (
                <tr key={a.assignmentId}>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{a.title}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{a.subjectName}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{a.teacherName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {a.submittedAt ? new Date(a.submittedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(a.dashboardStatus)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                    {a.dashboardStatus === 'Graded' ? `${a.marks} / ${a.maximumMarks}` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <IconButton 
                        icon={<Eye className="h-4 w-4" />} 
                        aria-label="View Details" 
                        title="View Details" 
                        variant="primary" 
                        onClick={() => {
                          setDrawerMode('assignment');
                          setSelectedAssignment(a as DrawerAssignmentDetails);
                        }} 
                      />
                      <IconButton 
                        icon={<Award className="h-4 w-4" />} 
                        aria-label="View Result" 
                        title="View Result" 
                        variant="success" 
                        onClick={() => {
                          setDrawerMode('result');
                          setSelectedAssignment(a as DrawerAssignmentDetails);
                        }} 
                      />
                    </div>
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
