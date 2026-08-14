'use client';

import React, { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { dashboardService } from '@/services/dashboardService';
import { StudentDashboardDto, StudentDashboardAssignmentDto } from '@/types/dashboard';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorState } from '@/components/ui/Feedback';
import { Badge } from '@/components/ui/Badge';
import { FileText, Clock, CheckCircle, UploadCloud, Percent, Eye, Pencil, Award } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { AssignmentDetailsDrawer, DrawerAssignmentDetails } from '@/components/student/AssignmentDetailsDrawer';
import { IconButton } from '@/components/ui/IconButton';

export default function StudentDashboard() {
  const [data, setData] = useState<StudentDashboardDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<DrawerAssignmentDetails | null>(null);
  const [drawerMode, setDrawerMode] = useState<'assignment' | 'result'>('assignment');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await dashboardService.getStudentDashboard();
        setData(result);
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending': return <Badge variant="warning">Pending</Badge>;
      case 'Submitted': return <Badge variant="info">Submitted</Badge>;
      case 'Graded': return <Badge variant="success">Graded</Badge>;
      case 'Overdue': return <Badge variant="danger">Overdue</Badge>;
      default: return <Badge variant="default">{status}</Badge>;
    }
  };

  const getActionLink = (assignment: StudentDashboardAssignmentDto) => {
    switch (assignment.dashboardStatus) {
      case 'Graded':
      case 'Overdue':
        return (
          <div className="flex justify-end gap-2">
            <IconButton 
              icon={<Eye className="h-4 w-4" />} 
              aria-label="View Details" 
              title="View Details" 
              variant="primary" 
              onClick={() => {
                setDrawerMode('assignment');
                setSelectedAssignment(assignment as DrawerAssignmentDetails);
              }} 
            />
            <IconButton 
              icon={<Award className="h-4 w-4" />} 
              aria-label="View Result" 
              title="View Result" 
              variant="success" 
              onClick={() => {
                setDrawerMode('result');
                setSelectedAssignment(assignment as DrawerAssignmentDetails);
              }} 
            />
          </div>
        );
      case 'Submitted':
      case 'Pending':
        return (
          <div className="flex justify-end gap-2">
            <IconButton 
              icon={<Eye className="h-4 w-4" />} 
              aria-label="View Details" 
              title="View Details" 
              variant="primary" 
              onClick={() => {
                setDrawerMode('assignment');
                setSelectedAssignment(assignment as DrawerAssignmentDetails);
              }} 
            />
            <Link href={`/student/assignments/${assignment.assignmentId}`}>
              <IconButton icon={<Pencil className="h-4 w-4" />} aria-label="Edit/Submit" title="Edit/Submit" variant="secondary" />
            </Link>
          </div>
        );
      default:
        return null;
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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Student Dashboard</h1>
          <p className="text-gray-500">Overview of your tasks and performance.</p>
        </div>
        <Link href="/student/assignments">
          <Button>Available Assignments</Button>
        </Link>
      </div>

      {isLoading ? (
        <Spinner />
      ) : error || !data ? (
        <ErrorState message={error || 'Failed to load data'} onRetry={() => window.location.reload()} />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5 mb-8">
            <Card className="p-4 flex items-center gap-4">
              <div className="p-3 bg-gray-100 rounded-lg">
                <FileText className="h-6 w-6 text-gray-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Assignments</p>
                <p className="text-2xl font-semibold text-gray-900">{data.totalAssignments}</p>
              </div>
            </Card>
            <Card className="p-4 flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Pending</p>
                <p className="text-2xl font-semibold text-gray-900">{data.pendingCount}</p>
              </div>
            </Card>
            <Card className="p-4 flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <UploadCloud className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Submitted</p>
                <p className="text-2xl font-semibold text-gray-900">{data.submittedCount}</p>
              </div>
            </Card>
            <Card className="p-4 flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Graded</p>
                <p className="text-2xl font-semibold text-gray-900">{data.gradedCount}</p>
              </div>
            </Card>
            <Card className="p-4 flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Percent className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Average Score</p>
                <p className="text-2xl font-semibold text-gray-900">{data.averageScore !== null ? `${data.averageScore}%` : '-'}</p>
              </div>
            </Card>
          </div>

          <h2 className="text-lg font-bold text-gray-900 mb-4">Assignment List</h2>
          
          {data.recentAssignments.length === 0 ? (
            <p className="text-gray-500 italic">No assignments found.</p>
          ) : (
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assignment</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teacher</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deadline</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submission Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marks</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.recentAssignments.map((a) => (
                    <tr key={a.assignmentId}>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{a.title}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{a.subjectName}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{a.teacherName}</div>
                        {a.teacherEmail && <div className="text-xs text-gray-500">{a.teacherEmail}</div>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(a.deadline).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(a.dashboardStatus)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                        {a.dashboardStatus === 'Graded' ? `${a.marks} / ${a.maximumMarks}` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {getActionLink(a)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </AppShell>
  );
}
