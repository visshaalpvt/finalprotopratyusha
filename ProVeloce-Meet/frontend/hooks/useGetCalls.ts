import { useEffect, useState, useCallback, useRef } from 'react';
import { useUser, useAuth } from '@clerk/nextjs';
import { meetingApi, Meeting } from '@/lib/meeting-api';

interface UseGetCallsOptions {
  /** Auto refresh interval in milliseconds. Set to 0 to disable */
  refreshInterval?: number;
}

export const useGetCalls = (options: UseGetCallsOptions = {}) => {
  const { refreshInterval = 30000 } = options; // Default 30s refresh
  const { user } = useUser();
  const { getToken } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const isMountedRef = useRef(true);

  const loadMeetings = useCallback(async (showLoading = true) => {
    if (!user?.id) return;

    if (showLoading) setIsLoading(true);

    try {
      const token = await getToken({ template: "meet" });
      if (!token || !isMountedRef.current) return;

      const allMeetings = await meetingApi.getMeetings(token);
      if (isMountedRef.current) {
        setMeetings(allMeetings);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Error fetching meetings:', error);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [user?.id, getToken]);

  // Manual refresh function
  const refresh = useCallback(() => {
    return loadMeetings(false);
  }, [loadMeetings]);

  // Initial load
  useEffect(() => {
    isMountedRef.current = true;
    loadMeetings();
    return () => {
      isMountedRef.current = false;
    };
  }, [loadMeetings]);

  // Auto refresh
  useEffect(() => {
    if (refreshInterval <= 0) return;

    const intervalId = setInterval(() => {
      refresh();
    }, refreshInterval);

    return () => clearInterval(intervalId);
  }, [refreshInterval, refresh]);

  // Listen for custom events to trigger refresh (for instant sync)
  useEffect(() => {
    const handleMeetingUpdate = () => {
      refresh();
    };

    window.addEventListener('meeting:updated', handleMeetingUpdate);
    window.addEventListener('meeting:created', handleMeetingUpdate);
    window.addEventListener('meeting:ended', handleMeetingUpdate);

    return () => {
      window.removeEventListener('meeting:updated', handleMeetingUpdate);
      window.removeEventListener('meeting:created', handleMeetingUpdate);
      window.removeEventListener('meeting:ended', handleMeetingUpdate);
    };
  }, [refresh]);

  const now = new Date();

  const endedCalls = meetings?.filter((meeting) => {
    if (meeting.status === 'ended' || meeting.status === 'cancelled') return true;
    if (meeting.endTime) return new Date(meeting.endTime) < now;
    if (meeting.scheduledTime && meeting.status === 'scheduled') {
      return new Date(meeting.scheduledTime) < now;
    }
    return false;
  }) || [];

  const upcomingCalls = meetings?.filter((meeting) => {
    if (meeting.status === 'scheduled' && meeting.scheduledTime) {
      return new Date(meeting.scheduledTime) > now;
    }
    return false;
  }) || [];

  // For recordings, filter ended meetings that have recording URLs
  const callRecordings = meetings?.filter((meeting) => {
    return (meeting.status === 'ended' || meeting.endTime) && meeting.recordingUrl;
  }) || [];

  return {
    endedCalls,
    upcomingCalls,
    callRecordings,
    isLoading,
    refresh,
    lastUpdated,
  };
};

// Helper to trigger meeting updates globally
export const triggerMeetingRefresh = (eventType: 'updated' | 'created' | 'ended' = 'updated') => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(`meeting:${eventType}`));
  }
};
