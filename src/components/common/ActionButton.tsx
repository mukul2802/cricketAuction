import React from 'react';
import { Button } from '@/components/ui/button';
import { LucideIcon, Plus, Edit, Trash2, Eye } from 'lucide-react';
import { LoadingSpinner } from '@/components/common/LoadingState';
import { cn } from '@/components/ui/utils';

interface ActionButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  icon?: LucideIcon;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export function ActionButton({
  children,
  onClick,
  variant = 'default',
  size = 'default',
  icon: Icon,
  loading = false,
  disabled = false,
  className,
  type = 'button'
}: ActionButtonProps) {
  return (
    <Button
      type={type}
      variant={variant}
      size={size}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn('flex items-center gap-2', className)}
    >
      {loading ? (
        <LoadingSpinner size="sm" />
      ) : (
        Icon && <Icon className="h-4 w-4" />
      )}
      {children}
    </Button>
  );
}

// Specialized action buttons for common use cases
export function AddButton(props: Omit<ActionButtonProps, 'variant' | 'icon'>) {
  return (
    <ActionButton 
      {...props} 
      variant="default"
      icon={Plus}
    />
  );
}

export function EditButton(props: Omit<ActionButtonProps, 'variant' | 'icon'>) {
  return (
    <ActionButton 
      {...props} 
      variant="outline"
      icon={Edit}
    />
  );
}

export function DeleteButton(props: Omit<ActionButtonProps, 'variant' | 'icon'>) {
  return (
    <ActionButton 
      {...props} 
      variant="destructive"
      icon={Trash2}
    />
  );
}

export function ViewButton(props: Omit<ActionButtonProps, 'variant' | 'icon'>) {
  return (
    <ActionButton 
      {...props} 
      variant="ghost"
      icon={Eye}
    />
  );
}