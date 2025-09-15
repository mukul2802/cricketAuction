import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/components/ui/utils';

interface LoadingStateProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  fullScreen?: boolean;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-8 h-8',
  lg: 'w-12 h-12'
};

export function LoadingState({ 
  message = 'Loading...', 
  size = 'md', 
  className,
  fullScreen = false 
}: LoadingStateProps) {
  const content = (
    <div className={cn('text-center space-y-4', className)}>
      <Loader2 className={cn(
        'animate-spin mx-auto text-primary',
        sizeClasses[size]
      )} />
      <p className="text-muted-foreground">{message}</p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        {content}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-8">
      {content}
    </div>
  );
}

// Inline loading spinner for buttons and small spaces
export function LoadingSpinner({ 
  size = 'sm', 
  className 
}: { 
  size?: 'sm' | 'md' | 'lg'; 
  className?: string; 
}) {
  return (
    <Loader2 className={cn(
      'animate-spin',
      sizeClasses[size],
      className
    )} />
  );
}