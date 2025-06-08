import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL } from '../config/apiConfig';

// Call interfaces
export interface CallUser {
  id: string;
  nombre: string;
  apellidos: string;
}

export interface Call {
  id: string;
  roomName: string;
  type: 'direct' | 'project';
  status: 'waiting' | 'active' | 'ended' | 'cancelled';
  title: string;
  audioOnly: boolean;
  initiator: CallUser;
  recipient?: CallUser;
  project?: {
    id: string;
    name: string;
    description: string;
  };
  createdAt: string;
  maxParticipants?: number;
}

export interface CallParticipant {
  id: string;
  userId: string;
  callId: string;
  isConnected: boolean;
  micMuted: boolean;
  videoMuted: boolean;
  joinedAt: string;
  leftAt?: string;
  user: CallUser;
}

export interface StartCallResponse {
  call: Call;
  token: string;
}

export interface JoinCallResponse {
  call: Call;
  token: string;
}

export class CallService {
  private getAuthHeaders = async () => {
    const token = await AsyncStorage.getItem('access_token');
    if (!token) {
      throw new Error('No authentication token found');
    }
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  };

  private handleApiError(error: any): Error {
    if (error.response?.data?.message) {
      return new Error(error.response.data.message);
    }
    if (error.message) {
      return new Error(error.message);
    }
    return new Error('An unexpected error occurred');
  }

  // Start a direct call (1:1)
  async startDirectCall(
    recipientId: string, 
    title: string = 'Video call', 
    audioOnly: boolean = false
  ): Promise<StartCallResponse> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await axios.post(
        `${API_BASE_URL}/calls/start`,
        {
          type: 'direct',
          recipientId,
          title,
          audioOnly,
        },
        { headers }
      );
      
      return response.data;
    } catch (error) {
      throw this.handleApiError(error);
    }
  }

  // Start a project call (group)
  async startProjectCall(
    projectId: string, 
    title: string = 'Project meeting', 
    maxParticipants: number = 10,
    audioOnly: boolean = false
  ): Promise<StartCallResponse> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await axios.post(
        `${API_BASE_URL}/calls/start`,
        {
          type: 'project',
          projectId,
          title,
          maxParticipants,
          audioOnly,
        },
        { headers }
      );
      
      return response.data;
    } catch (error) {
      throw this.handleApiError(error);
    }
  }

  // Join an existing call
  async joinCall(callId: string, audioOnly: boolean = false): Promise<JoinCallResponse> {
    try {
      // 🔍 DETAILED API DEBUG LOGGING
      console.log('📡 CALL SERVICE DEBUG:');
      console.log('API_BASE_URL:', API_BASE_URL);
      console.log('callId received:', callId);
      console.log('callId type:', typeof callId);
      console.log('callId length:', callId.length);
      console.log('Full URL:', `${API_BASE_URL}/calls/join/${callId}`);
      
      const headers = await this.getAuthHeaders();
      console.log('Headers:', headers);
      
      const response = await axios.post(
        `${API_BASE_URL}/calls/join/${callId}`,
        { audioOnly },
        { headers }
      );
      
      console.log('✅ API Response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ API Error:', error);
      if (error.response) {
        console.error('❌ Response status:', error.response.status);
        console.error('❌ Response data:', error.response.data);
        console.error('❌ Response headers:', error.response.headers);
      }
      throw this.handleApiError(error);
    }
  }

  // Leave a call
  async leaveCall(callId: string): Promise<void> {
    try {
      const headers = await this.getAuthHeaders();
      await axios.put(
        `${API_BASE_URL}/calls/leave/${callId}`,
        {},
        { headers }
      );
    } catch (error) {
      throw this.handleApiError(error);
    }
  }

  // End a call (initiator only)
  async endCall(callId: string): Promise<void> {
    try {
      const headers = await this.getAuthHeaders();
      await axios.delete(
        `${API_BASE_URL}/calls/end/${callId}`,
        { headers }
      );
    } catch (error) {
      throw this.handleApiError(error);
    }
  }

  // Update participant state (mute/unmute)
  async updateParticipantState(
    callId: string, 
    micMuted?: boolean, 
    videoMuted?: boolean
  ): Promise<void> {
    try {
      const headers = await this.getAuthHeaders();
      const body: any = {};
      if (micMuted !== undefined) body.micMuted = micMuted;
      if (videoMuted !== undefined) body.videoMuted = videoMuted;

      await axios.put(
        `${API_BASE_URL}/calls/participant/${callId}`,
        body,
        { headers }
      );
    } catch (error) {
      throw this.handleApiError(error);
    }
  }

  // Generate new token (if expired)
  async generateNewToken(callId: string): Promise<string> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await axios.post(
        `${API_BASE_URL}/calls/token/${callId}`,
        {},
        { headers }
      );
      
      return response.data.token;
    } catch (error) {
      throw this.handleApiError(error);
    }
  }

  // Get active calls
  async getActiveCalls(): Promise<Call[]> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await axios.get(
        `${API_BASE_URL}/calls/active`,
        { headers }
      );
      
      return response.data.calls || [];
    } catch (error) {
      throw this.handleApiError(error);
    }
  }

  // Get call history
  async getCallHistory(page: number = 1, limit: number = 20): Promise<{
    calls: Call[];
    totalPages: number;
    currentPage: number;
    totalCalls: number;
  }> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await axios.get(
        `${API_BASE_URL}/calls/history?page=${page}&limit=${limit}`,
        { headers }
      );
      
      return response.data;
    } catch (error) {
      throw this.handleApiError(error);
    }
  }
}

// Export singleton instance
export const callService = new CallService(); 