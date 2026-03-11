import { apiClient } from './api-client';

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  userImageUrl?: string;
  message: string;
  timestamp: string;
}

export interface HistoryEntry {
  action: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface MeetingHistory {
  meetingId: string;
  meeting: {
    title: string;
    type: string;
    hostId: string;
    hostName: string;
    startTime?: string;
    endTime?: string;
    scheduledTime?: string;
    status: string;
    recordingUrl?: string;
  } | null;
  participation: {
    joinedAt: string;
    leftAt?: string;
    duration?: number;
    isHost: boolean;
  };
  chatMessages: ChatMessage[];
  historyEntries: HistoryEntry[];
}

export interface DetailedMeetingHistory {
  meeting: {
    streamCallId: string;
    title: string;
    type: string;
    hostId: string;
    hostName: string;
    startTime?: string;
    endTime?: string;
    scheduledTime?: string;
    status: string;
    duration?: number; // Meeting duration in seconds
    recordingUrl?: string;
  };
  participants: Array<{
    userId: string;
    userName: string;
    userImageUrl?: string;
    joinedAt: string;
    leftAt?: string;
    duration?: number;
    isHost: boolean;
  }>;
  chatMessages: ChatMessage[];
  historyEntries: Array<{
    userId: string;
    action: string;
    timestamp: string;
    metadata?: Record<string, any>;
  }>;
}

class MeetingHistoryApi {
  async getUserHistory(userId: string, token: string, limit = 50, offset = 0): Promise<MeetingHistory[]> {
    return apiClient.get<MeetingHistory[]>(`/meeting-history/user/${userId}?limit=${limit}&offset=${offset}`, token);
  }

  async getMeetingHistory(meetingId: string, token: string): Promise<DetailedMeetingHistory> {
    return apiClient.get<DetailedMeetingHistory>(`/meeting-history/meeting/${meetingId}`, token);
  }
}

export const meetingHistoryApi = new MeetingHistoryApi();

