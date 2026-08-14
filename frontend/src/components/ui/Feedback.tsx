import React from 'react';
import { AlertCircle } from 'lucide-react';

export const ErrorState = ({ message, onRetry }: { message: string, onRetry?: () => void }) => (
  <div className="flex flex-col items-center justify-center p-8 text-center">
    <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
    <h3 className="text-lg font-medium text-gray-900 mb-2">Error</h3>
    <p className="text-gray-500 mb-4 max-w-md">{message}</p>
    {onRetry && (
      <button 
        onClick={onRetry}
        className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        Try Again
      </button>
    )}
  </div>
);

export const EmptyState = ({ title, message, icon: Icon, action }: { title: string, message: string, icon?: any, action?: React.ReactNode }) => (
  <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-lg border border-gray-200 border-dashed">
    {Icon && <Icon className="h-12 w-12 text-gray-400 mb-4" />}
    <h3 className="text-lg font-medium text-gray-900 mb-1">{title}</h3>
    <p className="text-gray-500 mb-4">{message}</p>
    {action}
  </div>
);
