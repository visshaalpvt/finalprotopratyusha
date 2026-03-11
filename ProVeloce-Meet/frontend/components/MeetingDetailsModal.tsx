"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Calendar, Clock, Users, MessageSquare, Video, User, X } from 'lucide-react';
import { meetingHistoryApi, DetailedMeetingHistory } from '@/lib/meeting-history-api';
import { useToast } from './ui/use-toast';
import Loader from './Loader';

interface MeetingDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  meetingId: string;
  initialData?: {
    title: string;
    type: string;
    hostName: string;
    startTime?: string;
    endTime?: string;
    scheduledTime?: string;
    status: string;
    recordingUrl?: string;
    chatMessages: Array<{
      id: string;
      userId: string;
      userName: string;
      userImageUrl?: string;
      message: string;
      timestamp: string;
    }>;
    participation: {
      joinedAt: string;
      leftAt?: string;
      duration?: number;
      isHost: boolean;
    };
  };
}

const MeetingDetailsModal = ({
  isOpen,
  onClose,
  meetingId,
  initialData,
}: MeetingDetailsModalProps) => {
  const { getToken } = useAuth();
  const { toast } = useToast();
  const [detailedData, setDetailedData] = useState<DetailedMeetingHistory | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!isOpen || !meetingId) return;

      setIsLoading(true);
      try {
        const token = await getToken({ template: "meet" });
        if (!token) {
          toast({
            title: 'Authentication required',
            variant: 'destructive',
          });
          setIsLoading(false);
          return;
        }

        const details = await meetingHistoryApi.getMeetingHistory(meetingId, token);
        setDetailedData(details);
      } catch (error: any) {
        console.error('Error fetching meeting details:', error);
        toast({
          title: 'Error',
          description: 'Failed to load meeting details',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetails();
  }, [isOpen, meetingId, getToken, toast]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const meeting = detailedData?.meeting || (initialData ? {
    title: initialData.title,
    type: initialData.type,
    hostName: initialData.hostName,
    startTime: initialData.startTime,
    endTime: initialData.endTime,
    scheduledTime: initialData.scheduledTime,
    status: initialData.status,
    recordingUrl: initialData.recordingUrl,
  } : null);

  const chatMessages = detailedData?.chatMessages || initialData?.chatMessages || [];
  const participants = detailedData?.participants || [];
  const historyEntries = detailedData?.historyEntries || [];

  if (!meeting) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex w-full max-w-3xl max-h-[90vh] flex-col gap-6 border border-light-4 bg-white px-6 py-8 text-text-primary shadow-xl overflow-y-auto">
        <DialogTitle asChild>
          <h2 className="text-2xl sm:text-3xl font-bold leading-tight text-text-primary">
            Meeting Details
          </h2>
        </DialogTitle>
        <DialogDescription className="sr-only">
          Detailed information about the meeting
        </DialogDescription>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader />
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {/* Meeting Basic Info */}
            <div className="bg-light-2 rounded-lg p-4 sm:p-6 border border-light-4">
              <h3 className="text-xl font-semibold mb-4 text-black">{meeting.title}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-google-blue mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-text-secondary font-medium">Host</p>
                    <p className="text-black">{meeting.hostName}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-google-blue mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-text-secondary font-medium">Type</p>
                    <p className="text-black capitalize">{meeting.type}</p>
                  </div>
                </div>
                {meeting.scheduledTime && (
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-google-blue mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-text-secondary font-medium">Scheduled</p>
                      <p className="text-black">{formatDate(meeting.scheduledTime)}</p>
                    </div>
                  </div>
                )}
                {meeting.startTime && (
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-google-blue mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-text-secondary font-medium">Started</p>
                      <p className="text-black">{formatDate(meeting.startTime)}</p>
                    </div>
                  </div>
                )}
                {meeting.endTime && (
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-google-blue mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-text-secondary font-medium">Ended</p>
                      <p className="text-black">{formatDate(meeting.endTime)}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-google-blue mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-text-secondary font-medium">Status</p>
                    <p className="text-black capitalize">
                      {meeting.status === 'ended' ? 'Ended' : meeting.status === 'ongoing' ? 'Ongoing' : meeting.status === 'cancelled' ? 'Cancelled' : 'Scheduled'}
                    </p>
                  </div>
                </div>
                {meeting.status === 'ended' && meeting.endTime && (
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-google-blue mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-text-secondary font-medium">Ended At</p>
                      <p className="text-black">{formatDate(meeting.endTime)}</p>
                      {detailedData?.meeting?.duration && (
                        <p className="text-text-secondary text-xs mt-1">
                          Duration: {formatDuration(detailedData.meeting.duration)}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Participants */}
            {participants.length > 0 && (
              <div className="border-t border-light-4 pt-6">
                <h4 className="text-lg font-semibold mb-4 text-black flex items-center gap-2">
                  <Users className="h-5 w-5 text-google-blue" />
                  Participants ({participants.length})
                </h4>
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {participants.map((participant) => (
                    <div
                      key={participant.userId}
                      className="flex items-center gap-3 p-3 bg-light-2 rounded-lg border border-light-4"
                    >
                      {participant.userImageUrl ? (
                        <img
                          src={participant.userImageUrl}
                          alt={participant.userName}
                          className="h-10 w-10 rounded-full"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-google-blue flex items-center justify-center text-white font-semibold">
                          {participant.userName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-black font-medium truncate">
                          {participant.userName}
                          {participant.isHost && (
                            <span className="ml-2 px-2 py-0.5 bg-google-blue text-white text-xs rounded">
                              Host
                            </span>
                          )}
                        </p>
                        <div className="flex flex-wrap gap-2 text-xs text-text-secondary mt-1">
                          <span>Joined: {formatDate(participant.joinedAt)}</span>
                          {participant.leftAt && (
                            <span>Left: {formatDate(participant.leftAt)}</span>
                          )}
                          {participant.duration && (
                            <span>Duration: {formatDuration(participant.duration)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Chat Messages */}
            {chatMessages.length > 0 && (
              <div className="border-t border-light-4 pt-6">
                <h4 className="text-lg font-semibold mb-4 text-black flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-google-blue" />
                  Chat Messages ({chatMessages.length})
                </h4>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className="flex items-start gap-3 p-3 bg-light-2 rounded-lg border border-light-4"
                    >
                      {msg.userImageUrl ? (
                        <img
                          src={msg.userImageUrl}
                          alt={msg.userName}
                          className="h-8 w-8 rounded-full flex-shrink-0"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-google-blue flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                          {msg.userName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-google-blue font-semibold text-sm">{msg.userName}</p>
                          <p className="text-text-tertiary text-xs">
                            {formatDate(msg.timestamp)}
                          </p>
                        </div>
                        <p className="text-black text-sm">{msg.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* History Entries */}
            {historyEntries.length > 0 && (
              <div className="border-t border-light-4 pt-6">
                <h4 className="text-lg font-semibold mb-4 text-black">Activity Timeline</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {historyEntries
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                    .map((entry, index) => {
                      // Format the activity message
                      const getUserName = () => {
                        if (entry.metadata?.userName) {
                          return entry.metadata.userName;
                        }
                        // Try to find user name from participants if available
                        const participant = participants.find(p => p.userId === entry.userId);
                        return participant?.userName || 'User';
                      };

                      const userName = getUserName();
                      const actionText = entry.action.charAt(0).toUpperCase() + entry.action.slice(1).replace('_', ' ');
                      const displayText = `${userName} ${entry.action === 'joined' ? 'joined' : entry.action === 'left' ? 'left' : actionText.toLowerCase()}`;

                      return (
                        <div
                          key={index}
                          className="flex items-start gap-3 p-2 text-sm bg-light-2 rounded border border-light-4"
                        >
                          <div className="h-2 w-2 rounded-full bg-google-blue flex-shrink-0 mt-1.5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-black font-medium">
                              {displayText}
                            </p>
                            <p className="text-text-tertiary text-xs mt-0.5">
                              {formatDate(entry.timestamp)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Recording */}
            {meeting.recordingUrl && (
              <div className="border-t border-light-4 pt-6">
                <Button
                  onClick={() => window.open(meeting.recordingUrl, '_blank')}
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  <Video className="h-4 w-4 mr-2" />
                  View Recording
                </Button>
              </div>
            )}

            {/* Close Button */}
            <div className="flex justify-end pt-4 border-t border-light-4">
              <Button onClick={onClose} variant="outline">
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default MeetingDetailsModal;

