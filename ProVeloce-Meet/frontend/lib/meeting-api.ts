import { apiClient } from './api-client';

export interface Meeting {
  _id?: string;
  streamCallId: string;
  roomCode?: string;
  title: string;
  description?: string;
  type: 'instant' | 'scheduled' | 'personal';
  hostId: string;
  hostName: string;
  hostImageUrl?: string;
  startTime?: string;
  endTime?: string;
  scheduledTime?: string;
  participants: string[];
  duration?: number; // Meeting duration in seconds
  recordingUrl?: string;
  recordingId?: string;
  status: 'scheduled' | 'ongoing' | 'ended' | 'cancelled';
  meetingLink: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateMeetingDto {
  title: string;
  description?: string;
  type: 'instant' | 'scheduled' | 'personal';
  scheduledTime?: string;
  participants?: string[];
}

class MeetingApi {
  async createMeeting(data: CreateMeetingDto, token: string): Promise<Meeting> {
    return apiClient.post<Meeting>('/meetings', data, token);
  }

  async getMeetings(token: string, status?: string, type?: string): Promise<Meeting[]> {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (type) params.append('type', type);
    
    const query = params.toString();
    return apiClient.get<Meeting[]>(`/meetings${query ? `?${query}` : ''}`, token);
  }

  async getMeetingById(id: string, token: string): Promise<Meeting> {
    return apiClient.get<Meeting>(`/meetings/${id}`, token);
  }

  async updateMeetingStatus(id: string, status: Meeting['status'], token: string): Promise<Meeting> {
    return apiClient.patch<Meeting>(`/meetings/${id}/status`, { status }, token);
  }

  async addParticipant(id: string, participantId: string, token: string): Promise<Meeting> {
    return apiClient.post<Meeting>(`/meetings/${id}/participants`, { participantId }, token);
  }

  async deleteMeeting(id: string, token: string): Promise<void> {
    return apiClient.delete<void>(`/meetings/${id}`, token);
  }
}

export const meetingApi = new MeetingApi();

