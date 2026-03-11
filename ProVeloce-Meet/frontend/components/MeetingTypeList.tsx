'use client';

import { useState, useCallback, memo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useAuth } from '@clerk/nextjs';
import { Video, Plus, Calendar, Link2, X, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { meetingApi } from '@/lib/meeting-api';
import { useToast } from './ui/use-toast';

const MeetingTypeList = () => {
  const router = useRouter();
  const { user } = useUser();
  const { getToken } = useAuth();
  const { toast } = useToast();

  const [showNewMeetingMenu, setShowNewMeetingMenu] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showInstantModal, setShowInstantModal] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createdMeetingLink, setCreatedMeetingLink] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Schedule form state
  const [scheduleTitle, setScheduleTitle] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');

  const getDisplayName = useCallback(() => {
    if (user?.firstName) {
      return user.lastName
        ? `${user.firstName} ${user.lastName}`.trim()
        : user.firstName;
    }
    return user?.username || 'User';
  }, [user]);

  const createInstantMeeting = useCallback(async () => {
    if (!user) return;

    setIsCreating(true);
    try {
      const token = await getToken({ template: "meet" });
      if (!token) throw new Error('No auth token');

      const meeting = await meetingApi.createMeeting({
        title: `${getDisplayName()}'s Meeting`,
        type: 'instant',
      }, token);

      const baseUrl = typeof window !== 'undefined'
        ? window.location.origin
        : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

      setCreatedMeetingLink(`${baseUrl}/meeting/${meeting.streamCallId}`);
      setShowNewMeetingMenu(false);
      setShowInstantModal(true);
    } catch (error) {
      console.error('Error creating meeting:', error);
      toast({
        title: 'Error',
        description: 'Failed to create meeting. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  }, [user, getToken, getDisplayName, toast]);

  const createScheduledMeeting = useCallback(async () => {
    if (!user || !scheduleDate || !scheduleTime) return;

    setIsCreating(true);
    try {
      const token = await getToken({ template: "meet" });
      if (!token) throw new Error('No auth token');

      const scheduledDateTime = new Date(`${scheduleDate}T${scheduleTime}`);

      const meeting = await meetingApi.createMeeting({
        title: scheduleTitle || `${getDisplayName()}'s Meeting`,
        type: 'scheduled',
        scheduledTime: scheduledDateTime.toISOString(),
      }, token);

      const baseUrl = typeof window !== 'undefined'
        ? window.location.origin
        : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

      setCreatedMeetingLink(`${baseUrl}/meeting/${meeting.streamCallId}`);
      setShowScheduleModal(false);
      setShowInstantModal(true);

      // Reset form
      setScheduleTitle('');
      setScheduleDate('');
      setScheduleTime('');
    } catch (error) {
      console.error('Error scheduling meeting:', error);
      toast({
        title: 'Error',
        description: 'Failed to schedule meeting. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  }, [user, scheduleDate, scheduleTime, scheduleTitle, getToken, getDisplayName, toast]);

  const joinMeeting = useCallback(() => {
    if (!joinCode.trim()) return;

    // Check if it's a full URL or just a code
    if (joinCode.includes('/meeting/')) {
      const meetingId = joinCode.split('/meeting/')[1]?.split('?')[0];
      if (meetingId) {
        router.push(`/meeting/${meetingId}`);
        return;
      }
    }

    // Treat as room code or meeting ID
    router.push(`/meeting/${joinCode.trim()}`);
  }, [joinCode, router]);

  const copyMeetingLink = useCallback(() => {
    navigator.clipboard.writeText(createdMeetingLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  }, [createdMeetingLink]);

  const startMeeting = useCallback(() => {
    const meetingId = createdMeetingLink.split('/meeting/')[1];
    if (meetingId) {
      router.push(`/meeting/${meetingId}`);
    }
  }, [createdMeetingLink, router]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Main Actions - Stack on mobile, row on desktop */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        {/* New Meeting Button with Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNewMeetingMenu(!showNewMeetingMenu)}
            className="flex items-center justify-center sm:justify-start gap-2 w-full sm:w-auto bg-google-blue hover:bg-google-blue-hover active:scale-[0.98] text-white px-5 sm:px-6 py-3 rounded-full font-medium transition-all touch-target"
          >
            <Video className="w-5 h-5" />
            <span>New meeting</span>
          </button>

          {showNewMeetingMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowNewMeetingMenu(false)}
              />
              <div className="absolute top-full left-0 right-0 sm:right-auto mt-2 w-full sm:w-72 bg-white rounded-xl shadow-lg border border-border-lighter py-2 z-50 animate-popIn">
                <button
                  onClick={createInstantMeeting}
                  disabled={isCreating}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-bg-tertiary active:bg-bg-hover text-left transition-colors touch-target"
                >
                  <div className="w-10 h-10 rounded-full bg-bg-tertiary flex items-center justify-center flex-shrink-0">
                    <Link2 className="w-5 h-5 text-text-secondary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-text-primary">Create a meeting for later</p>
                    <p className="text-sm text-text-secondary">Get a link to share</p>
                  </div>
                </button>
                <button
                  onClick={() => {
                    setShowNewMeetingMenu(false);
                    createInstantMeeting().then(() => {
                      if (createdMeetingLink) startMeeting();
                    });
                  }}
                  disabled={isCreating}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-bg-tertiary active:bg-bg-hover text-left transition-colors touch-target"
                >
                  <div className="w-10 h-10 rounded-full bg-bg-tertiary flex items-center justify-center flex-shrink-0">
                    <Plus className="w-5 h-5 text-text-secondary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-text-primary">Start an instant meeting</p>
                    <p className="text-sm text-text-secondary">Start meeting now</p>
                  </div>
                </button>
                <button
                  onClick={() => {
                    setShowNewMeetingMenu(false);
                    setShowScheduleModal(true);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-bg-tertiary active:bg-bg-hover text-left transition-colors touch-target"
                >
                  <div className="w-10 h-10 rounded-full bg-bg-tertiary flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5 text-text-secondary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-text-primary">Schedule in calendar</p>
                    <p className="text-sm text-text-secondary">Plan your meeting</p>
                  </div>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Join Meeting Input - Full width on mobile */}
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Enter a code or link"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && joinMeeting()}
              className="w-full px-4 py-3 border border-border-light rounded-full text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-google-blue focus:ring-1 focus:ring-google-blue text-sm sm:text-base"
            />
          </div>
          <button
            onClick={joinMeeting}
            disabled={!joinCode.trim()}
            className={cn(
              "px-5 sm:px-6 py-3 rounded-full font-medium transition-all touch-target active:scale-[0.98]",
              joinCode.trim()
                ? "text-google-blue hover:bg-google-blue-light"
                : "text-text-tertiary cursor-not-allowed"
            )}
          >
            Join
          </button>
        </div>
      </div>

      {/* Schedule Modal - Bottom sheet on mobile */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md p-5 sm:p-6 animate-slideUp sm:animate-popIn max-h-[90vh] overflow-y-auto safe-bottom">
            <div className="flex items-center justify-between mb-5 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-medium text-text-primary">Schedule a meeting</h2>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="p-2 hover:bg-bg-tertiary rounded-full transition-colors touch-target"
              >
                <X className="w-5 h-5 text-text-secondary" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Meeting title (optional)
                </label>
                <input
                  type="text"
                  value={scheduleTitle}
                  onChange={(e) => setScheduleTitle(e.target.value)}
                  placeholder={`${getDisplayName()}'s Meeting`}
                  className="w-full px-4 py-3 border border-border-light rounded-xl focus:outline-none focus:border-google-blue focus:ring-1 focus:ring-google-blue"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border border-border-light rounded-xl focus:outline-none focus:border-google-blue focus:ring-1 focus:ring-google-blue"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Time
                  </label>
                  <input
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="w-full px-4 py-3 border border-border-light rounded-xl focus:outline-none focus:border-google-blue focus:ring-1 focus:ring-google-blue"
                  />
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4">
                <button
                  onClick={() => setShowScheduleModal(false)}
                  className="w-full sm:w-auto px-6 py-3 text-text-secondary hover:bg-bg-tertiary rounded-full transition-colors touch-target"
                >
                  Cancel
                </button>
                <button
                  onClick={createScheduledMeeting}
                  disabled={!scheduleDate || !scheduleTime || isCreating}
                  className="w-full sm:w-auto px-6 py-3 bg-google-blue hover:bg-google-blue-hover text-white rounded-full font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed touch-target active:scale-[0.98]"
                >
                  {isCreating ? 'Creating...' : 'Schedule'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Meeting Created Modal - Bottom sheet on mobile */}
      {showInstantModal && createdMeetingLink && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md p-5 sm:p-6 animate-slideUp sm:animate-popIn safe-bottom">
            <div className="flex items-center justify-between mb-5 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-medium text-text-primary">Your meeting is ready</h2>
              <button
                onClick={() => {
                  setShowInstantModal(false);
                  setCreatedMeetingLink('');
                }}
                className="p-2 hover:bg-bg-tertiary rounded-full transition-colors touch-target"
              >
                <X className="w-5 h-5 text-text-secondary" />
              </button>
            </div>

            <p className="text-text-secondary mb-4 text-sm sm:text-base">
              Share this link with others you want in the meeting
            </p>

            <div className="flex items-center gap-2 p-3 sm:p-4 bg-bg-tertiary rounded-xl mb-6">
              <input
                type="text"
                readOnly
                value={createdMeetingLink}
                className="flex-1 bg-transparent text-text-primary text-xs sm:text-sm truncate outline-none"
              />
              <button
                onClick={copyMeetingLink}
                className="p-2 sm:p-3 hover:bg-bg-hover rounded-full transition-colors touch-target flex-shrink-0"
              >
                {copiedLink ? (
                  <Check className="w-4 h-4 text-success" />
                ) : (
                  <Copy className="w-4 h-4 text-text-secondary" />
                )}
              </button>
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
              <button
                onClick={() => {
                  setShowInstantModal(false);
                  setCreatedMeetingLink('');
                }}
                className="w-full sm:w-auto px-6 py-3 text-text-secondary hover:bg-bg-tertiary rounded-full transition-colors touch-target"
              >
                Close
              </button>
              <button
                onClick={startMeeting}
                className="w-full sm:w-auto px-6 py-3 bg-google-blue hover:bg-google-blue-hover text-white rounded-full font-medium transition-all touch-target active:scale-[0.98]"
              >
                Join now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(MeetingTypeList);
