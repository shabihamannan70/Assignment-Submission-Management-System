'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { LogOut, BookOpen } from 'lucide-react';

export const Header = () => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="text-blue-600 h-6 w-6" />
          <Link href="/" className="font-bold text-xl text-gray-900">
            AMS
          </Link>
        </div>
        
        {user && (
          <div className="flex items-center gap-4">
            <div className="text-sm hidden sm:block">
              <span className="text-gray-700 font-medium">Hello, {user?.name || user?.email}</span>
              <span className="text-gray-500 ml-2 bg-gray-100 px-2 py-1 rounded-full text-xs">
                {user.role}
              </span>
            </div>
            <button
              onClick={logout}
              className="text-gray-500 hover:text-gray-700 flex items-center gap-1 text-sm font-medium"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
