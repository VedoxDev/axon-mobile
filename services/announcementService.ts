import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/apiConfig';

// Announcement interfaces based on API documentation
export interface CreateAnnouncementRequest {
  title: string; // 3-200 characters
  content: string; // 10-2000 characters
  type?: 'info' | 'warning' | 'success' | 'urgent'; // Default: 'info'
}

export interface AnnouncementCreator {
  id: string;
  nombre: string;
  apellidos: string;
  fullName: string;
}

export interface ProjectAnnouncement {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'success' | 'urgent';
  createdBy: AnnouncementCreator;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAnnouncementResponse {
  message: string;
  announcement: {
    id: string;
    title: string;
    content: string;
    type: 'info' | 'warning' | 'success' | 'urgent';
    createdAt: string;
  };
}

export interface UserAnnouncementsResponse {
  announcements: Array<ProjectAnnouncement & {
    project: {
      id: string;
      name: string;
    };
  }>;
  unreadCount: number;
  stats: {
    total: number;
    unread: number;
    urgent: number;
  };
}

export interface MarkAsReadResponse {
  message: 'announcement-marked-as-read' | 'announcement-already-read';
}

export class AnnouncementService {
  // Get project announcements
  static async getProjectAnnouncements(projectId: string): Promise<ProjectAnnouncement[]> {
    try {
      const token = await AsyncStorage.getItem('access_token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.get(`${API_BASE_URL}/projects/${projectId}/announcements`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch project announcements', error);
      
      // Handle specific error cases
      if (error.response?.status === 401) {
        throw new Error('Autenticación fallida. Por favor inicia sesión de nuevo.');
      } else if (error.response?.status === 403) {
        throw new Error('No tienes permisos para ver los anuncios de este proyecto.');
      } else if (error.response?.status === 404) {
        const message = error.response?.data?.message;
        if (message === 'project-not-found') {
          throw new Error('Proyecto no encontrado.');
        }
        throw new Error('Proyecto no encontrado.');
      } else if (error.response?.status === 400) {
        const message = error.response?.data?.message;
        if (message === 'invalid-project-id') {
          throw new Error('ID de proyecto inválido.');
        }
        throw new Error('Solicitud inválida.');
      } else if (error.response?.status === 500) {
        throw new Error('Error del servidor. Por favor inténtalo de nuevo más tarde.');
      }
      
      // Generic error for network issues or other problems
      throw new Error('Error al cargar los anuncios. Por favor verifica tu conexión e inténtalo de nuevo.');
    }
  }

  // Create project announcement (admin/owner only)
  static async createProjectAnnouncement(projectId: string, announcementData: CreateAnnouncementRequest): Promise<CreateAnnouncementResponse> {
    try {
      const token = await AsyncStorage.getItem('access_token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.post(`${API_BASE_URL}/projects/${projectId}/announcements`, announcementData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      return response.data;
    } catch (error: any) {
      console.error('Failed to create project announcement', error);
      
      // Handle specific error cases
      if (error.response?.status === 400) {
        const messages = error.response?.data?.message;
        if (Array.isArray(messages)) {
          const errorMessages = messages.map(msg => {
            switch (msg) {
              case 'title-required': return 'El título es obligatorio.';
              case 'content-required': return 'El contenido es obligatorio.';
              case 'title-too-short': return 'El título debe tener al menos 3 caracteres.';
              case 'title-too-long': return 'El título no puede tener más de 200 caracteres.';
              case 'content-too-short': return 'El contenido debe tener al menos 10 caracteres.';
              case 'content-too-long': return 'El contenido no puede tener más de 2000 caracteres.';
              case 'type-must-be-info-warning-success-or-urgent': return 'El tipo debe ser info, warning, success o urgent.';
              default: return msg;
            }
          });
          throw new Error(errorMessages.join(' '));
        } else if (messages === 'invalid-project-id') {
          throw new Error('ID de proyecto inválido.');
        }
        throw new Error('Datos del anuncio inválidos. Por favor verifica todos los campos.');
      } else if (error.response?.status === 401) {
        throw new Error('Autenticación fallida. Por favor inicia sesión de nuevo.');
      } else if (error.response?.status === 403) {
        const message = error.response?.data?.message;
        if (message === 'insufficient-permissions') {
          throw new Error('No tienes permisos para crear anuncios en este proyecto. Solo los colaboradores y propietarios pueden crear anuncios.');
        }
        throw new Error('No tienes permisos para crear anuncios en este proyecto.');
      } else if (error.response?.status === 404) {
        throw new Error('Proyecto no encontrado.');
      } else if (error.response?.status === 500) {
        throw new Error('Error del servidor. Por favor inténtalo de nuevo más tarde.');
      }
      
      // Generic error for network issues or other problems
      throw new Error('Error al crear el anuncio. Por favor verifica tu conexión e inténtalo de nuevo.');
    }
  }

  // Get user's announcements (personal area)
  static async getUserAnnouncements(): Promise<UserAnnouncementsResponse> {
    try {
      const token = await AsyncStorage.getItem('access_token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.get(`${API_BASE_URL}/auth/me/announcements`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch user announcements', error);
      
      // Handle specific error cases
      if (error.response?.status === 401) {
        throw new Error('Autenticación fallida. Por favor inicia sesión de nuevo.');
      } else if (error.response?.status === 500) {
        throw new Error('Error del servidor. Por favor inténtalo de nuevo más tarde.');
      }
      
      // Generic error for network issues or other problems
      throw new Error('Error al cargar tus anuncios. Por favor verifica tu conexión e inténtalo de nuevo.');
    }
  }

  // Mark announcement as read
  static async markAnnouncementAsRead(announcementId: string): Promise<MarkAsReadResponse> {
    try {
      const token = await AsyncStorage.getItem('access_token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.put(`${API_BASE_URL}/announcements/${announcementId}/read`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error: any) {
      console.error('Failed to mark announcement as read', error);
      
      // Handle specific error cases
      if (error.response?.status === 401) {
        throw new Error('Autenticación fallida. Por favor inicia sesión de nuevo.');
      } else if (error.response?.status === 404) {
        const message = error.response?.data?.message;
        if (message === 'announcement-not-found-or-no-access') {
          throw new Error('Anuncio no encontrado o sin acceso.');
        }
        throw new Error('Anuncio no encontrado.');
      } else if (error.response?.status === 400) {
        const message = error.response?.data?.message;
        if (message === 'invalid-announcement-id') {
          throw new Error('ID de anuncio inválido.');
        }
        throw new Error('Solicitud inválida.');
      } else if (error.response?.status === 500) {
        throw new Error('Error del servidor. Por favor inténtalo de nuevo más tarde.');
      }
      
      // Generic error for network issues or other problems  
      throw new Error('Error al marcar como leído. Por favor verifica tu conexión e inténtalo de nuevo.');
    }
  }
}

// Helper functions for UI
export const getAnnouncementTypeIcon = (type: string) => {
  switch (type) {
    case 'info': return 'information-circle';
    case 'warning': return 'warning';
    case 'success': return 'checkmark-circle';
    case 'urgent': return 'alert-circle';
    default: return 'information-circle';
  }
};

export const getAnnouncementTypeColor = (type: string) => {
  switch (type) {
    case 'info': return '#2196F3'; // Blue
    case 'warning': return '#FF9800'; // Orange
    case 'success': return '#4CAF50'; // Green
    case 'urgent': return '#F44336'; // Red
    default: return '#2196F3';
  }
};

export const translateAnnouncementType = (type: string) => {
  switch (type) {
    case 'info': return 'Información';
    case 'warning': return 'Advertencia';
    case 'success': return 'Éxito';
    case 'urgent': return 'Urgente';
    default: return 'Información';
  }
}; 