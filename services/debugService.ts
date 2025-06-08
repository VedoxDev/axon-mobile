import AsyncStorage from '@react-native-async-storage/async-storage';

export class DebugService {
  
  // Decode JWT token (basic decode, not verification)
  static decodeJWT(token: string): any {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }
      
      const payload = parts[1];
      // Add padding if needed
      const padded = payload + '==='.slice(0, (4 - payload.length % 4) % 4);
      const decoded = atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
      
      return JSON.parse(decoded);
    } catch (error) {
      console.error('Failed to decode JWT:', error);
      return null;
    }
  }

  // Debug current authentication state
  static async debugAuth(): Promise<void> {
    try {
      const token = await AsyncStorage.getItem('access_token');
      
      if (!token) {
        console.log('🔍 DEBUG: No access token found');
        return;
      }

      console.log('🔍 DEBUG: Token exists, length:', token.length);
      
      const decoded = this.decodeJWT(token);
      if (decoded) {
        console.log('🔍 DEBUG: Decoded JWT payload:', JSON.stringify(decoded, null, 2));
        console.log('🔍 DEBUG: User ID from token:', decoded.sub || decoded.userId || decoded.id);
        console.log('🔍 DEBUG: Token expiry:', new Date(decoded.exp * 1000).toISOString());
        console.log('🔍 DEBUG: Token issued at:', new Date(decoded.iat * 1000).toISOString());
      } else {
        console.log('🔍 DEBUG: Failed to decode JWT token');
      }
      
    } catch (error) {
      console.error('🔍 DEBUG: Auth debug failed:', error);
    }
  }
} 