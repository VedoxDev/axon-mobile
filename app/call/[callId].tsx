import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { callService, Call } from '@/services/callService';
import { useUser } from '@/contexts/UserContext';
import { API_BASE_URL } from '@/config/apiConfig';

// For now, let's comment out complex LiveKit imports and create a basic implementation
// import {
//   LiveKitRoom,
//   useTracks,
//   useParticipants,
//   useRoom,
//   useLocalParticipant,
//   AudioSession,
//   VideoTrack,
// } from '@livekit/react-native';
// import { Track } from 'livekit-client';

// Get LIVEKIT_URL from your environment or config
const LIVEKIT_URL = 'wss://axon-68rmd4dw.livekit.cloud'; // Your actual LiveKit URL

const { width, height } = Dimensions.get('window');

// Main component that handles call setup
export default function VideoCallScreen() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const router = useRouter();
  const { getCurrentUserId } = useUser();
  const { callId } = useLocalSearchParams<{ callId: string }>();

  // State
  const [call, setCall] = useState<Call | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (callId) {
      joinCall();
    }
  }, [callId]);

  const joinCall = async () => {
    if (!callId) {
      setError('Invalid call ID');
      setIsLoading(false);
      return;
    }

    try {
      // 🔍 DETAILED DEBUG LOGGING
      console.log('🎥 DEBUGGING CALL ID:');
      console.log('Raw callId:', callId);
      console.log('CallId type:', typeof callId);
      console.log('CallId length:', callId.length);
      console.log('CallId JSON:', JSON.stringify(callId));
      console.log('CallId trimmed:', callId.trim());
      console.log('CallId char codes:', Array.from(callId).map(c => c.charCodeAt(0)));
      
      const cleanCallId = callId.trim();
      console.log('🎥 Joining call with cleaned ID:', cleanCallId);
      
      const { call: callData, token: callToken } = await callService.joinCall(cleanCallId);
      setCall(callData);
      setToken(callToken);
      console.log('✅ Got call data and token');
    } catch (error: any) {
      console.error('❌ Failed to join call:', error);
      console.error('❌ Error details:', error.response?.data);
      setError(error.message || 'Failed to join call');
      Alert.alert('Error', 'Failed to join call. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const leaveCall = async () => {
    try {
      if (callId) {
        await callService.leaveCall(callId);
      }
      router.back();
    } catch (error) {
      console.error('Failed to leave call:', error);
      // Still navigate back even if API call fails
      router.back();
    }
  };

  const endCall = async () => {
    if (!call || !callId) return;

    Alert.alert(
      'End Call',
      'Are you sure you want to end this call for everyone?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Call',
          style: 'destructive',
          onPress: async () => {
            try {
              await callService.endCall(callId);
              router.back();
            } catch (error) {
              console.error('Failed to end call:', error);
              Alert.alert('Error', 'Failed to end call');
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.tint} />
          <Text style={[styles.loadingText, { color: theme.text }]}>
            Connecting to call...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // 🔍 DEBUG ENDPOINTS TEST FUNCTION
  const testDebugEndpoints = async () => {
    if (!callId) return;
    
    try {
      const token = await AsyncStorage.getItem('access_token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };
      
      console.log('🔬 Testing debug endpoints for callId:', callId);
      
      // Test debug endpoint
      const debugResponse = await fetch(`${API_BASE_URL}/calls/debug/${callId}`, {
        method: 'GET',
        headers
      });
      
      console.log('🔬 Debug GET response status:', debugResponse.status);
      const debugData = await debugResponse.text();
      console.log('🔬 Debug GET response:', debugData);
      
      // Test join-debug endpoint
      const joinDebugResponse = await fetch(`${API_BASE_URL}/calls/join-debug/${callId}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ audioOnly: false })
      });
      
      console.log('🔬 Join-debug POST response status:', joinDebugResponse.status);
      const joinDebugData = await joinDebugResponse.text();
      console.log('🔬 Join-debug POST response:', joinDebugData);
      
    } catch (error) {
      console.error('🔬 Debug endpoints error:', error);
    }
  };

  if (error || !token || !call) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#F44336" />
          <Text style={[styles.errorText, { color: theme.text }]}>
            {error || 'Failed to load call'}
          </Text>
          <TouchableOpacity 
            style={[styles.retryButton, { backgroundColor: theme.tint }]}
            onPress={() => {
              setError(null);
              setIsLoading(true);
              joinCall();
            }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.retryButton, { backgroundColor: '#FF9800', marginTop: 10 }]}
            onPress={testDebugEndpoints}
          >
            <Text style={styles.retryButtonText}>Test Debug Endpoints</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // For now, render the call UI directly without LiveKit wrapper
  return (
    <CallRoomView 
      call={call} 
      callId={callId} 
      onLeave={leaveCall} 
      onEnd={endCall}
      getCurrentUserId={getCurrentUserId}
    />
  );
}

// Component that renders the actual call UI inside LiveKitRoom
interface CallRoomViewProps {
  call: Call;
  callId: string;
  onLeave: () => void;
  onEnd: () => void;
  getCurrentUserId: () => string | null;
}

function CallRoomView({ call, callId, onLeave, onEnd, getCurrentUserId }: CallRoomViewProps) {
  // State for controls
  const [micMuted, setMicMuted] = useState(false);
  const [videoMuted, setVideoMuted] = useState(false);

  const toggleMute = () => {
    setMicMuted(!micMuted);
    // TODO: Integrate with LiveKit when hooks are working
    console.log('Toggle mute:', !micMuted);
  };

  const toggleCamera = () => {
    setVideoMuted(!videoMuted);
    // TODO: Integrate with LiveKit when hooks are working
    console.log('Toggle camera:', !videoMuted);
  };

  const switchCamera = () => {
    // TODO: Integrate with LiveKit when hooks are working
    console.log('Switch camera');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#000' }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: 'rgba(0,0,0,0.3)' }]}>
        <Text style={styles.headerTitle}>
          {call.title || 'Video Call'}
        </Text>
        <Text style={styles.connectionStatus}>
          🟢 Connected to call
        </Text>
      </View>

      {/* Video Placeholder */}
      <View style={styles.participantsContainer}>
        <View style={styles.noVideoContainer}>
          <Ionicons name="videocam" size={80} color="#FFF" />
          <Text style={styles.noVideoText}>
            Video call active
          </Text>
          <Text style={styles.noVideoSubText}>
            LiveKit video will appear here
          </Text>
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity 
          style={[styles.controlButton, micMuted && styles.controlButtonMuted]}
          onPress={toggleMute}
        >
          <Ionicons 
            name={micMuted ? "mic-off" : "mic"} 
            size={24} 
            color={micMuted ? "#F44336" : "#FFF"} 
          />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.controlButton, videoMuted && styles.controlButtonMuted]}
          onPress={toggleCamera}
        >
          <Ionicons 
            name={videoMuted ? "videocam-off" : "videocam"} 
            size={24} 
            color={videoMuted ? "#F44336" : "#FFF"} 
          />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.controlButton}
          onPress={switchCamera}
        >
          <Ionicons name="camera-reverse" size={24} color="#FFF" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.controlButton, styles.leaveButton]}
          onPress={onLeave}
        >
          <Ionicons name="call" size={24} color="#FFF" />
        </TouchableOpacity>

        {call.initiator.id === getCurrentUserId() && (
          <TouchableOpacity 
            style={[styles.controlButton, styles.endButton]}
            onPress={onEnd}
          >
            <Ionicons name="stop" size={24} color="#FFF" />
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
  header: {
    padding: 16,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  connectionStatus: {
    color: '#FFF',
    fontSize: 12,
    marginTop: 4,
  },
  participantsContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  participantContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  fullScreen: {
    width: width,
    height: height - 200,
  },
  halfScreen: {
    width: width,
    height: (height - 200) / 2,
  },
  quarterScreen: {
    width: width / 2,
    height: (height - 200) / 2,
  },
  noVideoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    margin: 20,
    borderRadius: 12,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 8,
  },
  audioIndicator: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    padding: 4,
  },
  localLabel: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 12,
  },
  noParticipants: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noParticipantsText: {
    color: '#FFF',
    fontSize: 16,
  },
  noVideoText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  noVideoSubText: {
    color: '#CCC',
    fontSize: 14,
    marginTop: 8,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    gap: 15,
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonMuted: {
    backgroundColor: 'rgba(244,67,54,0.8)',
  },
  leaveButton: {
    backgroundColor: '#F44336',
  },
  endButton: {
    backgroundColor: '#D32F2F',
  },
}); 