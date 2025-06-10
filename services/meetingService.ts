import { API_BASE_URL } from '@/config/apiConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Meeting {
  id: string;
  title: string;
  description?: string;
  scheduledAt: string; // ISO date string (API uses scheduledAt, not scheduledFor)
  duration: number; // in minutes
  audioOnly: boolean; // API uses audioOnly instead of isVideoCall
  meetingType: 'project_meeting' | 'personal_meeting';
  status?: 'waiting' | 'active' | 'ended' | 'cancelled';
  
  // Additional fields from history endpoint
  startedAt?: string; // When first person joined
  endedAt?: string; // When meeting ended
  
  initiator: {
    id: string;
    nombre: string;
    apellidos: string;
    email?: string;
  };
  project?: {
    id: string;
    name: string;
  };
  participants?: Array<{
    user: {
      id: string;
      nombre: string;
      apellidos: string;
      email?: string;
      name?: string; // History endpoint might use 'name' instead of 'nombre'/'apellidos'
    };
    isConnected?: boolean;
    joinedAt?: string; // When participant joined
    leftAt?: string; // When participant left
  }>;
  createdAt: string;
}

export interface CreateMeetingData {
  title: string;
  description?: string;
  projectId: string;
  scheduledFor: string; // We'll convert this to scheduledAt when sending to API
  duration: number;
  isVideoCall: boolean; // We'll convert this to audioOnly when sending to API
}

export interface CreatePersonalMeetingData {
  title: string;
  description?: string;
  participantEmails: string[];
  scheduledFor: string; // We'll convert this to scheduledAt when sending to API
  duration: number;
  isVideoCall: boolean; // We'll convert this to audioOnly when sending to API
}

class MeetingService {
  private async getHeaders() {
    const token = await AsyncStorage.getItem('access_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }

  async createMeeting(meetingData: CreateMeetingData): Promise<Meeting> {
    try {
      // Use the correct endpoint based on whether it's a project meeting
      const endpoint = `${API_BASE_URL}/calls/meetings/project`;
      
      // Transform data to match API expectations
      const apiData = {
        title: meetingData.title,
        description: meetingData.description,
        projectId: meetingData.projectId,
        scheduledAt: meetingData.scheduledFor, // API expects 'scheduledAt', not 'scheduledFor'
        duration: meetingData.duration,
        audioOnly: !meetingData.isVideoCall, // API expects audioOnly, we have isVideoCall
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: await this.getHeaders(),
        body: JSON.stringify(apiData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create meeting');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating meeting:', error);
      throw error;
    }
  }

  async createPersonalMeeting(meetingData: CreatePersonalMeetingData): Promise<Meeting> {
    try {
      const endpoint = `${API_BASE_URL}/calls/meetings/personal`;
      
      // Transform data to match API expectations
      const apiData = {
        title: meetingData.title,
        description: meetingData.description,
        participantEmails: meetingData.participantEmails,
        scheduledAt: meetingData.scheduledFor, // API expects 'scheduledAt', not 'scheduledFor'
        duration: meetingData.duration,
        audioOnly: !meetingData.isVideoCall, // API expects audioOnly, we have isVideoCall
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: await this.getHeaders(),
        body: JSON.stringify(apiData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create personal meeting');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating personal meeting:', error);
      throw error;
    }
  }

  async getMeetings(projectId?: string, month?: string): Promise<Meeting[]> {
    try {
      if (projectId) {
        // ✅ Use the dedicated project meeting history endpoint
        const projectMeetingsEndpoint = `${API_BASE_URL}/calls/meetings/project/${projectId}/history`;
        console.log('🏢 Using project meetings endpoint:', projectMeetingsEndpoint);
        
        const response = await fetch(projectMeetingsEndpoint, {
          method: 'GET',
          headers: await this.getHeaders(),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch project meetings');
        }

        const projectMeetings = await response.json();
        console.log('✅ Project meetings fetched:', projectMeetings.length, 'meetings');
        
        // Log meeting statuses for debugging
        const statusCounts = projectMeetings.reduce((acc: any, meeting: Meeting) => {
          acc[meeting.status || 'unknown'] = (acc[meeting.status || 'unknown'] || 0) + 1;
          return acc;
        }, {});
        console.log('📊 Project meeting status breakdown:', statusCounts);

        return projectMeetings;
      } else {
        // For personal/general view, use the existing logic with /calls/meetings/my and /calls/history
        const upcomingEndpoint = `${API_BASE_URL}/calls/meetings/my`;

        // History endpoint requires page and limit parameters
        const historyParams = new URLSearchParams({
          page: '1',
          limit: '50'
        });
        
        const historyEndpoint = `${API_BASE_URL}/calls/history?${historyParams.toString()}`;

        const [upcomingResponse, historyResponse] = await Promise.all([
          fetch(upcomingEndpoint, {
            method: 'GET',
            headers: await this.getHeaders(),
          }),
          fetch(historyEndpoint, {
            method: 'GET',
            headers: await this.getHeaders(),
          })
        ]);

        if (!upcomingResponse.ok) {
          throw new Error('Failed to fetch upcoming meetings');
        }

        const upcomingMeetings = await upcomingResponse.json();
        console.log('📅 Personal upcoming meetings fetched:', upcomingMeetings.length, 'meetings');
        
        let historyMeetings = [];

        // History endpoint might not exist or return 404, handle gracefully
        if (historyResponse.ok) {
          historyMeetings = await historyResponse.json();
          console.log('✅ Personal history endpoint success:', historyMeetings.length, 'meetings found');
        } else {
          console.log('❌ Personal history endpoint failed:');
          console.log('  - Status:', historyResponse.status);
          console.log('  - Status Text:', historyResponse.statusText);
          console.log('  - URL:', historyEndpoint);
          
          try {
            const errorText = await historyResponse.text();
            console.log('  - Error Response:', errorText);
          } catch (e) {
            console.log('  - Could not read error response');
          }
          
          console.log('📝 Showing only upcoming meetings for now');
        }

        // Combine both arrays and remove duplicates
        const allMeetings = [...upcomingMeetings];
        
        // Add history meetings that aren't already in upcoming
        historyMeetings.forEach((historyMeeting: Meeting) => {
          const existsInUpcoming = upcomingMeetings.some((upcoming: Meeting) => upcoming.id === historyMeeting.id);
          if (!existsInUpcoming) {
            allMeetings.push(historyMeeting);
          }
        });

        console.log('🔄 Personal meetings final result:');
        console.log('  - Upcoming meetings:', upcomingMeetings.length);
        console.log('  - History meetings:', historyMeetings.length);
        console.log('  - Total combined:', allMeetings.length);

        return allMeetings;
      }
    } catch (error) {
      console.error('Error fetching meetings:', error);
      throw error;
    }
  }

  async getMeeting(meetingId: string): Promise<Meeting> {
    try {
      const response = await fetch(`${API_BASE_URL}/calls/meetings/${meetingId}`, {
        method: 'GET',
        headers: await this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch meeting');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching meeting:', error);
      throw error;
    }
  }

  async startMeeting(meetingId: string): Promise<{ callId: string; token: string }> {
    try {
      // According to the API docs, we just join the meeting - no separate start endpoint
      return await this.joinMeeting(meetingId);
    } catch (error) {
      console.error('Error starting meeting:', error);
      throw error;
    }
  }

  async joinMeeting(meetingId: string): Promise<{ callId: string; token: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/calls/join/${meetingId}`, {
        method: 'POST',
        headers: await this.getHeaders(),
        body: JSON.stringify({ audioOnly: false }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to join meeting');
      }

      const data = await response.json();
      return {
        callId: data.call.id,
        token: data.token
      };
    } catch (error) {
      console.error('Error joining meeting:', error);
      throw error;
    }
  }

  async updateMeeting(meetingId: string, updates: Partial<CreateMeetingData>): Promise<Meeting> {
    try {
      // Note: Update functionality may not be available in the current API
      // This would need to be implemented on the backend
      throw new Error('Meeting updates not yet supported by the API');
    } catch (error) {
      console.error('Error updating meeting:', error);
      throw error;
    }
  }

  async deleteMeeting(meetingId: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/calls/meetings/${meetingId}`, {
        method: 'DELETE',
        headers: await this.getHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to cancel meeting');
      }
    } catch (error) {
      console.error('Error cancelling meeting:', error);
      throw error;
    }
  }
}

export const meetingService = new MeetingService(); 