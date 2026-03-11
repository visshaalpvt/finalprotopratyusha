import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { meetingApi, Meeting } from '@/lib/meeting-api';

export const useGetCallById = (id: string | string[]) => {
  const [meeting, setMeeting] = useState<Meeting>();
  const [isCallLoading, setIsCallLoading] = useState(true);
  const { getToken } = useAuth();

  useEffect(() => {
    if (!id) {
      setIsCallLoading(false);
      return;
    }
    
    const loadMeeting = async () => {
      try {
        const token = await getToken({ template: "meet" });
        if (!token) {
          setIsCallLoading(false);
          return;
        }

        const meetingId = Array.isArray(id) ? id[0] : id;
        const fetchedMeeting = await meetingApi.getMeetingById(meetingId, token);
        setMeeting(fetchedMeeting);
      } catch (error) {
        console.error('Error fetching meeting:', error);
      } finally {
        setIsCallLoading(false);
      }
    };

    loadMeeting();
  }, [id, getToken]);

  return { call: meeting, isCallLoading };
};
