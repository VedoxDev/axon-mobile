import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Modal } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { ProjectService } from '@/services/projectService';
import { UserService, UserSearchResult } from '@/services/userService';
import { useAuth } from '@/app/auth/AuthProvider';
import { useCustomAlert } from '@/hooks/useCustomAlert';
import { CustomAlert } from '@/components/CustomAlert';

interface SelectedMember {
  id: string;
  name: string;
  email: string;
}

interface ProjectMember {
  id: string;
  nombre: string;
  apellidos: string;
  role: string;
  status: string;
}

export default function InviteMembersScreen() {
  const router = useRouter();
  const { projectId, projectName } = useLocalSearchParams<{ 
    projectId: string; 
    projectName: string; 
  }>();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const { user } = useAuth();
  const { showAlert, alertConfig, hideAlert } = useCustomAlert();
  
  const [selectedMembers, setSelectedMembers] = useState<SelectedMember[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);

  // Fetch project members when component mounts
  useEffect(() => {
    const fetchProjectMembers = async () => {
      if (!projectId) return;
      
      try {
        setIsLoadingMembers(true);
        const members = await ProjectService.getProjectMembers(projectId);
        setProjectMembers(members);
      } catch (error) {
        console.error('Error fetching project members:', error);
        setProjectMembers([]);
      } finally {
        setIsLoadingMembers(false);
      }
    };

    fetchProjectMembers();
  }, [projectId]);

  // Search for users when search query changes
  useEffect(() => {
    const searchUsers = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      
      try {
        const response = await UserService.searchUsers(searchQuery.trim(), 8);
        setSearchResults(response.users);
      } catch (error: any) {
        console.error('Error searching users:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const timeoutId = setTimeout(searchUsers, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleSelectMember = (selectedUser: UserSearchResult) => {
    // Check if user is already selected - if so, remove them
    if (selectedMembers.some(member => member.id === selectedUser.id)) {
      setSelectedMembers(selectedMembers.filter(member => member.id !== selectedUser.id));
      return;
    }

    // Don't allow inviting yourself
    if (user && selectedUser.id === user.id) {
      showAlert({
        title: 'Información',
        message: 'No puedes invitarte a ti mismo al proyecto',
        type: 'info',
        buttons: [{ text: 'Entendido', style: 'default' }]
      });
      return;
    }

    // Don't allow inviting users who are already members
    if (projectMembers.some(member => member.id === selectedUser.id)) {
      showAlert({
        title: 'Información',
        message: 'Esta persona ya es miembro del proyecto',
        type: 'info',
        buttons: [{ text: 'Entendido', style: 'default' }]
      });
      return;
    }

    const newMember: SelectedMember = {
      id: selectedUser.id,
      name: selectedUser.fullName,
      email: selectedUser.email,
    };

    setSelectedMembers([...selectedMembers, newMember]);
  };

  const handleRemoveMember = (id: string) => {
    setSelectedMembers(selectedMembers.filter(member => member.id !== id));
  };

  const handleOpenSearchModal = () => {
    setShowSearchModal(true);
  };

  const handleCloseSearchModal = () => {
    setShowSearchModal(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleInviteMembers = async () => {
    if (selectedMembers.length === 0) {
      showAlert({
        title: 'Información',
        message: 'Selecciona al menos una persona para invitar',
        type: 'warning',
        buttons: [{ text: 'Entendido', style: 'default' }]
      });
      return;
    }

    setIsInviting(true);
    
    try {
      // Send invitations to selected members
      const invitationPromises = selectedMembers.map(member =>
        ProjectService.inviteUserToProject(projectId!, { userId: member.id })
      );

      const invitationResults = await Promise.allSettled(invitationPromises);
      
      // Analyze results in detail
      let successfulInvitations = 0;
      let pendingInvitations = 0;
      let failedInvitations = 0;
      
      invitationResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          successfulInvitations++;
        } else if (result.status === 'rejected') {
          // Error 400 means already has invitation
          const error = result.reason;
          if (error?.response?.status === 400) {
            pendingInvitations++;
          } else {
            failedInvitations++;
          }
        }
      });
      
      // Build success message
      let title = 'Invitaciones Procesadas';
      let message = '';
      let alertType: 'success' | 'warning' | 'info' = 'success';
      
      if (successfulInvitations > 0) {
        message += `✅ ${successfulInvitations} invitación${successfulInvitations === 1 ? '' : 'es'} enviada${successfulInvitations === 1 ? '' : 's'} correctamente`;
      }
      
      if (pendingInvitations > 0) {
        if (message) message += '\n\n';
        message += `⏳ ${pendingInvitations} persona${pendingInvitations === 1 ? '' : 's'} ya tenía${pendingInvitations === 1 ? '' : 'n'} invitación pendiente`;
        if (successfulInvitations === 0 && failedInvitations === 0) {
          alertType = 'warning';
          title = 'Invitaciones Pendientes';
        }
      }
      
      if (failedInvitations > 0) {
        if (message) message += '\n\n';
        message += `❌ ${failedInvitations} invitación${failedInvitations === 1 ? '' : 'es'} no se pudo${failedInvitations === 1 ? '' : 'ieron'} enviar`;
        if (successfulInvitations === 0) {
          alertType = 'warning';
          title = 'Error en Invitaciones';
        }
      }
      
      showAlert({
        title,
        message,
        type: alertType,
        buttons: [
          {
            text: 'Perfecto',
            style: 'default',
            onPress: () => router.back()
          }
        ]
      });
      
    } catch (error: any) {
      console.error('Error inviting members:', error);
      showAlert({
        title: 'Error',
        message: error.message || 'No se pudieron enviar las invitaciones. Por favor inténtalo de nuevo.',
        type: 'error',
        buttons: [{ text: 'Reintentar', style: 'default' }]
      });
    } finally {
      setIsInviting(false);
    }
  };

  const renderSearchResult = (searchUser: UserSearchResult, index: number) => {
    const isAlreadySelected = selectedMembers.some(member => member.id === searchUser.id);
    const isCurrentUser = !!(user && searchUser.id === user.id);
    const isAlreadyMember = projectMembers.some(member => member.id === searchUser.id);
    
    return (
      <TouchableOpacity 
        key={searchUser.id}
        style={[
          styles.searchResultItem,
          { 
            backgroundColor: theme.card,
            borderBottomColor: theme.separator,
            borderBottomWidth: index < searchResults.length - 1 ? 1 : 0
          },
          isCurrentUser && styles.currentUserResult,
          isAlreadyMember && styles.alreadyMemberResult
        ]}
        onPress={() => handleSelectMember(searchUser)}
        disabled={isCurrentUser || isInviting || isAlreadyMember}
      >
        {/* Avatar */}
        <View style={styles.searchResultAvatar}>
          <View style={[styles.avatarBackground, { backgroundColor: isCurrentUser ? theme.icon + '20' : theme.primary + '20' }]}>
            <Ionicons 
              name="person" 
              size={24} 
              color={isCurrentUser ? theme.icon : theme.primary} 
            />
          </View>
        </View>
        
        {/* User Info */}
        <View style={styles.searchResultInfo}>
          <Text style={[
            styles.searchResultName, 
            { color: isCurrentUser || isAlreadyMember ? theme.icon : theme.text }
          ]}>
            {searchUser.fullName} {isCurrentUser && '(Usted)'} {isAlreadyMember && '(Ya es miembro)'}
          </Text>
          <Text style={[styles.searchResultEmail, { color: theme.icon }]}>
            {searchUser.email}
          </Text>
          {isAlreadySelected && !isAlreadyMember && (
            <Text style={[styles.selectedLabel, { color: theme.green }]}>
              ✓ Será invitado
            </Text>
          )}
          {isAlreadyMember && (
            <Text style={[styles.selectedLabel, { color: theme.orange }]}>
              Ya es miembro del proyecto
            </Text>
          )}
        </View>
        
        {/* Action Icon */}
        <View style={styles.actionIcon}>
          {isCurrentUser ? (
            <Ionicons name="person" size={20} color={theme.icon} />
          ) : isAlreadyMember ? (
            <Ionicons name="checkmark-circle" size={20} color={theme.orange} />
          ) : isAlreadySelected ? (
            <Ionicons name="remove-circle" size={20} color={theme.red} />
          ) : (
            <Ionicons name="add-circle" size={20} color={theme.primary} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={[styles.backButton, { backgroundColor: theme.primary }]} 
          disabled={isInviting}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Invitar Miembros</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.formContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.contentContainer}>
          <View style={styles.iconContainer}>
            <Ionicons name="person-add" size={80} color={theme.primary} />
          </View>
          
          <Text style={[styles.title, { color: theme.text }]}>Invitar a "{projectName}"</Text>
          <Text style={[styles.subtitle, { color: theme.icon }]}>
            Busca y selecciona las personas que quieras invitar a colaborar en este proyecto.
          </Text>

          <View style={styles.searchContainer}>
            <TouchableOpacity 
              style={[styles.searchInput, 
                { 
                  backgroundColor: theme.inputBackground, 
                  borderColor: theme.separator,
                  justifyContent: 'center'
                }]}
              onPress={() => setShowSearchModal(true)}
              disabled={isInviting}
            >
              <View style={styles.searchInputContent}>
                <Ionicons name="search" size={20} color={theme.icon} style={{ marginRight: 12 }} />
                <Text style={[styles.searchInputPlaceholder, { color: theme.icon }]}>
                  Buscar por nombre o email...
                </Text>
              </View>
            </TouchableOpacity>
          </View>
          
          {/* Selected Members Count */}
          {selectedMembers.length > 0 && (
            <View style={[styles.selectedMembersContainer, { backgroundColor: theme.inputBackground, borderColor: theme.separator }]}>
              <Ionicons name="people" size={16} color={theme.green} />
              <View style={styles.countTextContainer}>
                <Text style={[styles.selectedMembersText, { color: theme.text }]}>
                  Se invitarán a {selectedMembers.length} {selectedMembers.length === 1 ? 'persona' : 'personas'}
                </Text>
                <Text style={[styles.countHintText, { color: theme.icon }]}>
                  Toca para ver y gestionar la lista
                </Text>
              </View>
              <TouchableOpacity 
                onPress={() => setSelectedMembers([])} 
                disabled={isInviting}
              >
                <Text style={[styles.clearAllText, { color: theme.red }]}>Limpiar</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Invite Button */}
        <TouchableOpacity
          style={[
            styles.inviteButton, 
            { 
              backgroundColor: selectedMembers.length > 0 && !isInviting ? theme.primary : theme.icon,
              opacity: selectedMembers.length > 0 && !isInviting ? 1 : 0.6
            }
          ]}
          onPress={handleInviteMembers}
          disabled={selectedMembers.length === 0 || isInviting}
        >
          {isInviting ? (
            <View style={styles.loadingButtonContainer}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={[styles.inviteButtonText, { marginLeft: 8 }]}>
                Enviando invitaciones...
              </Text>
            </View>
          ) : (
            <Text style={styles.inviteButtonText}>
              {selectedMembers.length > 0 
                ? `Invitar ${selectedMembers.length} ${selectedMembers.length === 1 ? 'persona' : 'personas'}`
                : 'Selecciona personas para invitar'
              }
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Search Modal */}
      <Modal
        visible={showSearchModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.separator }]}>
            <TouchableOpacity 
              onPress={handleCloseSearchModal} 
              style={[styles.modalCloseButton, { backgroundColor: theme.inputBackground }]}
            >
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Buscar Personas</Text>
            <View style={{ width: 40 }} />
          </View>
          
          <View style={styles.modalSearchContainer}>
            <TextInput
              style={[
                styles.modalSearchInput, 
                { 
                  backgroundColor: theme.inputBackground, 
                  color: theme.text, 
                  borderColor: theme.separator 
                }
              ]}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Buscar por nombre o email..."
              placeholderTextColor={theme.icon}
              autoFocus={true}
              editable={!isInviting}
            />
          </View>
          
          <ScrollView style={styles.modalResultsContainer}>
            {isSearching ? (
              <View style={styles.modalLoadingContainer}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={[styles.modalLoadingText, { color: theme.icon }]}>
                  Buscando usuarios...
                </Text>
              </View>
            ) : searchResults.length > 0 ? (
              <View>
                {searchResults.map((searchUser, index) => renderSearchResult(searchUser, index))}
              </View>
            ) : searchQuery.trim().length >= 2 ? (
              <View style={styles.modalNoResultsContainer}>
                <Ionicons name="person-outline" size={60} color={theme.icon} />
                <Text style={[styles.modalNoResultsText, { color: theme.icon }]}>
                  No se encontraron usuarios
                </Text>
              </View>
            ) : (
              <View style={styles.modalInstructionsContainer}>
                <Ionicons name="search" size={60} color={theme.icon} />
                <Text style={[styles.modalInstructionsText, { color: theme.icon }]}>
                  Ingresa al menos 2 caracteres para buscar
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
      
      {/* Custom Alert */}
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        buttons={alertConfig.buttons}
        onDismiss={hideAlert}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    marginTop: 45,
    paddingHorizontal: 16,
  },
  backButton: {
    borderRadius: 20,
    padding: 6,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  formContainer: {
    padding: 16,
  },
  contentContainer: {
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  searchContainer: {
    position: 'relative',
    width: '100%',
    marginBottom: 16,
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    paddingRight: 50,
    fontSize: 16,
  },
  searchInputContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInputPlaceholder: {
    fontSize: 16,
  },
  selectedMembersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
    gap: 8,
    width: '100%',
  },
  selectedMembersText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  clearAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
  countTextContainer: {
    flex: 1,
  },
  countHintText: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 2,
  },
  resultsContainer: {
    width: '100%',
    minHeight: 200,
  },
  resultsWrapper: {
    width: '100%',
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 1,
  },
  currentUserResult: {
    opacity: 0.5,
  },
  alreadyMemberResult: {
    opacity: 0.5,
    backgroundColor: '#f0f0f0',
  },
  searchResultAvatar: {
    position: 'relative',
    marginRight: 12,
  },
  avatarBackground: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  searchResultEmail: {
    fontSize: 14,
    marginBottom: 2,
  },
  selectedLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionIcon: {
    marginLeft: 8,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  noResultsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  noResultsText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  instructionsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  instructionsText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  inviteButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 32,
  },
  inviteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  modalSearchContainer: {
    padding: 16,
  },
  modalSearchInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  modalResultsContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  modalLoadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  modalLoadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  modalNoResultsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  modalNoResultsText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  modalInstructionsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  modalInstructionsText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
}); 