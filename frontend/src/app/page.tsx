'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Spinner } from '@/components/ui/Spinner';

export default function Home() {
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated || !user) {
        router.push('/login');
      } else {
        const role = user.role ? user.role.toLowerCase() : '';
        if (role === 'admin') router.push('/admin/dashboard');
        else if (role === 'teacher') router.push('/teacher/dashboard');
        else if (role === 'student') router.push('/student/dashboard');
        else {
          logout();
        }
      }
    }
  }, [isAuthenticated, isLoading, user, router, logout]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Spinner className="h-12 w-12 text-blue-600" />
    </div>
  );
}
