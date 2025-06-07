import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/apiConfig';

export interface PendingInvitation {
  id: string;
  project: {
    id: string;
    name: string;
    description: string;
  };
  inviter: {
    id: string;
    nombre: string;
    apellidos: string;
  };
  role: string;
  createdAt: string;
}

export interface InvitationResponse {
  message: string;
  projectId?: string;
}

export class InvitationService {
  /**
   * Get all pending invitations for the current user
   */
  static async getPendingInvitations(): Promise<PendingInvitation[]> {
    try {
      const token = await AsyncStorage.getItem('access_token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.get(`${API_BASE_URL}/projects/invitations/pending`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch pending invitations', error);
      
      if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please log in again.');
      } else if (error.response?.status === 500) {
        throw new Error('Server error. Please try again later.');
      }
      
      throw new Error('Failed to fetch invitations. Please check your connection and try again.');
    }
  }

  /**
   * Respond to a project invitation (accept or reject)
   */
  static async respondToInvitation(
    invitationId: string, 
    action: 'accept' | 'reject'
  ): Promise<InvitationResponse> {
    try {
      const token = await AsyncStorage.getItem('access_token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.put(`${API_BASE_URL}/projects/invitations/${invitationId}/respond`, {
        action
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      return response.data;
    } catch (error: any) {
      console.error('Failed to respond to invitation', error);
      
      if (error.response?.status === 400) {
        throw new Error('Invalid response. Please try again.');
      } else if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please log in again.');
      } else if (error.response?.status === 404) {
        throw new Error('Invitation not found.');
      } else if (error.response?.status === 500) {
        throw new Error('Server error. Please try again later.');
      }
      
      throw new Error('Failed to respond to invitation. Please check your connection and try again.');
    }
  }
} 