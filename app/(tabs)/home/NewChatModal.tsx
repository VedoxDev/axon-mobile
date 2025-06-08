import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UserService, UserSearchResult } from '@/services/userService';

interface NewChatModalProps {
  visible: boolean;
  onClose: () => void;
  onStartChat: (user: UserSearchResult) => void;
  theme: any;
}

export default function NewChatModal({ 
  visible, 
  onClose, 
  onStartChat,
  theme 
}: NewChatModalProps) {
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);

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

  const handleStartChat = (user: UserSearchResult) => {
    onStartChat(user);
    onClose();
    // Reset modal state
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleClose = () => {
    onClose();
    // Reset modal state
    setSearchQuery('');
    setSearchResults([]);
  };
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
        <View style={[styles.modalHeader, { borderBottomColor: theme.separator }]}>
          <TouchableOpacity onPress={handleClose} style={[styles.modalCloseButton, { backgroundColor: theme.inputBackground }]}>
            <Ionicons name="close" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { color: theme.text }]}>
            Nuevo Chat
          </Text>
          <View style={{ width: 40 }} />
        </View>
        
        <View style={styles.searchContainer}>
          <TextInput
            style={[styles.searchInput, { 
              backgroundColor: theme.inputBackground, 
              color: theme.text, 
              borderColor: nameFocused ? theme.orange : theme.gray 
            }]}
            placeholder="Buscar personas..."
            placeholderTextColor={theme.gray}
            value={searchQuery}
            onChangeText={handleSearch}
            onFocus={() => setNameFocused(true)}
            onBlur={() => setNameFocused(false)}
            autoFocus
          />
          {isSearching && (
            <ActivityIndicator size="small" color={theme.primary} style={styles.searchLoader} />
          )}
        </View>
        
        <ScrollView style={styles.modalContent}>
          {searchQuery.length >= 2 ? (
            searchResults.length > 0 ? (
              <View style={styles.usersList}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  Resultados de búsqueda:
                </Text>
                
                {searchResults.map((user, index) => (
                  <TouchableOpacity
                    key={user.id}
                    style={[
                      styles.userItem, 
                      { 
                        backgroundColor: theme.card,
                        borderBottomColor: theme.separator,
                        borderBottomWidth: index < searchResults.length - 1 ? 1 : 0
                      }
                    ]}
                    onPress={() => handleStartChat(user)}
                  >
                    <View style={[styles.userAvatar, { backgroundColor: theme.primary + '20' }]}>
                      <Ionicons name="person" size={24} color={theme.primary} />
                    </View>
                    
                    <View style={styles.userInfo}>
                      <Text style={[styles.userName, { color: theme.text }]}>
                        {user.fullName}
                      </Text>
                      <Text style={[styles.userEmail, { color: theme.icon }]}>
                        {user.email}
                      </Text>
                    </View>
                    
                    <Ionicons name="chevron-forward" size={20} color={theme.gray} />
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={80} color={theme.icon} />
                <Text style={[styles.emptyStateText, { color: theme.icon }]}>
                  {isSearching ? 'Buscando...' : 'No se encontraron usuarios'}
                </Text>
                <Text style={[styles.emptyStateSubtext, { color: theme.icon }]}>
                  Intenta con otro nombre o email
                </Text>
              </View>
            )
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="chatbubble-outline" size={80} color={theme.icon} />
              <Text style={[styles.emptyStateText, { color: theme.icon }]}>
                Buscar personas
              </Text>
              <Text style={[styles.emptyStateSubtext, { color: theme.icon }]}>
                Escribe al menos 2 caracteres para buscar usuarios
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 60,
    borderBottomWidth: 1,
  },
  modalCloseButton: {
    borderRadius: 20,
    padding: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    position: 'relative',
  },
  searchInput: {
    height: 50,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  searchLoader: {
    position: 'absolute',
    right: 32,
    top: 32,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  usersList: {
    flex: 1,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 1,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '500',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 20,
  },
}); 