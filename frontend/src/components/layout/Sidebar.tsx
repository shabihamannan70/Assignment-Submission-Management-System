'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  GraduationCap, 
  FileText,
  FilePlus,
  List,
  ClipboardList,
  Menu,
  X
} from 'lucide-react';

const ADMIN_ROUTES = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/classes', label: 'Classes', icon: BookOpen },
  { href: '/admin/subjects', label: 'Subjects', icon: BookOpen },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/teacher-assignments', label: 'Teacher Assignments', icon: GraduationCap },
  { href: '/admin/student-enrollments', label: 'Student Enrollments', icon: Users },
  { href: '/admin/assignments', label: 'Assignments', icon: FileText },
  { href: '/admin/submissions', label: 'Submissions', icon: FileText },
];

const TEACHER_ROUTES = [
  { href: '/teacher/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/teacher/assignments/create', label: 'My Assignments', icon: FilePlus },
  { href: '/teacher/assignments', label: 'Assignment List', icon: List },
  { href: '/teacher/submissions', label: 'View Submissions', icon: ClipboardList },
  { href: '/teacher/assigned-classes', label: 'Assigned Class & Subject', icon: BookOpen },
];

const STUDENT_ROUTES = [
  { href: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/student/assignments', label: 'Available Assignments', icon: FileText },
  { href: '/student/results', label: 'My Results', icon: FileText },
];

export const Sidebar = ({ isOpen, setIsOpen }: { isOpen: boolean, setIsOpen: (val: boolean) => void }) => {
  const { user } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  const role = user.role.toLowerCase();
  const routes = role === 'admin' ? ADMIN_ROUTES : role === 'teacher' ? TEACHER_ROUTES : STUDENT_ROUTES;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" 
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-16 left-0 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 w-64 z-40 transition-transform duration-200 ease-in-out lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <nav className="p-4 space-y-1">
          {routes.map((route) => {
            const checkIsActive = (currentPath: string, routeHref: string) => {
              if (routeHref === '/student/assignments') {
                return currentPath.startsWith('/student/assignments') && !currentPath.endsWith('/result');
              }
              if (routeHref === '/student/results') {
                return currentPath.startsWith('/student/results') || (currentPath.startsWith('/student/assignments') && currentPath.endsWith('/result'));
              }
              if (routeHref === '/teacher/assignments') {
                return currentPath === '/teacher/assignments';
              }
              if (routeHref === '/admin/assignments') {
                return currentPath === '/admin/assignments';
              }
              return currentPath === routeHref || currentPath.startsWith(routeHref + '/');
            };
            const isActive = checkIsActive(pathname, route.href);
            const Icon = route.icon;
            return (
              <Link
                key={route.href}
                href={route.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive 
                    ? 'bg-blue-50 text-blue-700' 
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-blue-700' : 'text-gray-400'}`} />
                {route.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
};
