'use client';

import { createContext, useContext, ReactNode, useState, useCallback, useEffect, useRef } from 'react';
import { useUser, useAuth } from '@clerk/nextjs';
import { meetingApi, Meeting } from '@/lib/meeting-api';

interface MeetingContextValue {
    meetings: Meeting[];
    isLoading: boolean;
    lastUpdated: Date | null;
    refresh: () => Promise<void>;
    endedCalls: Meeting[];
    upcomingCalls: Meeting[];
    callRecordings: Meeting[];
}

const MeetingContext = createContext<MeetingContextValue | null>(null);

// Cache TTL: 30 seconds
const CACHE_TTL = 30000;

export function MeetingProvider({ children }: { children: ReactNode }) {
    const { user } = useUser();
    const { getToken } = useAuth();
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const isMountedRef = useRef(true);
    const fetchingRef = useRef(false);

    const loadMeetings = useCallback(async (showLoading = true) => {
        if (!user?.id || fetchingRef.current) return;

        // Skip if cache is still valid
        if (lastUpdated && Date.now() - lastUpdated.getTime() < CACHE_TTL) {
            return;
        }

        fetchingRef.current = true;
        if (showLoading && meetings.length === 0) {
            setIsLoading(true);
        }

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
            fetchingRef.current = false;
            if (isMountedRef.current) {
                setIsLoading(false);
            }
        }
    }, [user?.id, getToken, lastUpdated, meetings.length]);

    const refresh = useCallback(async () => {
        // Force refresh by clearing last updated
        setLastUpdated(null);
        await loadMeetings(false);
    }, [loadMeetings]);

    // Initial load
    useEffect(() => {
        isMountedRef.current = true;
        loadMeetings();
        return () => {
            isMountedRef.current = false;
        };
    }, [loadMeetings]);

    // Background refresh every 30s
    useEffect(() => {
        const intervalId = setInterval(() => {
            loadMeetings(false);
        }, CACHE_TTL);
        return () => clearInterval(intervalId);
    }, [loadMeetings]);

    // Listen for refresh events
    useEffect(() => {
        const handleRefresh = () => refresh();
        window.addEventListener('meeting:updated', handleRefresh);
        window.addEventListener('meeting:created', handleRefresh);
        window.addEventListener('meeting:ended', handleRefresh);
        return () => {
            window.removeEventListener('meeting:updated', handleRefresh);
            window.removeEventListener('meeting:created', handleRefresh);
            window.removeEventListener('meeting:ended', handleRefresh);
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

    const callRecordings = meetings?.filter((meeting) => {
        return (meeting.status === 'ended' || meeting.endTime) && meeting.recordingUrl;
    }) || [];

    return (
        <MeetingContext.Provider
            value={{
                meetings,
                isLoading,
                lastUpdated,
                refresh,
                endedCalls,
                upcomingCalls,
                callRecordings,
            }}
        >
            {children}
        </MeetingContext.Provider>
    );
}

export function useMeetings() {
    const context = useContext(MeetingContext);
    if (!context) {
        throw new Error('useMeetings must be used within MeetingProvider');
    }
    return context;
}

// Backward compatible hook
export function useGetCallsFast() {
    return useMeetings();
}
