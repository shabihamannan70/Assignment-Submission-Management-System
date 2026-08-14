'use client';

import React, { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { adminService } from '@/services/adminService';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorState } from '@/components/ui/Feedback';
import { BookOpen, Users, GraduationCap, FileText, UploadCloud, Link } from 'lucide-react';
import { AdminDashboardSummaryDto } from '@/types/admin';

export default function AdminDashboard() {
  const [data, setData] = useState<AdminDashboardSummaryDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const summary = await adminService.getDashboardSummary();
        setData(summary);
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <AppShell requireRole="Admin">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500">Overview of the assignment management system.</p>
      </div>

      {isLoading ? (
        <Spinner />
      ) : error ? (
        <ErrorState message={error} onRetry={() => window.location.reload()} />
      ) : data ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="p-6 flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Users</p>
              <p className="text-2xl font-semibold text-gray-900">{data.totalUsers}</p>
            </div>
          </Card>
          
          <Card className="p-6 flex items-center gap-4">
            <div className="p-3 bg-indigo-100 rounded-lg">
              <Users className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Teachers</p>
              <p className="text-2xl font-semibold text-gray-900">{data.totalTeachers}</p>
            </div>
          </Card>

          <Card className="p-6 flex items-center gap-4">
            <div className="p-3 bg-teal-100 rounded-lg">
              <Users className="h-6 w-6 text-teal-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Students</p>
              <p className="text-2xl font-semibold text-gray-900">{data.totalStudents}</p>
            </div>
          </Card>

          <Card className="p-6 flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <BookOpen className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Classes</p>
              <p className="text-2xl font-semibold text-gray-900">{data.totalClasses}</p>
            </div>
          </Card>

          <Card className="p-6 flex items-center gap-4">
            <div className="p-3 bg-emerald-100 rounded-lg">
              <BookOpen className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Subjects</p>
              <p className="text-2xl font-semibold text-gray-900">{data.totalSubjects}</p>
            </div>
          </Card>

          <Card className="p-6 flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <GraduationCap className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Teacher Assignments</p>
              <p className="text-2xl font-semibold text-gray-900">{data.totalTeacherAssignments}</p>
            </div>
          </Card>

          <Card className="p-6 flex items-center gap-4">
            <div className="p-3 bg-fuchsia-100 rounded-lg">
              <Link className="h-6 w-6 text-fuchsia-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Student Enrollments</p>
              <p className="text-2xl font-semibold text-gray-900">{data.totalStudentEnrollments}</p>
            </div>
          </Card>

          <Card className="p-6 flex items-center gap-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <FileText className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Assignments</p>
              <p className="text-2xl font-semibold text-gray-900">{data.totalAssignments}</p>
            </div>
          </Card>

          <Card className="p-6 flex items-center gap-4">
            <div className="p-3 bg-sky-100 rounded-lg">
              <UploadCloud className="h-6 w-6 text-sky-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Submissions</p>
              <p className="text-2xl font-semibold text-gray-900">{data.totalSubmissions}</p>
            </div>
          </Card>
        </div>
      ) : null}
    </AppShell>
  );
}
