'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useUser, useAuth } from '@clerk/nextjs';
import { meetingApi, Meeting } from '@/lib/meeting-api';

const UpcomingMeeting = () => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [upcomingMeeting, setUpcomingMeeting] = useState<Meeting | null>(null);
  const [formattedTime, setFormattedTime] = useState<string>('');
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchUpcomingMeeting = useCallback(async () => {
    if (!user?.id) {
      setUpcomingMeeting(null);
      return;
    }

    try {
      const token = await getToken({ template: "meet" });
      if (!token) return;

      const meetings = await meetingApi.getMeetings(token, 'scheduled');
      const now = new Date();

      // Find the next upcoming meeting
      const upcoming = meetings
        .filter((meeting) => {
          if (meeting.status === 'scheduled' && meeting.scheduledTime) {
            const scheduledDate = new Date(meeting.scheduledTime);
            return scheduledDate > now;
          }
          return false;
        })
        .sort((a, b) => {
          const timeA = a.scheduledTime ? new Date(a.scheduledTime).getTime() : Infinity;
          const timeB = b.scheduledTime ? new Date(b.scheduledTime).getTime() : Infinity;
          return timeA - timeB;
        })[0] || null;

      setUpcomingMeeting(upcoming);

      // Format the meeting time
      if (upcoming?.scheduledTime) {
        const meetingDate = new Date(upcoming.scheduledTime);
        const hours = meetingDate.getHours();
        const minutes = meetingDate.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        setFormattedTime(`${displayHours}:${minutes} ${ampm}`);
      } else {
        setFormattedTime('');
      }
    } catch (error) {
      console.error('Error fetching upcoming meeting:', error);
      setUpcomingMeeting(null);
      setFormattedTime('');
    }
  }, [user?.id, getToken]);

  useEffect(() => {
    fetchUpcomingMeeting();

    // Set up periodic check for new meetings or expired meetings
    checkIntervalRef.current = setInterval(() => {
      fetchUpcomingMeeting();
    }, 60000); // Check every minute

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
    };
  }, [fetchUpcomingMeeting]);

  // Don't render if no upcoming meeting
  if (!upcomingMeeting || !formattedTime) {
    return null;
  }

  return (
    <h2 className="text-base sm:text-lg font-medium text-white/95 mt-2">
      Upcoming Meeting at: {formattedTime}
    </h2>
  );
};

export default UpcomingMeeting;

