'use client';

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// Layout types for meeting room
export type LayoutMode = 'grid' | 'speaker';
export type PanelType = 'chat' | 'participants' | 'notes' | 'settings' | null;

// Theme types
export type ThemeMode = 'auto' | 'light' | 'dark';

interface MeetingState {
    // Layout
    layout: LayoutMode;
    setLayout: (layout: LayoutMode) => void;

    // Panels
    activePanel: PanelType;
    setActivePanel: (panel: PanelType) => void;
    togglePanel: (panel: Exclude<PanelType, null>) => void;

    // UI State
    isControlsVisible: boolean;
    setControlsVisible: (visible: boolean) => void;

    // Meeting info
    meetingId: string | null;
    setMeetingId: (id: string | null) => void;

    // Participants (debounced updates)
    participantCount: number;
    setParticipantCount: (count: number) => void;

    // Screen share state
    isScreenSharing: boolean;
    setIsScreenSharing: (sharing: boolean) => void;
    screenShareUserId: string | null;
    setScreenShareUserId: (userId: string | null) => void;

    // Audio/Video state (for local user)
    isMicMuted: boolean;
    setIsMicMuted: (muted: boolean) => void;
    isCameraOff: boolean;
    setIsCameraOff: (off: boolean) => void;

    // Reset meeting state
    resetMeeting: () => void;
}

const initialState = {
    layout: 'grid' as LayoutMode,
    activePanel: null as PanelType,
    isControlsVisible: true,
    meetingId: null as string | null,
    participantCount: 0,
    isScreenSharing: false,
    screenShareUserId: null as string | null,
    isMicMuted: false,
    isCameraOff: false,
};

export const useMeetingStore = create<MeetingState>()(
    subscribeWithSelector((set, get) => ({
        ...initialState,

        setLayout: (layout) => set({ layout }),

        setActivePanel: (panel) => set({ activePanel: panel }),

        togglePanel: (panel) => set((state) => ({
            activePanel: state.activePanel === panel ? null : panel,
        })),

        setControlsVisible: (visible) => set({ isControlsVisible: visible }),

        setMeetingId: (id) => set({ meetingId: id }),

        setParticipantCount: (count) => set({ participantCount: count }),

        setIsScreenSharing: (sharing) => set({ isScreenSharing: sharing }),

        setScreenShareUserId: (userId) => set({ screenShareUserId: userId }),

        setIsMicMuted: (muted) => set({ isMicMuted: muted }),

        setIsCameraOff: (off) => set({ isCameraOff: off }),

        resetMeeting: () => set(initialState),
    }))
);

// Selector hooks for optimized re-renders
export const useLayout = () => useMeetingStore((s) => s.layout);
export const useActivePanel = () => useMeetingStore((s) => s.activePanel);
export const useIsControlsVisible = () => useMeetingStore((s) => s.isControlsVisible);
export const useParticipantCount = () => useMeetingStore((s) => s.participantCount);
export const useIsScreenSharing = () => useMeetingStore((s) => s.isScreenSharing);

// Debounced participant count updater
let participantDebounceTimer: NodeJS.Timeout | null = null;
export const debouncedSetParticipantCount = (count: number, delay = 100) => {
    if (participantDebounceTimer) clearTimeout(participantDebounceTimer);
    participantDebounceTimer = setTimeout(() => {
        useMeetingStore.getState().setParticipantCount(count);
    }, delay);
};
