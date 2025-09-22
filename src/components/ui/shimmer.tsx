import React from 'react';
import { cn } from './utils';

interface ShimmerProps {
  width?: string;
  height?: string;
  rounded?: string;
  className?: string;
}

const Shimmer: React.FC<ShimmerProps> = ({ 
  width = 'w-full', 
  height = 'h-4', 
  rounded = 'rounded', 
  className 
}) => {
  return (
    <div
      className={cn(
        'animate-pulse bg-gradient-to-r from-gray-300/30 via-gray-200/30 to-gray-300/30 bg-[length:200%_100%]',
        'shimmer-animation',
        width,
        height,
        rounded,
        className
      )}
      style={{
        animation: 'shimmer 1.5s ease-in-out infinite'
      }}
    />
  );
};

interface ShimmerTextProps {
  lines?: number;
  className?: string;
}

export const ShimmerText: React.FC<ShimmerTextProps> = ({ lines = 1, className }) => {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <Shimmer
          key={index}
          height="h-4"
          width={index === lines - 1 ? 'w-3/4' : 'w-full'}
          className="rounded"
        />
      ))}
    </div>
  );
};

interface ShimmerAvatarProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ShimmerAvatar: React.FC<ShimmerAvatarProps> = ({ size = 'md', className }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  return (
    <Shimmer
      width={sizeClasses[size].split(' ')[0]}
      height={sizeClasses[size].split(' ')[1]}
      rounded="rounded-full"
      className={className}
    />
  );
};

interface ShimmerButtonProps {
  className?: string;
}

export const ShimmerButton: React.FC<ShimmerButtonProps> = ({ className }) => {
  return (
    <Shimmer
      height="h-10"
      width="w-24"
      rounded="rounded-md"
      className={className}
    />
  );
};

export default Shimmer;