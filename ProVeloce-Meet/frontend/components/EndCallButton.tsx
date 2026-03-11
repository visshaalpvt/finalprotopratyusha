'use client';

import { useState } from 'react';
import { useCall, useCallStateHooks } from '@stream-io/video-react-sdk';
import { useAuth } from '@clerk/nextjs';
import { useParams, useRouter } from 'next/navigation';
import { PhoneOff } from 'lucide-react';

import { meetingApi } from '@/lib/meeting-api';
import { participantApi } from '@/lib/participant-api';

const EndCallButton = () => {
  const call = useCall();
  const router = useRouter();
  const params = useParams();
  const { getToken } = useAuth();
  const [isEnding, setIsEnding] = useState(false);

  if (!call) {
    throw new Error('useStreamCall must be used within a StreamCall component.');
  }

  const { useLocalParticipant } = useCallStateHooks();
  const localParticipant = useLocalParticipant();

  const isMeetingOwner =
    localParticipant &&
    call.state.createdBy &&
    localParticipant.userId === call.state.createdBy.id;

  if (!isMeetingOwner) return null;

  const endCall = async () => {
    if (isEnding) return;

    setIsEnding(true);
    try {
      const token = await getToken({ template: "meet" });
      const meetingId = Array.isArray(params.id) ? params.id[0] : params.id;

      await call.endCall();

      if (token && meetingId) {
        try {
          await participantApi.leaveMeeting(meetingId, token);
        } catch (error) {
          console.error('Error tracking leave:', error);
        }

        try {
          await meetingApi.updateMeetingStatus(meetingId, 'ended', token);
        } catch (error) {
          console.error('Error updating meeting status:', error);
        }
      }

      router.push('/home');
    } catch (error) {
      console.error('Error ending call:', error);
      setIsEnding(false);
    }
  };

  return (
    <button
      onClick={endCall}
      className="control-btn control-btn-danger"
      disabled={isEnding}
      title="End call for everyone"
    >
      <PhoneOff className="w-5 h-5 text-white" />
    </button>
  );
};

export default EndCallButton;
