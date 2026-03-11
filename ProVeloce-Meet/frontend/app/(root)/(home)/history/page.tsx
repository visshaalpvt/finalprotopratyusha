'use client';

import { useEffect, useState } from 'react';
import { useUser, useAuth } from '@clerk/nextjs';
import { Calendar, Clock, Users, MessageSquare, Video } from 'lucide-react';
import { meetingHistoryApi, MeetingHistory } from '@/lib/meeting-history-api';
import Loader from '@/components/Loader';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';
import SEOHead from '@/components/SEOHead';
import { generateBreadcrumbSchema } from '@/lib/seo-utils';
import { ScrollAnimation, StaggerContainer } from '@/lib/animations';
import MeetingDetailsModal from '@/components/MeetingDetailsModal';

const HistoryPage = () => {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [history, setHistory] = useState<MeetingHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);
  const [selectedMeetingData, setSelectedMeetingData] = useState<MeetingHistory | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!isLoaded || !user?.id) return;

      setIsLoading(true);
      try {
        const token = await getToken({ template: "meet" });
        if (!token) return;

        const userHistory = await meetingHistoryApi.getUserHistory(user.id, token);
        setHistory(userHistory);
      } catch (error: any) {
        console.error('Error fetching history:', error);
        toast({
          title: 'Error',
          description: 'Failed to load meeting history',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [user?.id, isLoaded, getToken, toast]);

  if (!isLoaded || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader />
      </div>
    );
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m ${secs}s`;
  };

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://meet.proveloce.com';
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: baseUrl },
    { name: 'Meeting History', url: `${baseUrl}/history` },
  ]);

  return (
    <>
      <SEOHead
        title="Meeting History - Your Meeting Activity"
        description="View your complete meeting history including attended meetings, recordings, chat messages, and participant analytics."
        keywords={['meeting history', 'meeting analytics', 'attendance tracking', 'meeting activity']}
        canonicalUrl={`${baseUrl}/history`}
        noindex={true} // Private user history should not be indexed
        structuredData={breadcrumbSchema}
      />
      <section className="flex size-full flex-col gap-6 sm:gap-8 md:gap-10 text-black p-4 sm:p-6" role="main" aria-label="Meeting history">
        <ScrollAnimation variant="fadeUp">
          <h1 className="text-2xl sm:text-3xl font-bold text-black">Meeting History</h1>
        </ScrollAnimation>

      {history.length === 0 ? (
        <ScrollAnimation variant="fadeUp" delay={0.1}>
          <div className="flex items-center justify-center h-full min-h-[400px]">
            <p className="text-text-secondary text-base sm:text-lg">No meeting history available</p>
          </div>
        </ScrollAnimation>
      ) : (
        <StaggerContainer>
          <div className="space-y-4 sm:space-y-6">
            {history.map((item, index) => (
              <ScrollAnimation key={item.meetingId} variant="fadeUp" delay={index * 0.05}>
                <div
                  className="bg-white rounded-lg p-4 sm:p-6 border border-light-4 hover:border-google-blue transition-all duration-300 shadow-sm hover:shadow-md"
                >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg sm:text-xl font-semibold mb-2 text-black">
                    {item.meeting?.title || 'Meeting'}
                  </h3>
                  <div className="flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm text-text-secondary">
                    {item.participation.joinedAt && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(item.participation.joinedAt).toLocaleString()}</span>
                      </div>
                    )}
                    {item.participation.duration && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{formatDuration(item.participation.duration)}</span>
                      </div>
                    )}
                    {item.chatMessages.length > 0 && (
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        <span>{item.chatMessages.length} messages</span>
                      </div>
                    )}
                    {item.meeting?.recordingUrl && (
                      <div className="flex items-center gap-2">
                        <Video className="h-4 w-4" />
                        <span>Recording available</span>
                      </div>
                    )}
                  </div>
                </div>
                {item.participation.isHost && (
                  <span className="px-2 py-1 bg-google-blue text-white text-xs rounded whitespace-nowrap">Host</span>
                )}
              </div>

              {item.chatMessages.length > 0 && (
                <div className="mt-4 pt-4 border-t border-light-4">
                  <h4 className="text-sm font-semibold mb-2 text-text-primary">Chat Messages</h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {item.chatMessages.slice(-5).map((msg) => (
                      <div key={msg.id} className="text-sm">
                        <span className="text-google-blue font-semibold">{msg.userName}:</span>
                        <span className="text-text-secondary ml-2">{msg.message}</span>
                      </div>
                    ))}
                    {item.chatMessages.length > 5 && (
                      <p className="text-xs text-text-tertiary">
                        +{item.chatMessages.length - 5} more messages
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-4 flex flex-col sm:flex-row gap-2">
                {item.meeting?.recordingUrl && item.participation.isHost && (
                  <Button
                    onClick={() => window.open(item.meeting!.recordingUrl, '_blank')}
                    variant="outline"
                    className="w-full sm:w-auto"
                  >
                    <Video className="h-4 w-4 mr-2" />
                    View Recording
                  </Button>
                )}
                <Button
                  onClick={() => {
                    setSelectedMeetingId(item.meetingId);
                    setSelectedMeetingData(item);
                  }}
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  View Details
                </Button>
              </div>
                </div>
              </ScrollAnimation>
            ))}
          </div>
        </StaggerContainer>
      )}

      {/* Meeting Details Modal */}
      {selectedMeetingId && selectedMeetingData && (
        <MeetingDetailsModal
          isOpen={!!selectedMeetingId}
          onClose={() => {
            setSelectedMeetingId(null);
            setSelectedMeetingData(null);
          }}
          meetingId={selectedMeetingId}
          initialData={selectedMeetingData.meeting ? {
            title: selectedMeetingData.meeting.title,
            type: selectedMeetingData.meeting.type,
            hostName: selectedMeetingData.meeting.hostName,
            startTime: selectedMeetingData.meeting.startTime,
            endTime: selectedMeetingData.meeting.endTime,
            scheduledTime: selectedMeetingData.meeting.scheduledTime,
            status: selectedMeetingData.meeting.status,
            recordingUrl: selectedMeetingData.meeting.recordingUrl,
            chatMessages: selectedMeetingData.chatMessages,
            participation: selectedMeetingData.participation,
          } : undefined}
        />
      )}
      </section>
    </>
  );
};

export default HistoryPage;

