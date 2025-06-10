import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Modal } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { ProjectService, CreateProjectRequest } from '@/services/projectService';
import { UserService, UserSearchResult } from '@/services/userService';
import { useAuth } from '@/app/auth/AuthProvider';
import { useProjectContext } from '@/contexts/ProjectContext';
import SelectedMembersModal from './SelectedMembersModal';
import { useCustomAlert } from '@/hooks/useCustomAlert';
import { CustomAlert } from '@/components/CustomAlert';

interface SelectedMember {
  id: string;
  name: string;
  email: string;
}

export default function AddMembersScreen() {
  const router = useRouter();
  const { projectName, projectDescription } = useLocalSearchParams<{ 
    projectName: string; 
    projectDescription: string; 
  }>();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const { user } = useAuth();
  const { refreshProjects } = useProjectContext();
  const { showAlert, alertConfig, hideAlert } = useCustomAlert();
  
  const [selectedMembers, setSelectedMembers] = useState<SelectedMember[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [justAddedMember, setJustAddedMember] = useState<string | null>(null);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showSelectedMembersModal, setShowSelectedMembersModal] = useState(false);

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
        const response = await UserService.searchUsers(searchQuery.trim(), 5);
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

    const newMember: SelectedMember = {
      id: selectedUser.id,
      name: selectedUser.fullName,
      email: selectedUser.email,
    };

    setSelectedMembers([...selectedMembers, newMember]);
    
    // Show visual feedback
    setJustAddedMember(selectedUser.id);
    setTimeout(() => setJustAddedMember(null), 2000);
  };

  const handleRemoveMember = (id: string) => {
    setSelectedMembers(selectedMembers.filter(member => member.id !== id));
  };

  const handleFinish = async () => {
    setIsCreatingProject(true);
    
    try {
      // First, create the project
      const projectData: CreateProjectRequest = {
        name: projectName!,
        description: projectDescription || undefined,
      };

      const response = await ProjectService.createProject(projectData);
      const projectId = response.id;
      
      // Then send invitations to selected members (if any)
      let successfulInvitations = 0;
      let failedInvitations = 0;
      
      if (selectedMembers.length > 0) {
        const invitationPromises = selectedMembers.map(member =>
          ProjectService.inviteUserToProject(projectId, { userId: member.id })
        );

        const invitationResults = await Promise.allSettled(invitationPromises);
        
        // Count successful invitations
        successfulInvitations = invitationResults.filter(result => result.status === 'fulfilled').length;
        failedInvitations = invitationResults.filter(result => result.status === 'rejected').length;
      }
      
      // Refresh the projects list in the context
      await refreshProjects();
      
      // Show success message
      let successMessage = 'Proyecto creado exitosamente';
      if (selectedMembers.length > 0) {
        if (failedInvitations === 0) {
          successMessage += `\n${successfulInvitations} invitaciones enviadas correctamente`;
        } else {
          successMessage += `\n${successfulInvitations} de ${selectedMembers.length} invitaciones enviadas correctamente`;
        }
      }
      
      showAlert({
        title: 'Éxito',
        message: successMessage,
        type: 'success',
        buttons: [
          {
            text: 'Perfecto',
            style: 'default',
            onPress: () => router.replace('/(tabs)/home')
          }
        ]
      });
      
          } catch (error: any) {
        console.error('Error creating project:', error);
        showAlert({
          title: 'Error',
          message: error.message || 'No se pudo crear el proyecto. Inténtalo de nuevo.',
          type: 'error',
          buttons: [{ text: 'Reintentar', style: 'default' }]
        });
      } finally {
      setIsCreatingProject(false);
    }
  };

  const handleSkip = () => {
    showAlert({
      title: 'Omitir invitaciones',
      message: 'Se creará el proyecto sin invitar a ningún miembro. Podrás agregar miembros más adelante.',
      type: 'warning',
      buttons: [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Crear Proyecto', 
          style: 'default',
          onPress: handleFinish
        }
      ]
    });
  };

  const handleOpenSearchModal = () => {
    setShowSearchModal(true);
  };

  const handleCloseSearchModal = () => {
    setShowSearchModal(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleOpenSelectedMembersModal = () => {
    setShowSelectedMembersModal(true);
  };

  const handleCloseSelectedMembersModal = () => {
    setShowSelectedMembersModal(false);
  };

  const renderSearchResult = (searchUser: UserSearchResult, index: number) => {
    const isAlreadySelected = selectedMembers.some(member => member.id === searchUser.id);
    const isCurrentUser = !!(user && searchUser.id === user.id);
    
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
          isCurrentUser && styles.currentUserResult
        ]}
        onPress={() => handleSelectMember(searchUser)}
        disabled={isCurrentUser}
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
            { color: isCurrentUser ? theme.icon : theme.text }
          ]}>
            {searchUser.fullName} {isCurrentUser && '(Usted)'}
          </Text>
          <Text style={[styles.searchResultEmail, { color: theme.icon }]}>
            {searchUser.email}
          </Text>
          {isAlreadySelected && (
            <Text style={[styles.selectedLabel, { color: theme.green }]}>
              ✓ Será invitado
            </Text>
          )}
        </View>
        
        {/* Action Icon */}
        <View style={styles.actionIcon}>
          {isCurrentUser ? (
            <Ionicons name="person" size={20} color={theme.icon} />
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
          disabled={isCreatingProject}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Añadir Equipo</Text>
        <TouchableOpacity onPress={handleSkip} style={styles.skipButton} disabled={isCreatingProject}>
          <Text style={[styles.skipButtonText, { color: theme.text }]}>Omitir</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.formContainer}>
        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressStep}>
            <View style={[styles.progressDot, styles.completedProgressDot, { backgroundColor: theme.green }]}>
              <Ionicons name="checkmark" size={16} color="#fff" />
            </View>
            <Text style={[styles.progressLabel, { color: theme.green }]}>Detalles</Text>
          </View>
          <View style={[styles.progressLine, { backgroundColor: theme.progressBarFill }]} />
          <View style={styles.progressStep}>
            <View style={[styles.progressDot, styles.activeProgressDot, { backgroundColor: theme.progressBarFill }]}>
              <Text style={[styles.progressNumber, { color: '#fff' }]}>2</Text>
            </View>
            <Text style={[styles.progressLabel, { color: theme.progressBarText }]}>Equipo</Text>
          </View>
        </View>

        <View style={styles.contentContainer}>
          <View style={styles.iconContainer}>
            <Ionicons name="people" size={80} color={theme.primary} />
          </View>
          
          <Text style={[styles.title, { color: theme.text }]}>Añade a gente</Text>
          <Text style={[styles.subtitle, { color: theme.icon }]}>
            Invita a personas a colaborar contigo en "{projectName}" para sacar el mayor provecho de la creatividad en equipo y alcanzar objetivos extraordinarios juntos.
          </Text>

          <View style={styles.searchContainer}>
            <TouchableOpacity 
              style={[styles.searchInput, 
                { 
                  backgroundColor: theme.inputBackground, 
                  borderColor: theme.separator,
                  justifyContent: 'center'
                }]}
              onPress={handleOpenSearchModal}
              disabled={isCreatingProject}
            >
              <View style={styles.searchInputContent}>
                <Ionicons name="search" size={20} color={theme.icon} style={{ marginRight: 12 }} />
                <Text style={[styles.searchInputPlaceholder, { color: theme.icon }]}>
                  Buscar por nombre o email...
                </Text>
              </View>
            </TouchableOpacity>
            
            {/* Selected Members Count - Show beneath input */}
            {selectedMembers.length > 0 && (
              <TouchableOpacity 
                style={[styles.membersCountContainer, { backgroundColor: theme.inputBackground, borderColor: theme.separator }]}
                onPress={handleOpenSelectedMembersModal}
                disabled={isCreatingProject}
              >
                <Ionicons name="people" size={16} color={theme.green} />
                <View style={styles.countTextContainer}>
                  <Text style={[styles.membersCountText, { color: theme.text }]}>
                    Se invitarán a {selectedMembers.length} {selectedMembers.length === 1 ? 'persona' : 'personas'}
                  </Text>
                  <Text style={[styles.countHintText, { color: theme.icon }]}>
                    Toca para ver y gestionar la lista
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.icon} />
              </TouchableOpacity>
            )}
          </View>


        </View>

        <TouchableOpacity
          style={[
            styles.finishButton, 
            { 
              backgroundColor: isCreatingProject ? theme.icon : theme.primary,
              opacity: isCreatingProject ? 0.6 : 1
            }
          ]}
          onPress={handleFinish}
          disabled={isCreatingProject}
        >
          {isCreatingProject ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={[styles.finishButtonText, { marginLeft: 8 }]}>
                Creando proyecto...
              </Text>
            </View>
          ) : (
            <Text style={styles.finishButtonText}>
              {selectedMembers.length > 0 ? 'Crear Proyecto y Enviar Invitaciones' : 'Crear Proyecto'}
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
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={handleCloseSearchModal} style={[styles.modalCloseButton, { backgroundColor: theme.inputBackground }]}>
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Buscar Personas</Text>
            <View style={{ width: 40 }} />
          </View>
          
          <View style={styles.modalSearchContainer}>
            <TextInput
              style={[styles.modalSearchInput, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.separator }]}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Buscar por nombre o email..."
              placeholderTextColor={theme.icon}
              autoFocus={true}
              editable={!isCreatingProject}
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
      
      {/* Selected Members Modal */}
      <SelectedMembersModal
        visible={showSelectedMembersModal}
        selectedMembers={selectedMembers}
        onClose={handleCloseSelectedMembersModal}
        onRemoveMember={handleRemoveMember}
        theme={theme}
      />
      
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
  skipButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  formContainer: {
    padding: 16,
  },

  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  progressStep: {
    alignItems: 'center',
  },
  progressDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  activeProgressDot: {
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  completedProgressDot: {
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  progressNumber: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  progressLine: {
    width: 40,
    height: 2,
    marginHorizontal: 16,
  },
  contentContainer: {
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
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
    marginBottom: 24,
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
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

  membersCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    gap: 8,
  },
  membersCountText: {
    fontSize: 14,
    fontWeight: '500',
  },

  finishButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 32,
  },
  finishButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  countTextContainer: {
    flex: 1,
  },
  countHintText: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 2,
  },
  searchInputContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInputPlaceholder: {
    fontSize: 16,
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
    borderBottomColor: '#e0e0e0',
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