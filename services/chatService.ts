import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL } from '../config/apiConfig';

// Message interfaces
export interface Message {
  id: string;
  content: string;
  senderId?: string; // WebSocket format
  senderName?: string; // WebSocket format
  sender?: { // REST API format
    id: string;
    nombre: string;
    apellidos: string;
  };
  recipient?: any; // REST API format
  project?: any; // REST API format
  createdAt: string;
  type?: 'direct' | 'project';
  recipientId?: string;
  projectId?: string;
  isRead: boolean;
  isEdited?: boolean;
}

export interface Conversation {
  type: 'direct' | 'project';
  partner?: {
    id: string;
    nombre: string;
    apellidos: string;
    status: string;
  };
  project?: {
    id: string;
    name: string;
    description: string;
  };
  lastMessage?: {
    id: string;
    content: string;
    senderId: string;
    senderName?: string;
    createdAt: string;
    isRead: boolean;
  };
}

export interface TypingEvent {
  userId: string;
  typing: boolean;
  timestamp: string;
  type: 'direct' | 'project';
}

// Utility function to normalize message format
function normalizeMessage(msg: any): Message {
  return {
    id: msg.id,
    content: msg.content,
    // Handle both WebSocket and REST API formats
    senderId: msg.senderId || msg.sender?.id,
    senderName: msg.senderName || (msg.sender ? `${msg.sender.nombre} ${msg.sender.apellidos}` : ''),
    sender: msg.sender,
    recipient: msg.recipient,
    project: msg.project,
    createdAt: msg.createdAt,
    type: msg.type,
    recipientId: msg.recipientId,
    projectId: msg.projectId,
    isRead: msg.isRead || false,
    isEdited: msg.isEdited || false,
  };
}

export class ChatService {
  private socket: Socket | null = null;
  private token: string | null = null;
  private isConnected = false;

  // Event handlers
  private onMessageHandlers: ((message: Message) => void)[] = [];
  private onTypingHandlers: ((data: TypingEvent) => void)[] = [];
  private onUserOnlineHandlers: ((userId: string) => void)[] = [];
  private onUserOfflineHandlers: ((userId: string) => void)[] = [];
  private onConnectedHandlers: (() => void)[] = [];
  private onDisconnectedHandlers: (() => void)[] = [];

  async connect(): Promise<void> {
    try {
      this.token = await AsyncStorage.getItem('access_token');
      
      if (!this.token) {
        throw new Error('No authentication token found');
      }

      // Connect to WebSocket
      this.socket = io(`${API_BASE_URL}/chat`, {
        auth: {
          token: this.token
        }
      });

      this.setupEventListeners();
    } catch (error) {
      console.error('Failed to connect to chat:', error);
      throw error;
    }
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('🟢 Connected to chat');
      this.isConnected = true;
      this.onConnectedHandlers.forEach(handler => handler());
    });

    this.socket.on('disconnect', () => {
      console.log('🔴 Disconnected from chat');
      this.isConnected = false;
      this.onDisconnectedHandlers.forEach(handler => handler());
    });

    // Message events
    this.socket.on('newMessage', (message: any) => {
      const normalizedMessage = normalizeMessage(message);
      this.onMessageHandlers.forEach(handler => handler(normalizedMessage));
    });

    this.socket.on('messageSent', (message: any) => {
      console.log('✅ Message sent successfully');
      const normalizedMessage = normalizeMessage(message);
      // Add the sent message to the UI immediately
      this.onMessageHandlers.forEach(handler => handler(normalizedMessage));
    });

    // Listen for errors
    this.socket.on('error', (error: any) => {
      console.error('🚨 WebSocket error:', JSON.stringify(error, null, 2));
    });

    this.socket.on('messageError', (error: any) => {
      console.error('🚨 Message error:', JSON.stringify(error, null, 2));
    });

    // Typing events
    this.socket.on('typing', (data: TypingEvent) => {
      this.onTypingHandlers.forEach(handler => handler(data));
    });

    // Presence events
    this.socket.on('userOnline', (data: { userId: string }) => {
      this.onUserOnlineHandlers.forEach(handler => handler(data.userId));
    });

    this.socket.on('userOffline', (data: { userId: string }) => {
      this.onUserOfflineHandlers.forEach(handler => handler(data.userId));
    });

    // Project room events
    this.socket.on('joinedProject', (data: { projectId: string }) => {
      console.log('Joined project:', data.projectId);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Send direct message
  sendDirectMessage(recipientId: string, content: string): void {
    if (!this.socket || !this.isConnected) {
      throw new Error('Not connected to chat');
    }

    const messageData = {
      content,
      recipientId
    };

console.log('📡 Sending via WebSocket');
    
    this.socket.emit('sendMessage', messageData);
  }

  // Send project message
  sendProjectMessage(projectId: string, content: string): void {
    if (!this.socket || !this.isConnected) {
      throw new Error('Not connected to chat');
    }

    this.socket.emit('sendMessage', {
      content,
      projectId
    });
  }

  // Join project room
  joinProject(projectId: string): void {
    if (!this.socket || !this.isConnected) {
      throw new Error('Not connected to chat');
    }

    this.socket.emit('joinProject', { projectId });
  }

  // Typing indicators
  startTyping(recipientId?: string, projectId?: string): void {
    if (!this.socket || !this.isConnected) return;

    this.socket.emit('typing', {
      recipientId,
      projectId,
      typing: true
    });
  }

  stopTyping(recipientId?: string, projectId?: string): void {
    if (!this.socket || !this.isConnected) return;

    this.socket.emit('typing', {
      recipientId,
      projectId,
      typing: false
    });
  }

  // Get online users
  getOnlineUsers(): void {
    if (!this.socket || !this.isConnected) return;

    this.socket.emit('getOnlineUsers');
  }

  // REST API Methods (fallback)
  async getConversations(): Promise<Conversation[]> {
    try {
      const token = await AsyncStorage.getItem('access_token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.get(`${API_BASE_URL}/chat/conversations`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error: any) {
      console.error('Failed to get conversations', error);
      throw this.handleApiError(error);
    }
  }

  async getDirectMessageHistory(userId: string, page: number = 1, limit: number = 50): Promise<Message[]> {
    try {
      const token = await AsyncStorage.getItem('access_token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.get(`${API_BASE_URL}/chat/direct/${userId}`, {
        params: { page, limit },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('📥 Raw message history response:', JSON.stringify(response.data, null, 2));
      
      // Normalize all messages
      return response.data.map(normalizeMessage);
    } catch (error: any) {
      console.error('Failed to get direct message history', error);
      throw this.handleApiError(error);
    }
  }

  async getProjectMessageHistory(projectId: string, page: number = 1, limit: number = 50): Promise<Message[]> {
    try {
      const token = await AsyncStorage.getItem('access_token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.get(`${API_BASE_URL}/chat/project/${projectId}`, {
        params: { page, limit },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('📥 Raw project message history response:', JSON.stringify(response.data, null, 2));
      
      // Normalize all messages
      return response.data.map(normalizeMessage);
    } catch (error: any) {
      console.error('Failed to get project message history', error);
      throw this.handleApiError(error);
    }
  }

  async sendMessageREST(content: string, recipientId?: string, projectId?: string): Promise<Message> {
    try {
      const token = await AsyncStorage.getItem('access_token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.post(`${API_BASE_URL}/chat/messages`, {
        content,
        recipientId,
        projectId
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error: any) {
      console.error('Failed to send message via REST', error);
      throw this.handleApiError(error);
    }
  }

  // Mark messages as read (NEW ENDPOINT!)
  async markMessagesAsRead(userId: string): Promise<{ markedCount: number }> {
    try {
      const token = await AsyncStorage.getItem('access_token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.put(`${API_BASE_URL}/chat/direct/${userId}/read`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log(`✅ Marked ${response.data.markedCount} messages as read for user:`, userId);
      return response.data;
    } catch (error: any) {
      console.error('Failed to mark messages as read', error);
      // Don't throw error here as it's not critical for the chat functionality
      return { markedCount: 0 };
    }
  }



  // Event handler registration
  onMessage(handler: (message: Message) => void): () => void {
    this.onMessageHandlers.push(handler);
    return () => {
      this.onMessageHandlers = this.onMessageHandlers.filter(h => h !== handler);
    };
  }

  onTyping(handler: (data: TypingEvent) => void): () => void {
    this.onTypingHandlers.push(handler);
    return () => {
      this.onTypingHandlers = this.onTypingHandlers.filter(h => h !== handler);
    };
  }

  onUserOnline(handler: (userId: string) => void): () => void {
    this.onUserOnlineHandlers.push(handler);
    return () => {
      this.onUserOnlineHandlers = this.onUserOnlineHandlers.filter(h => h !== handler);
    };
  }

  onUserOffline(handler: (userId: string) => void): () => void {
    this.onUserOfflineHandlers.push(handler);
    return () => {
      this.onUserOfflineHandlers = this.onUserOfflineHandlers.filter(h => h !== handler);
    };
  }

  onConnected(handler: () => void): () => void {
    this.onConnectedHandlers.push(handler);
    return () => {
      this.onConnectedHandlers = this.onConnectedHandlers.filter(h => h !== handler);
    };
  }

  onDisconnected(handler: () => void): () => void {
    this.onDisconnectedHandlers.push(handler);
    return () => {
      this.onDisconnectedHandlers = this.onDisconnectedHandlers.filter(h => h !== handler);
    };
  }

  private handleApiError(error: any): Error {
    if (error.response?.status === 401) {
      return new Error('Authentication failed. Please log in again.');
    } else if (error.response?.status === 403) {
      return new Error('You do not have permission to access this chat.');
    } else if (error.response?.status === 500) {
      return new Error('Server error. Please try again later.');
    }
    
    return new Error('Failed to connect to chat. Please check your connection and try again.');
  }

  // Getter for connection status
  get connected(): boolean {
    return this.isConnected;
  }
}

// Singleton instance
export const chatService = new ChatService(); 