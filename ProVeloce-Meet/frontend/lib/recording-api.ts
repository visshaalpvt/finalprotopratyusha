import { apiClient } from './api-client';

export interface Recording {
  meetingId: string;
  title: string;
  recordingUrl: string;
  recordingId?: string;
  startTime?: string;
  endTime?: string;
  duration?: number;
  createdAt?: string;
}

class RecordingApi {
  async saveRecording(meetingId: string, data: { recordingUrl: string; recordingId?: string; duration?: number }, token: string): Promise<Recording> {
    return apiClient.post<Recording>(`/recordings/${meetingId}`, data, token);
  }

  async getHostRecordings(hostId: string, token: string, limit = 100, offset = 0): Promise<Recording[]> {
    return apiClient.get<Recording[]>(`/recordings/host/${hostId}?limit=${limit}&offset=${offset}`, token);
  }

  async getRecording(meetingId: string, token: string): Promise<Recording> {
    return apiClient.get<Recording>(`/recordings/${meetingId}`, token);
  }
}

export const recordingApi = new RecordingApi();

