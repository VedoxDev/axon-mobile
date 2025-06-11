import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,

  ActivityIndicator,
  Dimensions,
  PermissionsAndroid,
  Platform,
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
import { useCustomAlert } from '@/hooks/useCustomAlert';
import { CustomAlert } from '@/components/CustomAlert';

// Use LiveKit client for room and tracks
import { Room, RoomEvent, RemoteParticipant, LocalParticipant, Track } from 'livekit-client';
import { VideoTrack } from '@livekit/react-native';

// Get LIVEKIT_URL from your environment or config
const LIVEKIT_URL = 'wss://axon-68rmd4dw.livekit.cloud';

const { width, height } = Dimensions.get('window');

// Main component that handles call setup
export default function VideoCallScreen() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const router = useRouter();
  const { getCurrentUserId } = useUser();
  const { callId } = useLocalSearchParams<{ callId: string }>();
  const { showAlert, alertConfig, hideAlert } = useCustomAlert();

  // State
  const [call, setCall] = useState<Call | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [participants, setParticipants] = useState<RemoteParticipant[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [micMuted, setMicMuted] = useState(false);
  const [videoMuted, setVideoMuted] = useState(false);
  const [localVideoTrack, setLocalVideoTrack] = useState<any>(null);
  const [remoteVideoTracks, setRemoteVideoTracks] = useState<any[]>([]);

  const roomRef = useRef<Room | null>(null);

  // Helper function to check if a video track is actually enabled
  const isVideoTrackEnabled = (publication: any): boolean => {
    return publication && publication.videoTrack && !publication.isMuted && publication.isSubscribed;
  };

  // Helper function to get user display name from participant identity
  const getDisplayName = (participant: any, currentUserId: string | null) => {
    // If it's the current user, return "You"
    if (participant.identity === currentUserId) {
      return 'Tú';
    }
    
    // WORKAROUND: Use call data to get proper names while backend fixes metadata
    if (call) {
      // Check if this participant is the initiator
      if (participant.identity === call.initiator.id) {
        return `${call.initiator.nombre} ${call.initiator.apellidos}`;
      }
      // Check if this participant is the recipient (for direct calls)
      if (call.recipient && participant.identity === call.recipient.id) {
        return `${call.recipient.nombre} ${call.recipient.apellidos}`;
      }
    }
    
    // Check for metadata with displayName (when backend fixes the undefined issue)
    if (participant.metadata) {
      try {
        const metadata = JSON.parse(participant.metadata);
        if (metadata.displayName && metadata.displayName !== 'undefined undefined') {
          return metadata.displayName; // Returns "John Smith"
        }
      } catch (error) {
        console.log('Failed to parse participant metadata:', error);
      }
    }
    
    // Fallback: Check if participant.name is different from identity
    if (participant.name && participant.name !== participant.identity && participant.name !== 'undefined undefined') {
      return participant.name; // Returns display name if set
    }
    
    // Last resort: Use first part of UUID with "User" prefix
    const shortId = participant.identity.split('-')[0];
    return `Usuario ${shortId}`;
  };

  useEffect(() => {
    if (callId) {
      requestPermissionsAndJoinCall();
    }

    return () => {
      // Cleanup on unmount
      if (roomRef.current) {
        roomRef.current.disconnect();
      }
    };
  }, [callId]);

  const requestPermissionsAndJoinCall = async () => {
    if (Platform.OS === 'android') {
      try {
        const permissions = [
          PermissionsAndroid.PERMISSIONS.CAMERA,
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        ];

        const granted = await PermissionsAndroid.requestMultiple(permissions);
        
        if (
          granted[PermissionsAndroid.PERMISSIONS.CAMERA] === PermissionsAndroid.RESULTS.GRANTED &&
          granted[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === PermissionsAndroid.RESULTS.GRANTED
        ) {
          console.log('✅ Camera and microphone permissions granted');
          joinCall();
        } else {
          console.log('❌ Permissions denied');
          showAlert({
            title: 'Permisos requeridos',
            message: 'Se requieren permisos de cámara y micrófono para las videollamadas.',
            type: 'warning',
            buttons: [
              { text: 'Cancelar', style: 'cancel', onPress: () => router.back() },
              { text: 'Reintentar', style: 'default', onPress: requestPermissionsAndJoinCall }
            ]
          });
        }
      } catch (error) {
        console.error('Permission request error:', error);
        joinCall(); // Continue anyway
      }
    } else {
      joinCall();
    }
  };

  const joinCall = async () => {
    if (!callId) {
      setError('Invalid call ID');
      setIsLoading(false);
      return;
    }

    try {
      console.log('🎥 Joining call with ID:', callId);
      
      const { call: callData, token: callToken } = await callService.joinCall(callId.trim());
      setCall(callData);
      setToken(callToken);
      console.log('✅ Got call data and token');

      // Connect to LiveKit using core client
      await connectToLiveKit(callToken, callData);
      
    } catch (error: any) {
      console.error('❌ Failed to join call:', error);
      setError(error.message || 'No se pudo unir a la llamada');
      showAlert({
        title: 'Error',
        message: 'No se pudo unir a la llamada. Por favor inténtalo de nuevo.',
        type: 'error',
        buttons: [{ text: 'Entendido', style: 'default' }]
      });
    } finally {
      setIsLoading(false);
    }
  };

  const connectToLiveKit = async (token: string, callData: Call) => {
    try {
      console.log('🔗 Connecting to LiveKit...');
      
      const newRoom = new Room();
      await newRoom.connect(LIVEKIT_URL, token);

      console.log('✅ Connected to LiveKit room');
      setRoom(newRoom);
      setIsConnected(true);
      roomRef.current = newRoom;

      // Get existing participants when joining
      const existingParticipants = Array.from(newRoom.remoteParticipants.values());
      console.log('👥 Existing participants:', existingParticipants.length);
      setParticipants(existingParticipants);

      // Check for existing video tracks from participants already in the room
      existingParticipants.forEach((participant) => {
        console.log('👤 Checking existing participant:', participant.identity);
        participant.videoTrackPublications.forEach((publication) => {
          if (publication.videoTrack && publication.isSubscribed) {
            console.log('🎥 Found existing video track from:', participant.identity);
            setRemoteVideoTracks(prev => [...prev, { publication, participant }]);
          }
        });
      });

      // Set up event listeners
      newRoom.on(RoomEvent.ParticipantConnected, (participant: RemoteParticipant) => {
        console.log('👤 Participant connected:', participant.identity);
        setParticipants(prev => [...prev, participant]);
      });

      newRoom.on(RoomEvent.ParticipantDisconnected, (participant: RemoteParticipant) => {
        console.log('👤 Participant disconnected:', participant.identity);
        setParticipants(prev => prev.filter(p => p.identity !== participant.identity));
      });

      newRoom.on(RoomEvent.TrackSubscribed, (track: any, publication: any, participant: any) => {
        console.log('🎥 Track subscribed:', track.kind, 'from', participant.identity);
        if (track.kind === Track.Kind.Video) {
          console.log('📹 Adding remote video track for:', participant.identity);
          setRemoteVideoTracks(prev => [...prev, { publication, participant }]);
        }
      });

      newRoom.on(RoomEvent.TrackUnsubscribed, (track: any, publication: any, participant: any) => {
        console.log('🎥 Track unsubscribed:', track.kind, 'from', participant.identity);
        if (track.kind === Track.Kind.Video) {
          console.log('📹 Removing remote video track for:', participant.identity);
          setRemoteVideoTracks(prev => prev.filter(t => t.publication !== publication));
        }
      });

      // Handle when a track is muted/unmuted (camera on/off)
      newRoom.on(RoomEvent.TrackMuted, (publication: any, participant: any) => {
        console.log('🔇 Track muted:', publication.kind, 'from', participant.identity);
        if (publication.kind === Track.Kind.Video) {
          console.log('📹 Video track muted (camera off) for:', participant.identity);
          // Only handle remote participants (local participant is handled separately)
          if (participant !== newRoom.localParticipant) {
            setRemoteVideoTracks(prev => prev.filter(t => t.publication !== publication));
          }
        }
      });

      newRoom.on(RoomEvent.TrackUnmuted, (publication: any, participant: any) => {
        console.log('🔊 Track unmuted:', publication.kind, 'from', participant.identity);
        if (publication.kind === Track.Kind.Video) {
          console.log('📹 Video track unmuted (camera on) for:', participant.identity);
          // Only add remote participants to remote video tracks (not local participant)
          if (participant !== newRoom.localParticipant) {
            setRemoteVideoTracks(prev => {
              // Check if already exists to prevent duplicates
              const exists = prev.some(t => t.publication === publication);
              if (!exists) {
                return [...prev, { publication, participant }];
              }
              return prev;
            });
          }
        }
      });

      newRoom.on(RoomEvent.LocalTrackPublished, (publication: any) => {
        console.log('📡 Local track published:', publication.kind);
        if (publication.kind === Track.Kind.Video) {
          console.log('📹 Setting local video track');
          setLocalVideoTrack(publication);
        }
      });

      // Handle local track unpublished (when user turns off camera)
      newRoom.on(RoomEvent.LocalTrackUnpublished, (publication: any) => {
        console.log('📡 Local track unpublished:', publication.kind);
        if (publication.kind === Track.Kind.Video) {
          console.log('📹 Removing local video track');
          setLocalVideoTrack(null);
        }
      });

      newRoom.on(RoomEvent.Disconnected, (reason: any) => {
        console.log('❌ Disconnected from room:', reason);
        setIsConnected(false);
        setRoom(null);
      });

      // Enable audio automatically, camera based on call type
      try {
        await newRoom.localParticipant.setMicrophoneEnabled(true);
        // Only enable camera for video calls, keep off for audio calls
        const shouldEnableCamera = !callData.audioOnly;
        await newRoom.localParticipant.setCameraEnabled(shouldEnableCamera);
        setVideoMuted(!shouldEnableCamera); // Set video muted state based on call type
        console.log(`📡 Audio enabled, camera ${shouldEnableCamera ? 'enabled' : 'disabled'} (audioOnly: ${callData.audioOnly})`);
      } catch (trackError) {
        console.error('❌ Error enabling tracks:', trackError);
        // Continue even if track enabling fails
      }

    } catch (error) {
      console.error('❌ Failed to connect to LiveKit:', error);
      setError('No se pudo conectar a la videollamada');
    }
  };

  const leaveCall = async () => {
    showAlert({
      title: 'Salir de la llamada',
      message: '¿Estás seguro de que quieres salir de esta llamada?',
      type: 'warning',
      buttons: [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Salir',
          style: 'destructive',
          onPress: async () => {
            try {
              if (roomRef.current) {
                roomRef.current.disconnect();
              }
              if (callId) {
                await callService.leaveCall(callId);
                console.log('✅ Left call successfully - backend will end call automatically if last person');
              }
              router.back();
            } catch (error) {
              console.error('Failed to leave call:', error);
              router.back();
            }
          },
        },
      ]
    });
  };

  // Removed the endCall function - everyone just leaves, last person ends the call automatically

  const toggleMute = async () => {
    if (room && room.localParticipant) {
      try {
        await room.localParticipant.setMicrophoneEnabled(micMuted);
        setMicMuted(!micMuted);
        console.log('🎤 Microphone toggled:', !micMuted);
      } catch (error) {
        console.error('Failed to toggle microphone:', error);
      }
    }
  };

  const toggleCamera = async () => {
    if (room && room.localParticipant) {
      try {
        await room.localParticipant.setCameraEnabled(videoMuted);
        setVideoMuted(!videoMuted);
        console.log('📹 Camera toggled:', !videoMuted);
      } catch (error) {
        console.error('Failed to toggle camera:', error);
      }
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.tint} />
          <Text style={[styles.loadingText, { color: theme.text }]}>
            Conectando a la llamada...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !token || !call) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#F44336" />
          <Text style={[styles.errorText, { color: theme.text }]}>
            {error || 'No se pudo cargar la llamada'}
          </Text>
          <TouchableOpacity 
            style={[styles.retryButton, { backgroundColor: theme.tint }]}
            onPress={() => {
              setError(null);
              setIsLoading(true);
              joinCall();
            }}
          >
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#000' }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: 'rgba(0,0,0,0.3)' }]}>
        <Text style={styles.headerTitle}>
          Llamada en curso
        </Text>
        <Text style={styles.connectionStatus}>
          {participants.length + 1} participante(s)
        </Text>
      </View>

      {/* Video Area */}
      <View style={styles.participantsContainer}>
        {isConnected ? (
          (() => {
            const totalParticipants = 1 + participants.length; // 1 for local + remote participants
            const isSmallGroup = totalParticipants <= 2;
            const videoContainerStyle = isSmallGroup ? styles.videoContainerLarge : styles.videoContainer;
            const videoGridStyle = isSmallGroup ? styles.videoGridSmall : styles.videoGrid;
            const personIconSize = isSmallGroup ? 60 : 40;
            
            return (
              <View style={videoGridStyle}>
                {/* Local video */}
                <View style={videoContainerStyle}>
                  {localVideoTrack && room?.localParticipant && !videoMuted ? (
                      <>
                        <VideoTrack style={styles.video} trackRef={{ participant: room.localParticipant, publication: localVideoTrack, source: Track.Source.Camera }} />
                        <Text style={styles.videoLabel}>{room ? getDisplayName(room.localParticipant, getCurrentUserId()) : 'You'}</Text>
                      </>
                  ) : (
                    <View style={[styles.video, { backgroundColor: '#333' }]}>
                      <Ionicons name="person" size={personIconSize} color="#FFF" />
                      <Text style={styles.videoLabel}>{room ? getDisplayName(room.localParticipant, getCurrentUserId()) + ' (Sin video)' : 'Tú (Sin video)'}</Text>
                    </View>
                  )}
                </View>
                
                {/* Remote videos */}
                {remoteVideoTracks.filter(remoteVideo => isVideoTrackEnabled(remoteVideo.publication)).map((remoteVideo, index) => (
                  <View key={`${remoteVideo.participant.identity}-${index}`} style={videoContainerStyle}>
                    <VideoTrack 
                      style={styles.video} 
                      trackRef={{ participant: remoteVideo.participant, publication: remoteVideo.publication, source: Track.Source.Camera }} 
                    />
                    <Text style={styles.videoLabel}>{getDisplayName(remoteVideo.participant, getCurrentUserId())}</Text>
                  </View>
                ))}
                
                {/* Participants without video */}
                {participants.filter(p => 
                  !remoteVideoTracks.some(rv => 
                    rv.participant.identity === p.identity && isVideoTrackEnabled(rv.publication)
                  )
                ).map((participant) => (
                  <View key={participant.identity} style={videoContainerStyle}>
                    <View style={[styles.video, { backgroundColor: '#555' }]}>
                      <Ionicons name="person" size={personIconSize} color="#FFF" />
                      <Text style={styles.videoLabel}>{getDisplayName(participant, getCurrentUserId())} (Sin video)</Text>
                    </View>
                  </View>
                ))}
              </View>
            );
          })()
        ) : (
          <View style={styles.noVideoContainer}>
            <Ionicons name="videocam-off" size={80} color="#FFF" />
            <Text style={styles.noVideoText}>
              Conectando al video...
            </Text>
          </View>
        )}
      </View>

      {/* Controls */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity 
          style={[styles.controlButton, micMuted && styles.controlButtonMuted]}
          onPress={toggleMute}
          disabled={!isConnected}
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
          disabled={!isConnected}
        >
          <Ionicons 
            name={videoMuted ? "videocam-off" : "videocam"} 
            size={24} 
            color={videoMuted ? "#F44336" : "#FFF"} 
          />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.controlButton, styles.leaveButton]}
          onPress={leaveCall}
        >
          <Ionicons name="call" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>
      
      <CustomAlert {...alertConfig} onDismiss={hideAlert} />
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  connectedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    backgroundColor: 'rgba(76,175,80,0.1)',
    margin: 20,
    borderRadius: 12,
  },
  connectedText: {
    color: '#4CAF50',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  connectedSubText: {
    color: '#81C784',
    fontSize: 14,
    marginTop: 8,
  },
  participantsList: {
    color: '#FFF',
    fontSize: 12,
    marginTop: 16,
    textAlign: 'center',
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
  noVideoText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
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
  videoGrid: {
    flex: 1,
    padding: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoGridSmall: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 15,
  },
  videoContainer: {
    width: '45%',
    aspectRatio: 4/3,
    margin: 5,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  videoContainerLarge: {
    width: '85%',
    aspectRatio: 16/9,
    margin: 10,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    maxHeight: height * 0.4,
  },
  video: {
    width: '100%',
    height: '100%',
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoLabel: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
});