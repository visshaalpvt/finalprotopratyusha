'use client';

import { memo, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, Video } from 'lucide-react';

import Loader from './Loader';
import { useMeetings } from '@/providers/MeetingProvider';
import MeetingCard from './MeetingCard';
import { Meeting } from '@/lib/meeting-api';
import { timing, easing, stagger, prefersReducedMotion } from '@/lib/motion';

interface CallListProps {
  type: 'ended' | 'upcoming' | 'recordings';
}

const CallList = memo(function CallList({ type }: CallListProps) {
  const router = useRouter();
  const { endedCalls, upcomingCalls, callRecordings, isLoading } = useMeetings();
  const reducedMotion = typeof window !== 'undefined' && prefersReducedMotion();

  const calls = useMemo(() => {
    switch (type) {
      case 'ended':
        return endedCalls;
      case 'recordings':
        return callRecordings;
      case 'upcoming':
        return upcomingCalls;
      default:
        return [];
    }
  }, [type, endedCalls, upcomingCalls, callRecordings]);

  const getNoCallsMessage = useCallback(() => {
    switch (type) {
      case 'ended':
        return 'No previous calls';
      case 'upcoming':
        return 'No upcoming calls';
      case 'recordings':
        return 'No recordings';
      default:
        return '';
    }
  }, [type]);

  const getIcon = useCallback(() => {
    switch (type) {
      case 'ended':
        return '/icons/previous.svg';
      case 'upcoming':
        return '/icons/upcoming.svg';
      case 'recordings':
        return '/icons/recordings.svg';
      default:
        return '/icons/upcoming.svg';
    }
  }, [type]);

  // Container animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: reducedMotion ? 0 : stagger.normal,
        delayChildren: 0.1,
      },
    },
  };

  if (isLoading) {
    return (
      <motion.div
        className="flex items-center justify-center py-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: timing.normal }}
      >
        <div className="loader-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </motion.div>
    );
  }

  const noCallsMessage = getNoCallsMessage();

  if (!calls || calls.length === 0) {
    return (
      <motion.div
        className="flex flex-col items-center justify-center py-12 text-center"
        initial={reducedMotion ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: timing.normal, ease: easing.smooth }}
      >
        <motion.div
          className="w-16 h-16 rounded-full bg-bg-tertiary flex items-center justify-center mb-4"
          initial={reducedMotion ? false : { scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: timing.normal, delay: 0.1, ease: easing.bounce }}
        >
          {type === 'upcoming' ? (
            <Calendar className="w-8 h-8 text-text-tertiary" />
          ) : type === 'recordings' ? (
            <Video className="w-8 h-8 text-text-tertiary" />
          ) : (
            <Clock className="w-8 h-8 text-text-tertiary" />
          )}
        </motion.div>
        <motion.h2
          className="text-lg font-medium text-text-primary mb-1"
          initial={reducedMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: timing.normal, delay: 0.2 }}
        >
          {noCallsMessage}
        </motion.h2>
        <motion.p
          className="text-sm text-text-secondary"
          initial={reducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: timing.normal, delay: 0.3 }}
        >
          {type === 'upcoming' ? 'Schedule a meeting to see it here' :
            type === 'recordings' ? 'Recorded meetings will appear here' :
              'Your past meetings will appear here'}
        </motion.p>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <AnimatePresence mode="popLayout">
        {calls.map((meeting: Meeting, index: number) => (
          <MeetingCard
            key={meeting._id || meeting.streamCallId}
            icon={getIcon()}
            title={meeting.title || 'Untitled Meeting'}
            date={
              meeting.startTime
                ? new Date(meeting.startTime).toLocaleString()
                : meeting.scheduledTime
                  ? new Date(meeting.scheduledTime).toLocaleString()
                  : meeting.createdAt
                    ? new Date(meeting.createdAt).toLocaleString()
                    : 'No date'
            }
            isPreviousMeeting={type === 'ended'}
            link={
              type === 'recordings' && meeting.recordingUrl
                ? meeting.recordingUrl
                : `${process.env.NEXT_PUBLIC_BASE_URL || ''}/meeting/${meeting.streamCallId}`
            }
            buttonIcon1={type === 'recordings' ? '/icons/play.svg' : undefined}
            buttonText={type === 'recordings' ? 'Play' : 'Start'}
            handleClick={
              type === 'recordings' && meeting.recordingUrl
                ? () => window.open(meeting.recordingUrl!, '_blank')
                : () => router.push(`/meeting/${meeting.streamCallId}`)
            }
            index={index}
          />
        ))}
      </AnimatePresence>
    </motion.div>
  );
});

export default CallList;
