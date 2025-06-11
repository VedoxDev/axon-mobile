import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { chatService, Message } from '@/services/chatService';
import { UserSearchResult } from '@/services/userService';
import { useUser } from '@/contexts/UserContext';
import { DebugService } from '@/services/debugService';
import { callService } from '@/services/callService';
import { API_BASE_URL } from '@/config/apiConfig';

export default function ChatScreen() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const router = useRouter();
  const { getCurrentUserId } = useUser();
  const { chatId, chatType, chatName } = useLocalSearchParams<{
    chatId: string;
    chatType: 'direct' | 'project';
    chatName: string;
  }>();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [callStatuses, setCallStatuses] = useState<{[key: string]: string}>({});
  const [callTypes, setCallTypes] = useState<{[key: string]: boolean}>({});

  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Helper function to get auth headers
  const getAuthHeaders = async () => {
    const token = await AsyncStorage.getItem('access_token');
    if (!token) {
      throw new Error('No authentication token found');
    }
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  };

  useEffect(() => {
    initializeChat();

    return () => {
      // Clean up typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [chatId, chatType]); // eslint-disable-line react-hooks/exhaustive-deps

  const initializeChat = async () => {
    try {

      
      // Connect to chat service if not connected
      if (!chatService.connected) {
        await chatService.connect();
      }

      // Join project room if it's a project chat
      if (chatType === 'project') {
        chatService.joinProject(chatId);
      }

      // Load message history
      await loadMessageHistory();

      // Set up event listeners
      setupEventListeners();

      setIsConnected(true);
    } catch (error) {
      console.error('Failed to initialize chat:', error);
      Alert.alert('Error', 'Failed to connect to chat. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const setupEventListeners = () => {
    // Listen for new messages
    const unsubscribeMessage = chatService.onMessage((message: Message) => {
      const currentUserId = getCurrentUserId();
      
      // Only add messages for this conversation
      let isRelevantMessage = false;
      
      if (chatType === 'direct') {
        // For direct messages, check if this message is between current user and the other person (chatId)
        isRelevantMessage = 
          (message.senderId === currentUserId && message.recipientId === chatId) ||
          (message.senderId === chatId && message.recipientId === currentUserId);
      } else if (chatType === 'project') {
        // For project messages, check if it's for this project
        isRelevantMessage = message.projectId === chatId;
      }

      if (isRelevantMessage) {
        setMessages(prev => {
          // Check if message already exists to prevent duplicates
          const messageExists = prev.some(existingMsg => existingMsg.id === message.id);
          if (messageExists) {
            return prev; // Don't add duplicate
          }
          return [message, ...prev];
        });
        scrollToBottom();
        
                         // 📞 Check if this is a call invitation and show alert
        console.log('🔍 DEBUGGING CALL INVITATION LOGIC:');
        console.log('isCallInvitation:', isCallInvitation(message.content));
        console.log('message.senderId:', message.senderId);
        console.log('currentUserId:', currentUserId);
        console.log('senderId !== currentUserId:', message.senderId !== currentUserId);
        
        if (isCallInvitation(message.content) && message.senderId !== currentUserId) {
           console.log('📞 INCOMING CALL INVITATION:');
           console.log('Message content:', message.content);
           console.log('Full message object:', JSON.stringify(message, null, 2));
           
           // Check if call ID is in message metadata
           console.log('🔍 Checking for callId in metadata:', message.callId);
           console.log('🔍 Message keys:', Object.keys(message));
           
           const callId = message.callId;
          
          if (callId) {
            Alert.alert(
              'Invitación de llamada',
              message.content,
              [
                { text: 'Rechazar', style: 'cancel' },
                { 
                  text: 'Unirse', 
                  onPress: () => {
                    console.log('🎥 Joining call from notification:', callId);
                    router.push(`/call/${callId}` as any);
                  }
                }
              ]
            );
          } else {
            console.log('❌ No call ID found in message or metadata');
            // Still show the alert but with manual input option
            Alert.alert(
              'Invitación de llamada',
              message.content + '\n\n(ID de llamada no encontrado - entrada manual disponible)',
              [
                { text: 'Rechazar', style: 'cancel' },
                { 
                  text: 'Unirse manualmente', 
                  onPress: () => joinCallFromInvitation(message.content)
                }
              ]
            );
          }
        }
      }
    });

    // Listen for typing indicators
    const unsubscribeTyping = chatService.onTyping((data) => {
      if (data.typing) {
        setTypingUsers(prev => [...prev.filter(id => id !== data.userId), data.userId]);
      } else {
        setTypingUsers(prev => prev.filter(id => id !== data.userId));
      }
    });

    // Store cleanup functions (you might want to store these in a ref for cleanup)
    return () => {
      unsubscribeMessage();
      unsubscribeTyping();
    };
  };

  const loadMessageHistory = async () => {
    try {
      let messageHistory: Message[] = [];
      
      if (chatType === 'direct') {
        messageHistory = await chatService.getDirectMessageHistory(chatId);
        // Mark incoming messages as read when opening chat
        const result = await chatService.markMessagesAsRead(chatId);
        if (result.markedCount > 0) {
          // console.log(`📖 Marked ${result.markedCount} messages as read`);
        }
      } else if (chatType === 'project') {
        messageHistory = await chatService.getProjectMessageHistory(chatId);
      }

      // Sort messages by date (newest first for FlatList with inverted)
      messageHistory.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setMessages(messageHistory);
    } catch (error) {
      console.error('Failed to load message history:', error);
      Alert.alert('Error', 'Failed to load messages. Please try again.');
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isSending) return;

    const messageContent = inputMessage.trim();
    const currentUserId = getCurrentUserId();
    
    // Simple debug: Who is sending to whom
    // console.log(`📤 SENDING: User ${currentUserId} → User ${chatId}`);
    // console.log(`📤 MESSAGE: "${messageContent}"`);
    
    if (currentUserId === chatId) {
      console.log('🚨 WARNING: Trying to send message to yourself!');
    }

    setInputMessage('');
    setIsSending(true);

    // Stop typing indicator
    if (isTyping) {
      stopTyping();
    }

          try {
        if (chatType === 'direct') {
          chatService.sendDirectMessage(chatId, messageContent);
        } else if (chatType === 'project') {
          chatService.sendProjectMessage(chatId, messageContent);
        }
      } catch (error) {
        console.error('❌ Failed to send message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
      setInputMessage(messageContent); // Restore message if failed
    } finally {
      setIsSending(false);
    }
  };

  const handleInputChange = (text: string) => {
    setInputMessage(text);

    // Handle typing indicators
    if (text.length > 0 && !isTyping) {
      startTyping();
    }

    // Reset typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        stopTyping();
      }
    }, 1000);
  };

  const startTyping = () => {
    setIsTyping(true);
    if (chatType === 'direct') {
      chatService.startTyping(chatId);
    } else if (chatType === 'project') {
      chatService.startTyping(undefined, chatId);
    }
  };

  const stopTyping = () => {
    setIsTyping(false);
    if (chatType === 'direct') {
      chatService.stopTyping(chatId);
    } else if (chatType === 'project') {
      chatService.stopTyping(undefined, chatId);
    }
  };

  const scrollToBottom = () => {
    if (flatListRef.current && messages.length > 0) {
      try {
        flatListRef.current.scrollToIndex({ index: 0, animated: true });
      } catch (error) {
        // Fallback to scrollToOffset if scrollToIndex fails
        flatListRef.current.scrollToOffset({ offset: 0, animated: true });
      }
    }
  };

  const startCall = async (audioOnly: boolean) => {
    try {
      console.log('🚀 STARTING CALL DEBUG:');
      console.log('chatType:', chatType);
      console.log('chatId:', chatId);
      console.log('audioOnly:', audioOnly);
      
      if (chatType === 'direct') {
        // Start direct call
        const { call } = await callService.startDirectCall(
          chatId,
          audioOnly ? 'Audio call' : 'Video call',
          audioOnly
        );
        
        console.log('✅ Direct call created:', call);
        console.log('✅ Call ID to navigate to:', call.id);
        console.log('✅ Call ID type:', typeof call.id);
        console.log('✅ Navigation URL:', `/call/${call.id}`);
        
        // Navigate to call screen
        router.push(`/call/${call.id}` as any);
      } else if (chatType === 'project') {
        // Start project call
        const { call } = await callService.startProjectCall(
          chatId,
          audioOnly ? 'Project audio meeting' : 'Project video meeting',
          10, // max participants
          audioOnly
        );
        
        console.log('✅ Project call created:', call);
        console.log('✅ Call ID to navigate to:', call.id);
        console.log('✅ Call ID type:', typeof call.id);
        console.log('✅ Navigation URL:', `/call/${call.id}`);
        
        // Navigate to call screen
        router.push(`/call/${call.id}` as any);
      }
    } catch (error) {
      console.error('❌ Failed to start call:', error);
      Alert.alert('Error', 'Failed to start call. Please try again.');
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // 📞 Extract call ID from call invitation message
  const extractCallId = (messageContent: string): string | null => {
    // console.log('🔍 EXTRACTING CALL ID:');
    // console.log('Raw message:', JSON.stringify(messageContent));
    // console.log('Message preview:', messageContent.substring(0, 100) + '...');
    
    // Try multiple patterns
    const patterns = [
      // Standard UUID pattern
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
      // callId: pattern
      /callId[:\s]*([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/gi,
      // call/ pattern (from URLs)
      /call\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/gi,
      // Any UUID-like pattern with more flexibility
      /([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/gi
    ];
    
    for (let i = 0; i < patterns.length; i++) {
      const pattern = patterns[i];
      // console.log(`🔍 Trying pattern ${i + 1}:`, pattern.source);
      
      const matches = messageContent.match(pattern);
      // console.log(`🔍 Pattern ${i + 1} matches:`, matches);
      
      if (matches && matches.length > 0) {
        const callId = matches[0].includes('-') ? matches[0] : matches[1];
        console.log('✅ Found call ID:', callId);
        return callId;
      }
    }
    
    console.log('❌ No call ID found in message');
    
    // Last resort: look for any long alphanumeric string that might be an ID
    const fallbackPattern = /[a-f0-9]{32,}/gi;
    const fallbackMatch = messageContent.match(fallbackPattern);
    // console.log('🔍 Fallback pattern match:', fallbackMatch);
    
    return fallbackMatch ? fallbackMatch[0] : null;
  };

  // 📞 Check if message is a call invitation
  const isCallInvitation = (messageContent: string): boolean => {
    return messageContent.includes('📞') || messageContent.toLowerCase().includes('call') || messageContent.toLowerCase().includes('meeting');
  };

  // 📞 Handle joining call from invitation
  const joinCallFromInvitation = async (messageContent: string, callId?: string) => {
    const extractedCallId = callId || extractCallId(messageContent);
    if (extractedCallId) {
      try {
        console.log('🎥 Checking call status before joining:', extractedCallId);
        
        // First check if call is still active
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_BASE_URL}/calls/join/${extractedCallId}`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ audioOnly: false })
        });
        
        if (response.ok) {
          const { call } = await response.json();
          
          if (call.status === 'active') {
            console.log('✅ Call is active, joining:', extractedCallId);
            router.push(`/call/${extractedCallId}` as any);
          } else {
            console.log('⚠️ Call exists but not active, status:', call.status);
            Alert.alert(
              'Call Unavailable',
              `This call has ${call.status === 'ended' ? 'ended' : 'been cancelled'}.`,
              [{ text: 'OK' }]
            );
          }
        } else {
          // Handle different error status codes
          if (response.status === 404 || response.status === 400) {
            console.log('📞 Call not found or ended');
            Alert.alert(
              'Call Unavailable',
              'This call has ended or is no longer available.',
              [{ text: 'OK' }]
            );
          } else {
            console.log('❌ Unexpected error response:', response.status);
            throw new Error(`Server error: ${response.status}`);
          }
        }
      } catch (error: any) {
        console.log('❌ Network or parsing error:', error.message);
        
        // Don't show ugly errors for common cases
        if (error.message?.includes('Call not found') || error.message?.includes('404')) {
          Alert.alert(
            'Call Unavailable',
            'This call has ended or is no longer available.',
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert(
            'Connection Error',
            'Unable to check call status. Please check your internet connection.',
            [{ text: 'OK' }]
          );
        }
      }
    } else {
      console.log('❌ Could not extract call ID from invitation');
      Alert.alert('Error', 'Could not find call information.');
    }
  };

  // 📞 Check if a call invitation is still joinable and get call type
  const checkCallStatus = async (callId: string) => {
    if (callStatuses[callId]) return callStatuses[callId]; // Already checked
    
    try {
      const headers = await getAuthHeaders();
      
      // Since there might not be a status endpoint, try to join the call to check status
      // This will tell us if the call is available without actually joining
      const response = await fetch(`${API_BASE_URL}/calls/join/${callId}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ audioOnly: false })
      });
      
      if (response.ok) {
        const { call } = await response.json();
        setCallStatuses(prev => ({...prev, [callId]: call.status}));
        setCallTypes(prev => ({...prev, [callId]: call.audioOnly})); // Store if it's audio only
        return call.status;
      } else if (response.status === 404) {
        // Call not found or ended
        setCallStatuses(prev => ({...prev, [callId]: 'ended'}));
        return 'ended';
      } else if (response.status === 400) {
        // Call might be ended or cancelled
        setCallStatuses(prev => ({...prev, [callId]: 'ended'}));
        return 'ended';
      }
    } catch (error) {
      console.log('Could not check call status:', error);
    }
    
    setCallStatuses(prev => ({...prev, [callId]: 'unknown'}));
    return 'unknown';
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const currentUserId = getCurrentUserId();
    // Handle both WebSocket and REST API formats
    const messageSenderId = item.senderId || item.sender?.id;
    const isOwnMessage = messageSenderId === currentUserId;
    const senderDisplayName = item.senderName || (item.sender ? `${item.sender.nombre} ${item.sender.apellidos}` : '');
    const isCallInvite = isCallInvitation(item.content);
    const callId = item.callId;
    const callStatus = callId ? callStatuses[callId] : null;
    const isAudioOnly = callId ? callTypes[callId] : null;

    // Check call status when rendering (but only once per callId)
    if (isCallInvite && callId && !callStatus && !callStatuses[callId]) {
      // Don't block rendering, check asynchronously
      checkCallStatus(callId);
    }

    const getCallStatusText = (status: string | null) => {
      switch (status) {
        case 'active': return 'Activa';
        case 'ended': return 'Finalizada';
        case 'cancelled': return 'Cancelada';
        case 'unknown': return 'Desconocida';
        default: return null; // Don't show status while checking
      }
    };

    const isCallActive = callStatus === 'active';
    const showJoinButton = isCallInvite && ((isCallActive || !callStatus) && (!isOwnMessage || (isOwnMessage && isCallActive)));

    // Modern call invitation design
    if (isCallInvite) {
      return (
        <View style={[styles.messageContainer, isOwnMessage ? styles.ownMessage : styles.otherMessage]}>
                      <View style={[
              styles.callInvitationCard,
              {
                backgroundColor: theme.card,
                borderColor: isCallActive ? '#4CAF50' : (callStatus === 'ended' || callStatus === 'cancelled') ? '#9E9E9E' : theme.tint,
              }
            ]}>
              {/* Call Header */}
              <View style={styles.callInvitationHeader}>
                <View style={[
                  styles.callIconContainer,
                  { backgroundColor: isCallActive ? '#4CAF50' : (callStatus === 'ended' || callStatus === 'cancelled') ? '#9E9E9E' : theme.tint }
                ]}>
                  <Ionicons 
                    name="videocam" 
                    size={20} 
                    color="#fff" 
                  />
                </View>
                <View style={styles.callInvitationInfo}>
                  <Text style={[styles.callInvitationTitle, { color: theme.text }]}>
                    {isOwnMessage 
                      ? (isAudioOnly ? "Has iniciado una llamada" : "Has iniciado una videollamada")
                      : `${senderDisplayName || 'Alguien'} ha iniciado una ${isAudioOnly ? 'llamada' : 'videollamada'}`
                    }
                  </Text>
                  {callId && getCallStatusText(callStatus) && (
                    <Text style={[
                      styles.callInvitationSubtitle,
                      { 
                        color: isCallActive ? '#4CAF50' : (callStatus === 'ended' || callStatus === 'cancelled') ? '#9E9E9E' : theme.gray,
                      }
                    ]}>
                      {getCallStatusText(callStatus)}
                    </Text>
                  )}
                </View>
              </View>

              {/* Join Button - only for active calls or unknown status */}
              {showJoinButton && (
                <TouchableOpacity
                  style={[
                    styles.joinCallButtonModern, 
                    { 
                      backgroundColor: isCallActive ? '#4CAF50' : (callStatus === 'ended' || callStatus === 'cancelled') ? '#9E9E9E' : '#4CAF50',
                      marginTop: 12,
                    }
                  ]}
                  onPress={() => {
                    if (callStatus === 'ended' || callStatus === 'cancelled') {
                      Alert.alert(
                        'Llamada no disponible', 
                        `Esta llamada ha ${callStatus === 'ended' ? 'finalizado' : 'sido cancelada'}.`,
                        [{ text: 'OK' }]
                      );
                      return;
                    }

                    console.log('🎥 JOIN CALL BUTTON PRESSED');
                    
                    if (callId) {
                      console.log('✅ Found callId in metadata:', callId);
                      joinCallFromInvitation(item.content, callId);
                    } else {
                      console.log('❌ No callId in metadata, using extraction');
                      joinCallFromInvitation(item.content);
                    }
                  }}
                  disabled={callStatus === 'ended' || callStatus === 'cancelled'}
                >
                  <Ionicons 
                    name="videocam" 
                    size={18} 
                    color="#fff" 
                  />
                  <Text style={styles.joinCallButtonTextModern}>
                    {callStatus === 'ended' || callStatus === 'cancelled' 
                      ? 'Llamada finalizada' 
                      : (isOwnMessage ? 'Volver a la llamada' : 'Unirse')
                    }
                  </Text>
                </TouchableOpacity>
              )}

              {/* Timestamp */}
              <Text style={[styles.callTimestamp, { color: theme.gray }]}>
                {formatTime(item.createdAt)}
              </Text>
            </View>
        </View>
      );
    }

    // Regular message rendering
    return (
      <View style={[styles.messageContainer, isOwnMessage ? styles.ownMessage : styles.otherMessage]}>
        <View style={[
          styles.messageBubble,
          {
            backgroundColor: isOwnMessage ? theme.primary : theme.card,
          }
        ]}>
          {!isOwnMessage && chatType === 'project' && (
            <Text style={[styles.senderName, { color: theme.gray }]}>{senderDisplayName}</Text>
          )}
          <Text style={[
            styles.messageText,
            { color: isOwnMessage ? '#fff' : theme.text }
          ]}>
            {item.content}
          </Text>
          
          <Text style={[
            styles.messageTime,
            { color: isOwnMessage ? 'rgba(255,255,255,0.7)' : theme.gray }
          ]}>
            {formatTime(item.createdAt)}
          </Text>
        </View>
      </View>
    );
  };

  const renderTypingIndicator = () => {
    if (typingUsers.length === 0) return null;

    return (
      <View style={styles.typingContainer}>
        <Text style={[styles.typingText, { color: theme.gray }]}>
          {typingUsers.length === 1 
            ? `Alguien está escribiendo...` 
            : `${typingUsers.length} personas están escribiendo...`
          }
        </Text>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.text }]}>Conectando al chat...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.gray + '30' }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <View style={[styles.headerAvatar, { 
          backgroundColor: chatType === 'project' ? theme.orange : theme.primary + '20'
        }]}>
          {chatType === 'project' ? (
            <Text style={[styles.headerAvatarText, { color: '#fff' }]}>
              {chatName.charAt(0).toUpperCase()}
            </Text>
          ) : (
            <Text style={[styles.headerAvatarText, { color: theme.primary }]}>
              {chatName.split(' ').map(word => word.charAt(0)).join('').substring(0, 2).toUpperCase()}
            </Text>
          )}
        </View>
        <View style={styles.headerInfo}>
          <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>
            {chatName}
          </Text>
        </View>
        <View style={styles.headerActions}>
          {chatType === 'direct' && (
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={() => startCall(true)} // Audio only
            >
              <Ionicons name="call" size={20} color={theme.text} />
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => startCall(false)} // Video call
          >
            <Ionicons name="videocam" size={20} color={theme.text} />
          </TouchableOpacity>

        </View>
      </View>

      <KeyboardAvoidingView 
        style={styles.content} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          inverted
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyStateContainer}>
              <View style={[styles.emptyStateCard, { backgroundColor: theme.card }]}>
                <View style={[styles.emptyStateIcon, { backgroundColor: theme.primary + '20' }]}>
                  <Ionicons name="chatbubbles" size={48} color={theme.primary} />
                </View>
                <Text style={[styles.emptyStateTitle, { color: theme.text }]}>
                  ¡Sé el primero en escribir!
                </Text>
                <Text style={[styles.emptyStateMessage, { color: theme.gray }]}>
                  {chatType === 'direct' 
                    ? 'Empieza la conversación y rompe el hielo con un mensaje amigable.'
                    : 'Comparte ideas, actualiza al equipo o simplemente saluda para comenzar la colaboración.'
                  }
                </Text>
              </View>
            </View>
          }
        />

        {/* Typing Indicator */}
        {renderTypingIndicator()}

        {/* Input */}
        <View style={[styles.inputContainer, { backgroundColor: theme.card, borderTopColor: theme.gray + '30' }]}>
          <View style={[styles.inputWrapper, { backgroundColor: theme.inputBackground }]}>
            <TextInput
              style={[styles.textInput, { color: theme.text }]}
              value={inputMessage}
              onChangeText={handleInputChange}
              placeholder={`Mensaje a ${chatName.length > 15 ? chatName.substring(0, 15) + '...' : chatName}`}
              placeholderTextColor={theme.gray}
              multiline
            />
            <TouchableOpacity 
              style={[
                styles.sendButton,
                { 
                  backgroundColor: inputMessage.trim() ? theme.primary : '#C7C7CC',
                  opacity: isSending ? 0.5 : 1
                }
              ]}
              onPress={sendMessage}
              disabled={!inputMessage.trim() || isSending}
            >
              {isSending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="send" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
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
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    elevation: 2,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerAvatarText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 4,
  },
  headerButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messagesContent: {
    paddingVertical: 16,
  },
  messageContainer: {
    marginVertical: 4,
  },
  ownMessage: {
    alignItems: 'flex-end',
  },
  otherMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  typingContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  typingText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    maxHeight: 100,
    minHeight: 20,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  joinCallButtonModern: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
    gap: 6,
  },
  joinCallButtonTextModern: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  
     callInvitationCard: {
     padding: 16,
     borderWidth: 2,
     borderRadius: 16,
     width: '95%',
     maxWidth: '95%',
   },
  callInvitationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
     callIconContainer: {
     width: 40,
     height: 40,
     borderRadius: 20,
     justifyContent: 'center',
     alignItems: 'center',
   },
  callInvitationInfo: {
    flex: 1,
  },
  callInvitationTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  callInvitationSubtitle: {
    fontSize: 12,
  },
  
  callTimestamp: {
    fontSize: 11,
    marginTop: 8,
    alignSelf: 'flex-end',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 40,
  },
  emptyStateCard: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    maxWidth: 300,
    elevation: 2,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  emptyStateIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  emptyStateMessage: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
}); 