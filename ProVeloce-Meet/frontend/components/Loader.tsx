'use client';

import { memo } from 'react';
import { cn } from '@/lib/utils';

interface LoaderProps {
  fullScreen?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const Loader = memo(function Loader({
  fullScreen = true,
  size = 'md',
  className
}: LoaderProps) {
  const dotSizes = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3'
  };

  const dots = (
    <div className="loader-dots" role="status" aria-label="Loading">
      <span className={dotSizes[size]}></span>
      <span className={dotSizes[size]}></span>
      <span className={dotSizes[size]}></span>
      <span className="sr-only">Loading...</span>
    </div>
  );

  if (fullScreen) {
    return (
      <div className={cn(
        "flex h-screen h-[100dvh] w-full items-center justify-center bg-meeting",
        className
      )}>
        {dots}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center justify-center py-8", className)}>
      {dots}
    </div>
  );
});

// Skeleton components for loading states
export const Skeleton = memo(function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-bg-tertiary",
        className
      )}
      {...props}
    />
  );
});

export const CardSkeleton = memo(function CardSkeleton() {
  return (
    <div className="p-4 sm:p-5 rounded-xl bg-white border border-border-lighter">
      <div className="flex items-start gap-3 mb-4">
        <Skeleton className="w-10 h-10 sm:w-12 sm:h-12 rounded-full" />
        <div className="flex-1">
          <Skeleton className="h-5 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
      <div className="flex gap-2 pt-4 border-t border-border-lighter">
        <Skeleton className="h-11 flex-1 rounded-full" />
        <Skeleton className="h-11 w-28 rounded-full" />
      </div>
    </div>
  );
});

export const MeetingRoomSkeleton = memo(function MeetingRoomSkeleton() {
  return (
    <div className="h-screen h-[100dvh] w-full bg-meeting flex flex-col">
      {/* Top bar skeleton */}
      <div className="flex items-center justify-between px-4 py-3">
        <Skeleton className="h-6 w-32 bg-surface" />
        <Skeleton className="h-8 w-24 rounded-full bg-surface" />
      </div>

      {/* Video area skeleton */}
      <div className="flex-1 p-4">
        <Skeleton className="w-full h-full rounded-xl bg-surface" />
      </div>

      {/* Control bar skeleton */}
      <div className="flex justify-center py-4">
        <div className="flex gap-2 bg-surface/80 rounded-full p-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="w-12 h-12 rounded-full bg-control-hover" />
          ))}
        </div>
      </div>
    </div>
  );
});

export default Loader;
