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
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { chatService, Message } from '@/services/chatService';
import { UserSearchResult } from '@/services/userService';
import { useUser } from '@/contexts/UserContext';
import { DebugService } from '@/services/debugService';

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

  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

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
        setMessages(prev => [message, ...prev]);
        scrollToBottom();
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
          console.log(`📖 Marked ${result.markedCount} messages as read`);
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
    console.log(`📤 SENDING: User ${currentUserId} → User ${chatId}`);
    console.log(`📤 MESSAGE: "${messageContent}"`);
    
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

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const currentUserId = getCurrentUserId();
    // Handle both WebSocket and REST API formats
    const messageSenderId = item.senderId || item.sender?.id;
    const isOwnMessage = messageSenderId === currentUserId;
    const senderDisplayName = item.senderName || (item.sender ? `${item.sender.nombre} ${item.sender.apellidos}` : '');

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
            ? `Someone is typing...` 
            : `${typingUsers.length} people are typing...`
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
          <Text style={[styles.loadingText, { color: theme.text }]}>Connecting to chat...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.gray + '30' }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>
            {chatName}
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.gray }]}>
            {isConnected ? 'Online' : 'Connecting...'}
          </Text>
        </View>
        <View style={styles.headerActions}>
          {chatType === 'direct' && (
            <TouchableOpacity style={styles.headerButton}>
              <Ionicons name="call" size={20} color={theme.text} />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="videocam" size={20} color={theme.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="ellipsis-vertical" size={20} color={theme.text} />
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
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
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
}); 