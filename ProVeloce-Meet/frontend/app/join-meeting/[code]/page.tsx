'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { Loader } from 'lucide-react';
import { meetingApi } from '@/lib/meeting-api';
import { useToast } from '@/components/ui/use-toast';
import SEOHead from '@/components/SEOHead';
import Alert from '@/components/Alert';

/**
 * Semantic URL route for joining meetings by room code
 * /join-meeting/XXX-XXXX-XXX
 */
export default function JoinMeetingPage() {
  const params = useParams();
  const router = useRouter();
  const { getToken } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const roomCode = Array.isArray(params.code) ? params.code[0] : params.code;

  useEffect(() => {
    const joinMeeting = async () => {
      if (!roomCode) {
        setError('Room code is required');
        setIsLoading(false);
        return;
      }

      try {
        const token = await getToken({ template: "meet" });
        if (!token) {
          setError('Authentication required');
          setIsLoading(false);
          return;
        }

        // Fetch meeting by room code
        const meeting = await meetingApi.getMeetingById(roomCode.toUpperCase(), token);

        // Check if meeting is still active
        if (meeting.status === 'ended' || meeting.status === 'cancelled') {
          setError('This meeting has ended or been cancelled');
          setIsLoading(false);
          return;
        }

        // Redirect to meeting page
        router.push(`/meeting/${meeting.streamCallId}`);
      } catch (error: any) {
        console.error('Error joining meeting:', error);
        if (error.message?.includes('404') || error.message?.includes('not found')) {
          setError('Meeting not found. Please check the room code and try again.');
        } else {
          setError('Failed to join meeting. Please try again.');
        }
        setIsLoading(false);
      }
    };

    joinMeeting();
  }, [roomCode, getToken, router]);

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://meet.proveloce.com';

  return (
    <>
      <SEOHead
        title="Join Meeting"
        description="Join a secure video meeting on ProVeloce Meet using your room code."
        canonicalUrl={`${baseUrl}/join-meeting/${roomCode}`}
        noindex={true} // Private join links should not be indexed
      />
      <div className="flex items-center justify-center h-screen bg-light-2" role="main" aria-label="Joining meeting">
        {isLoading ? (
          <div className="flex flex-col items-center gap-4">
            <Loader className="animate-spin h-8 w-8 text-google-blue" aria-label="Loading" />
            <p className="text-black">Joining meeting...</p>
          </div>
        ) : error ? (
          <Alert title={error} />
        ) : null}
      </div>
    </>
  );
}

