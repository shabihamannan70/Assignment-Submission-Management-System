'use client';

import React, { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { assignmentService } from '@/services/assignmentService';
import { AssignmentDto, AssignmentStatus } from '@/types/assignment';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorState } from '@/components/ui/Feedback';
import { FileText, Clock, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function TeacherDashboard() {
  const [assignments, setAssignments] = useState<AssignmentDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await assignmentService.getMyAssignments({ page: 1, pageSize: 1000 });
        setAssignments(data.items);
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const draftCount = assignments.filter(a => a.status === AssignmentStatus.Draft).length;
  const publishedCount = assignments.filter(a => a.status === AssignmentStatus.Published).length;

  return (
    <AppShell requireRole="Teacher">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Teacher Dashboard</h1>
          <p className="text-gray-500">Overview of your assignments.</p>
        </div>
        <Link href="/teacher/assignments">
          <Button>Manage Assignments</Button>
        </Link>
      </div>

      {isLoading ? (
        <Spinner />
      ) : error ? (
        <ErrorState message={error} onRetry={() => window.location.reload()} />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <Card className="p-6 flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Assignments</p>
              <p className="text-2xl font-semibold text-gray-900">{assignments.length}</p>
            </div>
          </Card>
          
          <Card className="p-6 flex items-center gap-4">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Drafts</p>
              <p className="text-2xl font-semibold text-gray-900">{draftCount}</p>
            </div>
          </Card>

          <Card className="p-6 flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Published</p>
              <p className="text-2xl font-semibold text-gray-900">{publishedCount}</p>
            </div>
          </Card>
        </div>
      )}
    </AppShell>
  );
}
