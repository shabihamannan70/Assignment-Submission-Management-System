import React from 'react';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';
  'aria-label': string;
  title: string;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, variant = 'ghost', className = '', title, 'aria-label': ariaLabel, disabled, ...props }, ref) => {
    const baseStyles = 'inline-flex justify-center items-center p-2 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
    
    const variants = {
      primary: 'text-blue-600 hover:bg-blue-50 focus:ring-blue-500',
      secondary: 'text-gray-600 hover:bg-gray-100 focus:ring-gray-500',
      danger: 'text-red-600 hover:bg-red-50 focus:ring-red-500',
      ghost: 'text-gray-500 hover:bg-gray-100 hover:text-gray-900 focus:ring-gray-500',
      success: 'text-green-600 hover:bg-green-50 focus:ring-green-500',
    };

    return (
      <button
        ref={ref}
        type="button"
        title={title}
        aria-label={ariaLabel}
        disabled={disabled}
        className={`${baseStyles} ${variants[variant]} ${className}`}
        {...props}
      >
        {icon}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';
