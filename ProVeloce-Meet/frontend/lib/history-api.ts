import { apiClient } from './api-client';

export interface HistoryEntry {
  _id?: string;
  userId: string;
  meetingId: string;
  action: 'joined' | 'left' | 'started' | 'ended' | 'recorded' | 'shared_screen' | 'muted' | 'unmuted';
  timestamp: string;
  metadata?: Record<string, any>;
  createdAt?: string;
}

class HistoryApi {
  async getUserHistory(userId: string, token: string, limit = 100, offset = 0, meetingId?: string): Promise<HistoryEntry[]> {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());
    if (meetingId) params.append('meetingId', meetingId);
    
    const query = params.toString();
    return apiClient.get<HistoryEntry[]>(`/history/user/${userId}${query ? `?${query}` : ''}`, token);
  }

  async getMeetingHistory(meetingId: string, token: string, limit = 100, offset = 0): Promise<HistoryEntry[]> {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());
    
    const query = params.toString();
    return apiClient.get<HistoryEntry[]>(`/history/meeting/${meetingId}${query ? `?${query}` : ''}`, token);
  }

  async createHistoryEntry(data: { meetingId: string; action: HistoryEntry['action']; metadata?: Record<string, any> }, token: string): Promise<HistoryEntry> {
    return apiClient.post<HistoryEntry>('/history', data, token);
  }
}

export const historyApi = new HistoryApi();

