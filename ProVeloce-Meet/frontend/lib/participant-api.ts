import { apiClient } from './api-client';

export interface MeetingParticipant {
  _id?: string;
  meetingId: string;
  userId: string;
  userName: string;
  userImageUrl?: string;
  joinedAt: string;
  leftAt?: string;
  duration?: number;
  isHost: boolean;
}

class ParticipantApi {
  async joinMeeting(meetingId: string, token: string): Promise<MeetingParticipant> {
    return apiClient.post<MeetingParticipant>(`/participants/${meetingId}/join`, {}, token);
  }

  async leaveMeeting(meetingId: string, token: string): Promise<MeetingParticipant> {
    return apiClient.post<MeetingParticipant>(`/participants/${meetingId}/leave`, {}, token);
  }

  async getMeetingParticipants(meetingId: string, token: string): Promise<MeetingParticipant[]> {
    return apiClient.get<MeetingParticipant[]>(`/participants/${meetingId}`, token);
  }

  async getUserAttendance(userId: string, token: string, limit = 100, offset = 0): Promise<MeetingParticipant[]> {
    return apiClient.get<MeetingParticipant[]>(`/participants/user/${userId}?limit=${limit}&offset=${offset}`, token);
  }
}

export const participantApi = new ParticipantApi();

