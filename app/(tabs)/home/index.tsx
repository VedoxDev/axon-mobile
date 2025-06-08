import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import { chatService, Conversation } from '@/services/chatService';
import { UserService, UserSearchResult } from '@/services/userService';
import { useUser } from '@/contexts/UserContext';
import NewChatModal from './NewChatModal';

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
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [directChats, setDirectChats] = useState<Conversation[]>([]);
  const [projectChats, setProjectChats] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'chats' | 'proyectos'>('chats');

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
          } else if (conv.type === 'project' && conv.project) {
            // Check if this message is for this project
            return message.projectId === conv.project.id;
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
      
      // Also update separated conversations for real-time updates
      setConversations(prev => {
        const updated = [...prev];
        const conversationIndex = updated.findIndex(conv => {
          if (conv.type === 'direct' && conv.partner) {
            const currentUserId = getCurrentUserId();
            return (message.senderId === conv.partner.id && message.recipientId === currentUserId) ||
                   (message.senderId === currentUserId && message.recipientId === conv.partner.id);
          } else if (conv.type === 'project' && conv.project) {
            return message.projectId === conv.project.id;
          }
          return false;
        });

        if (conversationIndex >= 0) {
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
          
          const updatedConv = updated.splice(conversationIndex, 1)[0];
          updated.unshift(updatedConv);
        }

        separateConversations(updated);
        return updated;
      });
    });

    messageListenerRef.current = unsubscribe;
  };

  const separateConversations = (convs: Conversation[]) => {
    const direct = convs.filter(conv => conv.type === 'direct');
    const projects = convs.filter(conv => conv.type === 'project');
    
    setDirectChats(direct);
    setProjectChats(projects);
  };

  const loadConversations = async () => {
    try {
      const convs = await chatService.getConversations();
      console.log('📥 Loaded conversations:', JSON.stringify(convs, null, 2));
      
      // Show both direct and project conversations
      setConversations(convs);
      setFilteredConversations(convs);
      separateConversations(convs);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    if (query.trim().length === 0) {
      setFilteredConversations([]);
      return;
    }

    // Filter based on active tab
    const sourceData = activeTab === 'chats' ? directChats : projectChats;
    const filtered = sourceData.filter(conv => {
      if (conv.type === 'direct' && conv.partner) {
        const partnerName = `${conv.partner.nombre} ${conv.partner.apellidos}`.toLowerCase();
        return partnerName.includes(query.toLowerCase());
      } else if (conv.type === 'project' && conv.project) {
        const projectName = conv.project.name.toLowerCase();
        return projectName.includes(query.toLowerCase());
      }
      return false;
    });
    
    setFilteredConversations(filtered);
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
    const currentUserId = getCurrentUserId();
    const lastMessageTime = item.lastMessage ? formatTime(item.lastMessage.createdAt) : '';
    
    if (item.type === 'direct' && item.partner) {
      const partnerName = `${item.partner.nombre} ${item.partner.apellidos}`;
      
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
    } else if (item.type === 'project' && item.project) {
      const projectName = item.project.name;
      
      // Show unread indicator for any unread project message
      const hasUnreadMessage = item.lastMessage && !item.lastMessage.isRead;
      
      return (
        <TouchableOpacity 
          style={[styles.chatItem, { borderBottomColor: colorScheme === 'dark' ? theme.background : theme.card }]}
          onPress={() => openChat(item.project!.id, 'project', projectName)}
        >
          <View style={[styles.chatAvatarPlaceholder, { backgroundColor: theme.groupAvatar }]}>
            <Ionicons name="people" size={24} color={theme.card} />
          </View>
          <View style={styles.chatDetails}>
            <Text style={[styles.chatName, { color: theme.text }]} numberOfLines={1} ellipsizeMode="tail">
              {projectName}
            </Text>
            <Text style={[styles.lastMessage, { color: theme.gray }]} numberOfLines={1}>
              {item.lastMessage?.content || 'Sin mensajes aún'}
            </Text>
            <View style={styles.chatMeta}>
              <Text style={[styles.messageTime, { color: theme.gray }]}>{lastMessageTime}</Text>
            </View>
          </View>
          {hasUnreadMessage && (
            <View style={[styles.unreadIndicator, { backgroundColor: theme.primary }]} />
          )}
        </TouchableOpacity>
      );
    }
    
    return null;
  };

  const renderTabButtons = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[
          styles.tabButton,
          activeTab === 'chats' && styles.activeTab,
          { borderBottomColor: activeTab === 'chats' ? theme.primary : 'transparent' }
        ]}
        onPress={() => {
          setActiveTab('chats');
          setSearchQuery('');
          setFilteredConversations([]);
        }}
      >
        <Text style={[
          styles.tabText,
          { color: activeTab === 'chats' ? theme.primary : theme.gray }
        ]}>
          Chats ({directChats.length})
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          styles.tabButton,
          activeTab === 'proyectos' && styles.activeTab,
          { borderBottomColor: activeTab === 'proyectos' ? theme.primary : 'transparent' }
        ]}
        onPress={() => {
          setActiveTab('proyectos');
          setSearchQuery('');
          setFilteredConversations([]);
        }}
      >
        <Text style={[
          styles.tabText,
          { color: activeTab === 'proyectos' ? theme.primary : theme.gray }
        ]}>
          Proyectos ({projectChats.length})
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safeAreaContainer, { backgroundColor: colorScheme === 'dark' ? theme.card : theme.background }]} edges={['left', 'right', 'bottom']}>
      <View style={styles.titleContainer}>
        <Text style={[styles.title, { color: theme.text }]}>Mensajes</Text>
        <TouchableOpacity 
          style={[styles.newChatButton, { backgroundColor: theme.primary }]}
          onPress={() => setShowNewChatModal(true)}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <TextInput
        style={[styles.searchInput, { 
          backgroundColor: theme.inputBackground, 
          color: theme.text, 
          borderColor: nameFocused ? 
          theme.orange : theme.gray 
        }]}
        placeholder="Buscar conversaciones..."
        placeholderTextColor={theme.gray}
        value={searchQuery}
        onChangeText={handleSearch}
        onFocus={() => setNameFocused(true)}
        onBlur={() => setNameFocused(false)}
      />
      
      {renderTabButtons()}
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.text }]}>Cargando conversaciones...</Text>
        </View>
      ) : searchQuery.length > 0 ? (
        <FlatList
          data={filteredConversations}
          renderItem={renderChatItem}
          keyExtractor={(item) => {
            if (item.type === 'direct' && item.partner) {
              return `search-direct-${item.partner.id}`;
            } else if (item.type === 'project' && item.project) {
              return `search-project-${item.project.id}`;
            }
            return `search-chat-${Math.random()}`;
          }}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: theme.gray }]}>
                No se encontraron conversaciones con ese nombre
              </Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={activeTab === 'chats' ? directChats : projectChats}
          renderItem={renderChatItem}
          keyExtractor={(item) => {
            if (item.type === 'direct' && item.partner) {
              return `tab-direct-${item.partner.id}`;
            } else if (item.type === 'project' && item.project) {
              return `tab-project-${item.project.id}`;
            }
            return `tab-chat-${Math.random()}`;
          }}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: theme.gray }]}>
                {activeTab === 'chats' 
                  ? 'No tienes chats directos aún. Toca el botón + para iniciar un chat.'
                  : 'No tienes chats de proyectos aún.'
                }
              </Text>
            </View>
          }
        />
      )}
      
      <NewChatModal
        visible={showNewChatModal}
        onClose={() => setShowNewChatModal(false)}
        onStartChat={startDirectChat}
        theme={theme}
      />
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
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
    marginTop: 10,
    paddingLeft: 10,
    paddingRight: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  newChatButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
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
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    marginBottom: 10,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
  },
}); 