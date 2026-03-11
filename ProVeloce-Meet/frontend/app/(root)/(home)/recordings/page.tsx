'use client';

import { useEffect, useState } from 'react';
import { useUser, useAuth } from '@clerk/nextjs';
import { Play, Calendar, Clock } from 'lucide-react';
import { recordingApi, Recording } from '@/lib/recording-api';
import Loader from '@/components/Loader';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import SEOHead from '@/components/SEOHead';
import { generateBreadcrumbSchema, generateVideoObjectSchema } from '@/lib/seo-utils';
import { ScrollAnimation, StaggerContainer } from '@/lib/animations';

const RecordingsPage = () => {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const { toast } = useToast();
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRecordings = async () => {
      if (!isLoaded || !user?.id) return;

      setIsLoading(true);
      try {
        const token = await getToken({ template: "meet" });
        if (!token) return;

        const hostRecordings = await recordingApi.getHostRecordings(user.id, token);
        setRecordings(hostRecordings);
      } catch (error: any) {
        console.error('Error fetching recordings:', error);
        toast({
          title: 'Error',
          description: 'Failed to load recordings',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecordings();
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
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://meet.proveloce.com';
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: baseUrl },
    { name: 'Recordings', url: `${baseUrl}/recordings` },
  ]);

  return (
    <>
      <SEOHead
        title="Meeting Recordings - Host Dashboard"
        description="View and manage your meeting recordings. Access secure video recordings of your hosted meetings with detailed analytics and playback controls."
        keywords={['meeting recordings', 'video recordings', 'host dashboard', 'meeting playback']}
        canonicalUrl={`${baseUrl}/recordings`}
        noindex={true} // Private recordings should not be indexed
        structuredData={breadcrumbSchema}
      />
      <section className="flex size-full flex-col gap-6 sm:gap-8 md:gap-10 text-black p-4 sm:p-6" role="main" aria-label="Meeting recordings">
        <ScrollAnimation variant="fadeUp">
          <h1 className="text-2xl sm:text-3xl font-bold text-black">Recordings</h1>
        </ScrollAnimation>

      {recordings.length === 0 ? (
        <ScrollAnimation variant="fadeUp" delay={0.1}>
          <div className="flex items-center justify-center h-full min-h-[400px]">
            <p className="text-text-secondary text-base sm:text-lg">No recordings available</p>
        </div>
        </ScrollAnimation>
      ) : (
        <StaggerContainer>
          <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
            {recordings.map((recording, index) => (
              <ScrollAnimation key={recording.meetingId} variant="zoomIn" delay={index * 0.1}>
                <div
                  className="bg-white rounded-lg p-4 sm:p-6 border border-light-4 hover:border-google-blue transition-all duration-300 shadow-sm hover:shadow-md"
            >
              <h3 className="text-lg sm:text-xl font-semibold mb-2 truncate text-black">{recording.title}</h3>
              
              <div className="flex flex-col gap-2 mb-4 text-xs sm:text-sm text-text-secondary">
                {recording.startTime && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(recording.startTime).toLocaleDateString()}</span>
                  </div>
                )}
                {recording.duration && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{formatDuration(recording.duration)}</span>
                  </div>
                )}
              </div>

              <Button
                onClick={() => {
                  if (recording.recordingUrl) {
                    window.open(recording.recordingUrl, '_blank');
                  } else {
                    toast({
                      title: 'Error',
                      description: 'Recording URL not available',
                      variant: 'destructive',
                    });
                  }
                }}
                className="w-full"
                disabled={!recording.recordingUrl}
              >
                <Play className="h-4 w-4 mr-2" />
                View Recording
              </Button>
            </div>
              </ScrollAnimation>
          ))}
        </div>
        </StaggerContainer>
      )}
      </section>
    </>
  );
};

export default RecordingsPage;
