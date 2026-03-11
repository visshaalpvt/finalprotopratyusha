'use client';
import { useState, useEffect, useMemo, useCallback, memo, useRef } from 'react';
import {
  CallControls,
  CallParticipantsList,
  CallingState,
  PaginatedGridLayout,
  SpeakerLayout,
  useCallStateHooks,
  useCall,
} from '@stream-io/video-react-sdk';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { Users, LayoutGrid, Copy, Link2, MessageSquare, MoreVertical, X, ChevronUp } from 'lucide-react';
import { useUser, useAuth } from '@clerk/nextjs';
import { motion, AnimatePresence } from 'framer-motion';

import Loader from './Loader';
import EndCallButton from './EndCallButton';
import MeetingChat from './MeetingChat';
import { cn } from '@/lib/utils';
import { meetingApi, Meeting } from '@/lib/meeting-api';
import { participantApi } from '@/lib/participant-api';
import { useToast } from './ui/use-toast';
import { useMeetingStore, debouncedSetParticipantCount, LayoutMode } from '@/stores/useMeetingStore';
import { timing, easing, prefersReducedMotion } from '@/lib/motion';

type CallLayoutType = 'grid' | 'speaker-left' | 'speaker-right';

// Memoized layout components to prevent re-renders
const GridLayoutMemo = memo(function GridLayoutMemo() {
  return <PaginatedGridLayout />;
});

const SpeakerLayoutLeftMemo = memo(function SpeakerLayoutLeftMemo() {
  return <SpeakerLayout participantsBarPosition="left" />;
});

const SpeakerLayoutRightMemo = memo(function SpeakerLayoutRightMemo() {
  return <SpeakerLayout participantsBarPosition="right" />;
});

// Control button component with touch feedback
interface ControlButtonProps {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
  className?: string;
}

const ControlButton = memo(function ControlButton({
  onClick,
  active,
  title,
  children,
  className
}: ControlButtonProps) {
  const reducedMotion = typeof window !== 'undefined' && prefersReducedMotion();

  return (
    <motion.button
      onClick={onClick}
      className={cn(
        "control-btn touch-target no-select",
        active && "bg-google-blue",
        className
      )}
      title={title}
      aria-label={title}
      aria-pressed={active}
      whileHover={!reducedMotion ? { scale: 1.05 } : undefined}
      whileTap={!reducedMotion ? { scale: 0.95 } : undefined}
      transition={{ duration: timing.fast }}
    >
      {children}
    </motion.button>
  );
});

// Panel animation variants with GPU acceleration
const panelVariants = {
  hidden: {
    x: '100%',
    opacity: 0,
  },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    }
  },
  exit: {
    x: '100%',
    opacity: 0,
    transition: {
      duration: timing.normal,
      ease: easing.out,
    }
  }
};

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: timing.fast } },
  exit: { opacity: 0, transition: { duration: timing.fast } }
};

const MeetingRoom = () => {
  const searchParams = useSearchParams();
  const params = useParams();
  const isPersonalRoom = !!searchParams.get('personal');
  const router = useRouter();
  const { user } = useUser();
  const { getToken } = useAuth();
  const { toast } = useToast();
  const call = useCall();
  const reducedMotion = typeof window !== 'undefined' && prefersReducedMotion();

  // Zustand store
  const {
    layout: storeLayout,
    setLayout: setStoreLayout,
    activePanel,
    togglePanel,
    setMeetingId,
    resetMeeting,
  } = useMeetingStore();

  // UI State (local for performance-critical values)
  const [layout, setLayout] = useState<CallLayoutType>('speaker-left');
  const [showParticipants, setShowParticipants] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showMobileControls, setShowMobileControls] = useState(true);

  // Meeting Data
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [hasTrackedJoin, setHasTrackedJoin] = useState(false);
  const [meetingDuration, setMeetingDuration] = useState<number>(0);

  // Refs for stable references
  const layoutRef = useRef<CallLayoutType>('speaker-left');
  const videoContainerRef = useRef<HTMLDivElement>(null);

  const { useCallCallingState, useParticipantCount } = useCallStateHooks();
  const callingState = useCallCallingState();
  const participantCount = useParticipantCount();

  // Debounced participant count update to Zustand
  useEffect(() => {
    if (participantCount !== undefined) {
      debouncedSetParticipantCount(participantCount);
    }
  }, [participantCount]);

  // Stable meeting ID reference
  const meetingId = useMemo(() =>
    Array.isArray(params.id) ? params.id[0] : params.id,
    [params.id]
  );

  // Sync meeting ID to store
  useEffect(() => {
    if (meetingId) {
      setMeetingId(meetingId);
    }
    return () => {
      setMeetingId(null);
    };
  }, [meetingId, setMeetingId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      resetMeeting();
    };
  }, [resetMeeting]);

  // Memoized callbacks to prevent re-renders
  const copyToClipboard = useCallback((text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: `${label} copied`,
      description: `${label} has been copied to clipboard`,
    });
    setShowMoreMenu(false);
  }, [toast]);

  const getMeetingLink = useCallback(() => {
    if (!meeting) return '';
    const baseUrl = typeof window !== 'undefined'
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000');
    return `${baseUrl}/meeting/${meeting.streamCallId}${isPersonalRoom ? '?personal=true' : ''}`;
  }, [meeting, isPersonalRoom]);

  const toggleLayout = useCallback(() => {
    setLayout(prev => {
      const newLayout = prev === 'grid' ? 'speaker-left' : 'grid';
      layoutRef.current = newLayout;
      // Sync to Zustand (simplified view)
      setStoreLayout(newLayout === 'grid' ? 'grid' : 'speaker');
      return newLayout;
    });
  }, [setStoreLayout]);

  const toggleParticipants = useCallback(() => {
    setShowParticipants(prev => !prev);
    if (showChat) setShowChat(false);
  }, [showChat]);

  const toggleChat = useCallback(() => {
    setShowChat(prev => !prev);
    if (showParticipants) setShowParticipants(false);
  }, [showParticipants]);

  const handleLeave = useCallback(async () => {
    if (hasTrackedJoin && meeting && user?.id) {
      try {
        const token = await getToken({ template: "meet" });
        if (token) {
          await participantApi.leaveMeeting(meeting.streamCallId, token);
        }
      } catch (error) {
        console.error('Error tracking leave:', error);
      }
    }
    router.push('/');
  }, [hasTrackedJoin, meeting, user?.id, getToken, router]);

  // Fetch meeting data and track join - only when JOINED
  useEffect(() => {
    if (!call?.id || !user?.id || callingState !== CallingState.JOINED || hasTrackedJoin) return;

    const fetchMeetingAndTrackJoin = async () => {
      try {
        const token = await getToken({ template: "meet" });
        if (!token) return;

        const fetchedMeeting = await meetingApi.getMeetingById(meetingId, token);
        setMeeting(fetchedMeeting);

        try {
          await participantApi.joinMeeting(meetingId, token);
          setHasTrackedJoin(true);
        } catch (error) {
          console.error('Error tracking join:', error);
        }
      } catch (error) {
        console.error('Error fetching meeting:', error);
      }
    };

    fetchMeetingAndTrackJoin();
  }, [call?.id, user?.id, meetingId, getToken, callingState, hasTrackedJoin]);

  // Track leave on unmount
  useEffect(() => {
    const currentMeetingId = meetingId;
    const currentHasTracked = hasTrackedJoin;
    const currentCallId = call?.id;
    const currentUserId = user?.id;

    return () => {
      if (!currentHasTracked || !currentCallId || !currentUserId) return;

      getToken({ template: "meet" }).then(token => {
        if (token) {
          participantApi.leaveMeeting(currentMeetingId, token).catch(console.error);
        }
      });
    };
  }, [meetingId, hasTrackedJoin, call?.id, user?.id, getToken]);

  // Meeting duration timer - optimized
  useEffect(() => {
    if (!meeting?.startTime || meeting?.endTime) {
      setMeetingDuration(0);
      return;
    }

    const startTime = new Date(meeting.startTime).getTime();

    const updateDuration = () => {
      setMeetingDuration(Math.floor((Date.now() - startTime) / 1000));
    };

    updateDuration();
    const interval = setInterval(updateDuration, 1000);

    return () => clearInterval(interval);
  }, [meeting?.startTime, meeting?.endTime]);

  // Close menus on outside click
  useEffect(() => {
    if (!showMoreMenu) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-menu="more"]')) {
        setShowMoreMenu(false);
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [showMoreMenu]);

  // Format duration
  const formattedDuration = useMemo(() => {
    const hours = Math.floor(meetingDuration / 3600);
    const minutes = Math.floor((meetingDuration % 3600) / 60);
    const secs = meetingDuration % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }, [meetingDuration]);

  const isHost = meeting?.hostId === user?.id;

  // Render the appropriate layout - memoized selection
  const LayoutComponent = useMemo(() => {
    switch (layout) {
      case 'grid':
        return GridLayoutMemo;
      case 'speaker-right':
        return SpeakerLayoutLeftMemo;
      default:
        return SpeakerLayoutRightMemo;
    }
  }, [layout]);

  if (callingState !== CallingState.JOINED) return <Loader />;

  return (
    <section className="relative h-screen h-[100dvh] w-full overflow-hidden bg-meeting">
      {/* Top Bar - Meeting Info */}
      <div className="absolute top-0 left-0 right-0 z-40 flex items-center justify-between px-3 py-2 sm:px-4 sm:py-3 safe-top">
        {/* Left - Meeting Title & Duration */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {meeting?.title && (
            <span className="text-white text-xs sm:text-sm font-medium truncate max-w-[120px] sm:max-w-[200px]">
              {meeting.title}
            </span>
          )}
          {meetingDuration > 0 && (
            <span className="text-white/70 text-xs sm:text-sm font-mono flex-shrink-0">
              {formattedDuration}
            </span>
          )}
        </div>

        {/* Right - Participant count & Room code */}
        <div className="flex items-center gap-2">
          {participantCount > 0 && (
            <span className="text-white/70 text-xs sm:text-sm hidden sm:block">
              {participantCount} {participantCount === 1 ? 'person' : 'people'}
            </span>
          )}
          {isHost && meeting?.roomCode && (
            <button
              onClick={() => copyToClipboard(meeting.roomCode!, 'Room code')}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface hover:bg-control-hover text-white text-xs sm:text-sm transition-colors touch-target"
            >
              <span className="font-mono">{meeting.roomCode}</span>
              <Copy className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Video Area - GPU accelerated transforms */}
      <div
        ref={videoContainerRef}
        className="h-full pt-12 pb-20 sm:pt-14 sm:pb-24 px-1 sm:px-2"
        style={{
          transform: 'translate3d(0,0,0)', // Force GPU layer
          willChange: 'transform'
        }}
      >
        <div className="h-full w-full max-w-7xl mx-auto">
          <LayoutComponent />
        </div>
      </div>

      {/* Side Panel - Participants (GPU accelerated) */}
      <AnimatePresence mode="wait">
        {showParticipants && (
          <>
            <motion.div
              key="participants-backdrop"
              variants={backdropVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed inset-0 bg-black/30 z-40 sm:hidden"
              onClick={() => setShowParticipants(false)}
            />
            <motion.div
              key="participants-panel"
              variants={panelVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed right-0 top-0 h-full w-full sm:w-80 max-w-full bg-surface z-50"
              style={{ transform: 'translate3d(0,0,0)' }}
            >
              <div className="flex items-center justify-between p-4 border-b border-meeting-border">
                <h3 className="text-white font-medium">People ({participantCount})</h3>
                <button
                  onClick={() => setShowParticipants(false)}
                  className="p-2 rounded-full hover:bg-control-hover text-white/70 hover:text-white transition-colors touch-target"
                  aria-label="Close participants"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="overflow-y-auto h-[calc(100%-60px)]">
                <CallParticipantsList onClose={() => setShowParticipants(false)} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Side Panel - Chat (GPU accelerated) */}
      <AnimatePresence mode="wait">
        {showChat && meeting && (
          <>
            <motion.div
              key="chat-backdrop"
              variants={backdropVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed inset-0 bg-black/30 z-40 sm:hidden"
              onClick={() => setShowChat(false)}
            />
            <motion.div
              key="chat-panel"
              variants={panelVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed right-0 top-0 h-full w-full sm:w-80 max-w-full z-50"
              style={{ transform: 'translate3d(0,0,0)' }}
            >
              <MeetingChat
                meetingId={meeting.streamCallId}
                isOpen={showChat}
                onClose={() => setShowChat(false)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bottom Control Bar - Mobile optimized */}
      <div className="fixed bottom-0 left-0 right-0 z-40 safe-bottom">
        {/* Mobile expand button */}
        <button
          className="sm:hidden absolute -top-10 left-1/2 -translate-x-1/2 p-2 bg-surface/80 rounded-full backdrop-blur-sm"
          onClick={() => setShowMobileControls(!showMobileControls)}
          aria-label={showMobileControls ? 'Hide controls' : 'Show controls'}
        >
          <ChevronUp className={cn("w-5 h-5 text-white transition-transform", !showMobileControls && "rotate-180")} />
        </button>

        <div className={cn(
          "flex items-center justify-center gap-1 sm:gap-2 py-3 px-2 sm:px-4 transition-transform duration-300",
          !showMobileControls && "translate-y-full sm:translate-y-0"
        )}>
          {/* Main Controls Container */}
          <div className="flex items-center gap-1 sm:gap-2 bg-surface/90 backdrop-blur-sm rounded-full px-2 sm:px-4 py-2">
            {/* Stream Call Controls */}
            <div className="flex items-center">
              <CallControls onLeave={handleLeave} />
            </div>

            {/* Divider - hidden on small mobile */}
            <div className="hidden sm:block w-px h-8 bg-white/20 mx-1 sm:mx-2" />

            {/* Custom Controls */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Layout Toggle - hidden on mobile */}
              <ControlButton
                onClick={toggleLayout}
                title="Change layout"
                className="hidden sm:flex"
              >
                <LayoutGrid className="w-5 h-5" />
              </ControlButton>

              {/* Participants */}
              <ControlButton
                onClick={toggleParticipants}
                active={showParticipants}
                title="Show participants"
              >
                <Users className="w-5 h-5" />
              </ControlButton>

              {/* Chat */}
              <ControlButton
                onClick={toggleChat}
                active={showChat}
                title="Show chat"
              >
                <MessageSquare className="w-5 h-5" />
              </ControlButton>

              {/* More Options */}
              <div className="relative" data-menu="more">
                <ControlButton
                  onClick={() => setShowMoreMenu(!showMoreMenu)}
                  active={showMoreMenu}
                  title="More options"
                >
                  <MoreVertical className="w-5 h-5" />
                </ControlButton>

                <AnimatePresence>
                  {showMoreMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: timing.fast }}
                      className="absolute bottom-14 right-0 w-56 bg-surface rounded-lg shadow-2xl py-2"
                    >
                      <button
                        onClick={() => copyToClipboard(getMeetingLink(), 'Meeting link')}
                        className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-control-hover transition-colors text-left touch-target"
                      >
                        <Link2 className="w-4 h-4" />
                        <span className="text-sm">Copy meeting link</span>
                      </button>
                      {meeting?.roomCode && (
                        <button
                          onClick={() => copyToClipboard(meeting.roomCode!, 'Room code')}
                          className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-control-hover transition-colors text-left touch-target"
                        >
                          <Copy className="w-4 h-4" />
                          <span className="text-sm">Copy room code</span>
                        </button>
                      )}
                      {/* Mobile layout toggle */}
                      <button
                        onClick={() => {
                          toggleLayout();
                          setShowMoreMenu(false);
                        }}
                        className="sm:hidden w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-control-hover transition-colors text-left touch-target"
                      >
                        <LayoutGrid className="w-4 h-4" />
                        <span className="text-sm">Change layout</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* End Call - Only for host in non-personal rooms */}
              {!isPersonalRoom && <EndCallButton />}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default memo(MeetingRoom);
