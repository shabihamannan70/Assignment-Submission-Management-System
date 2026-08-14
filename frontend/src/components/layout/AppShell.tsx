'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Spinner } from '../ui/Spinner';
import { Menu } from 'lucide-react';

export const AppShell = ({ children, requireRole }: { children: React.ReactNode, requireRole?: string }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/login');
      } else if (requireRole && user?.role.toLowerCase() !== requireRole.toLowerCase()) {
        // Redirect to their respective dashboard if wrong role
        const role = user?.role.toLowerCase();
        if (role === 'admin') router.push('/admin/dashboard');
        else if (role === 'teacher') router.push('/teacher/dashboard');
        else if (role === 'student') router.push('/student/dashboard');
        else router.push('/login');
      }
    }
  }, [isAuthenticated, isLoading, user, requireRole, router]);

  if (isLoading || !isAuthenticated) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><Spinner /></div>;
  }

  if (requireRole && user?.role.toLowerCase() !== requireRole.toLowerCase()) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><Spinner /></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <div className="flex flex-1 relative">
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
        
        <main className="flex-1 lg:ml-64 w-full">
          <div className="p-4 lg:hidden">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="p-2 -ml-2 text-gray-500 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
