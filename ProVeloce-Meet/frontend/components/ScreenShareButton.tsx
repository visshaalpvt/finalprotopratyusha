'use client';

import { useState, useEffect } from 'react';
import { Monitor, MonitorOff, AlertCircle } from 'lucide-react';
import { useScreenShare } from '@/hooks/useScreenShare';
import { Button } from './ui/button';
import { useToast } from './ui/use-toast';
import { cn } from '@/lib/utils';

interface ScreenShareButtonProps {
  className?: string;
}

/**
 * Custom screen share button that properly implements screen sharing
 * using getDisplayMedia and Stream.io's publishVideoTrack
 */
export default function ScreenShareButton({ className }: ScreenShareButtonProps) {
  const { isSharing, isSharingSupported, startScreenShare, stopScreenShare, error } = useScreenShare();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Show error toast when error occurs
  useEffect(() => {
    if (error) {
      toast({
        title: 'Screen Sharing Error',
        description: error,
        variant: 'destructive',
      });
    }
  }, [error, toast]);

  const handleToggle = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      if (isSharing) {
        await stopScreenShare();
        toast({
          title: 'Screen Sharing Stopped',
          description: 'Your screen is no longer being shared.',
        });
      } else {
        await startScreenShare();
        toast({
          title: 'Screen Sharing Started',
          description: 'Your screen is now being shared with participants.',
        });
      }
    } catch (err: any) {
      console.error('Error toggling screen share:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to toggle screen sharing',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSharingSupported) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className={cn('cursor-not-allowed opacity-50', className)}
        disabled
        title="Screen sharing is not supported in this browser"
      >
        <MonitorOff className="h-5 w-5 text-gray-400" />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      disabled={isLoading}
      className={cn(
        'cursor-pointer rounded-2xl bg-[#19232d] px-4 py-2 hover:bg-[#4c535b] transition-colors',
        isSharing && 'bg-red-600 hover:bg-red-700',
        isLoading && 'opacity-50 cursor-wait',
        className
      )}
      title={isSharing ? 'Stop sharing screen' : 'Share screen'}
      aria-label={isSharing ? 'Stop sharing screen' : 'Share screen'}
      aria-pressed={isSharing}
    >
      {isLoading ? (
        <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
      ) : isSharing ? (
        <MonitorOff className="h-5 w-5 text-white" />
      ) : (
        <Monitor className="h-5 w-5 text-white" />
      )}
      {isSharing && (
        <span className="ml-2 text-sm text-white font-medium">Stop Sharing</span>
      )}
    </Button>
  );
}

