import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import { chatService, Conversation } from '@/services/chatService';
import { UserService, UserSearchResult } from '@/services/userService';
import { useUser } from '@/contexts/UserContext';

// Define types for the items
type ChatItem = {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  type: 'direct';
  partner: {
    id: string;
    nombre: string;
    apellidos: string;
    status: string;
  };
};

export default function MessagesScreen() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const router = useRouter();
  const { getCurrentUserId } = useUser();
  
  const [nameFocused, setNameFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const messageListenerRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    initializeChat();
    
    return () => {
      // Cleanup message listener
      if (messageListenerRef.current) {
        messageListenerRef.current();
      }
    };
  }, []);

  // Refresh conversations when screen comes into focus (returning from chat)
  useFocusEffect(
    useCallback(() => {
      if (isConnected) {
        loadConversations();
      }
    }, [isConnected])
  );

  const initializeChat = async () => {
    try {
      setIsLoading(true);
      
      // Debug current user
      const currentUserId = getCurrentUserId();
      console.log('🔍 SIMPLE DEBUG - Current user ID:', currentUserId);
      
      // Connect to chat service
      if (!chatService.connected) {
        await chatService.connect();
      }
      
      // Load conversations
      await loadConversations();
      
      // Set up real-time message listener to update conversations
      setupMessageListener();
      
      setIsConnected(true);
    } catch (error) {
      console.error('Failed to initialize chat:', error);
      Alert.alert('Error', 'Failed to connect to chat. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const setupMessageListener = () => {
    // Listen for new messages to update conversation list
    const unsubscribe = chatService.onMessage((message) => {
      console.log('📨 New message received, updating conversations...');
      
      // Update conversations to show latest message
      setConversations(prev => {
        const updated = [...prev];
        const conversationIndex = updated.findIndex(conv => {
          if (conv.type === 'direct' && conv.partner) {
            // Check if this message is for this conversation
            const currentUserId = getCurrentUserId();
            return (message.senderId === conv.partner.id && message.recipientId === currentUserId) ||
                   (message.senderId === currentUserId && message.recipientId === conv.partner.id);
          }
          return false;
        });

        if (conversationIndex >= 0) {
          // Update existing conversation
          updated[conversationIndex] = {
            ...updated[conversationIndex],
            lastMessage: {
              id: message.id,
              content: message.content,
              senderId: message.senderId || '',
              senderName: message.senderName,
              createdAt: message.createdAt,
              isRead: message.isRead
            }
          };
          
          // Move updated conversation to top
          const updatedConv = updated.splice(conversationIndex, 1)[0];
          updated.unshift(updatedConv);
        } else if (message.senderId !== getCurrentUserId()) {
          // New conversation from someone messaging us
          const newConversation: Conversation = {
            type: 'direct',
            partner: {
              id: message.senderId || '',
              nombre: message.senderName?.split(' ')[0] || 'Unknown',
              apellidos: message.senderName?.split(' ').slice(1).join(' ') || '',
              status: 'online'
            },
            lastMessage: {
              id: message.id,
              content: message.content,
              senderId: message.senderId || '',
              senderName: message.senderName,
              createdAt: message.createdAt,
              isRead: message.isRead
            }
          };
          updated.unshift(newConversation);
        }

        return updated;
      });
    });

    messageListenerRef.current = unsubscribe;
  };

  const loadConversations = async () => {
    try {
      const convs = await chatService.getConversations();
      console.log('📥 Loaded conversations:', JSON.stringify(convs, null, 2));
      
      // Filter only direct conversations
      const directConversations = convs.filter(conv => conv.type === 'direct');
      setConversations(directConversations);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      const results = await UserService.searchUsers(query.trim());
      setSearchResults(results.users);
    } catch (error) {
      console.error('Failed to search users:', error);
      Alert.alert('Error', 'Failed to search users. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const openChat = (chatId: string, chatType: 'direct' | 'project', chatName: string) => {
    console.log('🔗 Opening chat:', {
      chatId,
      chatType,
      chatName,
      currentUserId: getCurrentUserId()
    });
    
    router.push({
      pathname: '/chat/[chatId]',
      params: {
        chatId,
        chatType,
        chatName
      }
    });
  };

  const startDirectChat = (user: UserSearchResult) => {
    const chatName = `${user.nombre} ${user.apellidos}`;
    openChat(user.id, 'direct', chatName);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffHours < 1) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays < 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const renderChatItem = ({ item }: { item: Conversation }) => {
    if (item.type !== 'direct' || !item.partner) return null;
    
    const partnerName = `${item.partner.nombre} ${item.partner.apellidos}`;
    const lastMessageTime = item.lastMessage ? formatTime(item.lastMessage.createdAt) : '';
    const currentUserId = getCurrentUserId();
    
    // Show unread indicator only if there's a message from the OTHER person that's unread
    const hasUnreadFromOther = item.lastMessage && 
                               !item.lastMessage.isRead && 
                               item.lastMessage.senderId !== currentUserId;
    
    return (
      <TouchableOpacity 
        style={[styles.chatItem, { borderBottomColor: colorScheme === 'dark' ? theme.background : theme.card }]}
        onPress={() => openChat(item.partner!.id, 'direct', partnerName)}
      >
        <View style={[styles.chatAvatarPlaceholder, { backgroundColor: theme.chatAvatar }]}>
          <Text style={[styles.chatInitial, { color: theme.card }]}>{partnerName[0]}</Text>
        </View>
        <View style={styles.chatDetails}>
          <Text style={[styles.chatName, { color: theme.text }]} numberOfLines={1} ellipsizeMode="tail">
            {partnerName}
          </Text>
          <Text style={[styles.lastMessage, { color: theme.gray }]} numberOfLines={1}>
            {item.lastMessage?.content || 'No messages yet'}
          </Text>
          <View style={styles.chatMeta}>
            <Text style={[styles.messageTime, { color: theme.gray }]}>{lastMessageTime}</Text>
          </View>
        </View>
        {hasUnreadFromOther && (
          <View style={[styles.unreadIndicator, { backgroundColor: theme.primary }]} />
        )}
      </TouchableOpacity>
    );
  };

  const renderSearchResult = ({ item }: { item: UserSearchResult }) => (
    <TouchableOpacity 
      style={[styles.chatItem, { borderBottomColor: colorScheme === 'dark' ? theme.background : theme.card }]}
      onPress={() => startDirectChat(item)}
    >
      <View style={[styles.chatAvatarPlaceholder, { backgroundColor: theme.chatAvatar }]}>
        <Text style={[styles.chatInitial, { color: theme.card }]}>{item.nombre[0]}</Text>
      </View>
      <View style={styles.chatDetails}>
        <Text style={[styles.chatName, { color: theme.text }]}>{item.fullName}</Text>
        <Text style={[styles.lastMessage, { color: theme.gray }]}>{item.email}</Text>
        <View style={styles.chatMeta}>
          <Text style={[styles.messageTime, { color: theme.gray }]}>{item.status}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.safeAreaContainer, { backgroundColor: colorScheme === 'dark' ? theme.card : theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>Mensajes</Text>

      <TextInput
        style={[styles.searchInput, { 
          backgroundColor: theme.inputBackground, 
          color: theme.text, 
          borderColor: nameFocused ? 
          theme.orange : theme.gray 
        }]}
        placeholder="Buscar usuarios..."
        placeholderTextColor={theme.gray}
        value={searchQuery}
        onChangeText={handleSearch}
        onFocus={() => setNameFocused(true)}
        onBlur={() => setNameFocused(false)}
      />
      {isSearching && (
        <ActivityIndicator size="small" color={theme.primary} style={styles.searchLoader} />
      )}

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.text }]}>Cargando conversaciones...</Text>
        </View>
      ) : searchQuery.length >= 2 ? (
        <FlatList
          data={searchResults}
          renderItem={renderSearchResult}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: theme.gray }]}>
                {isSearching ? 'Buscando...' : 'No se encontraron usuarios'}
              </Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderChatItem}
          keyExtractor={(item) => `chat-${item.partner?.id || Math.random()}`}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: theme.gray }]}>
                No tienes conversaciones aún. Busca usuarios para empezar a chatear.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
    paddingHorizontal: 10,
  },
  container: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    marginTop: 10,
    paddingLeft: 10,
  },
  searchInput: {
    height: 50,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    fontSize: 16,
    marginBottom: 15
  },
  listContent: {
    paddingBottom: 10,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    position: 'relative',
  },
  chatAvatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatInitial: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  chatDetails: {
    flex: 1,
    marginRight: 24, // Space for unread indicator
  },
  chatName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  lastMessage: {
    fontSize: 14,
    marginTop: 2,
  },
  chatMeta: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  messageTime: {
    fontSize: 12,
  },
  unreadIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    position: 'absolute',
    right: 0,
    top: '50%',
    marginTop: 6, // Slightly higher than center for better visual balance
  },
  searchLoader: {
    position: 'absolute',
    right: 16,
    top: 15,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
}); 