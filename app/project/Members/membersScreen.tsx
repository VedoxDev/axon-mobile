import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { ProjectService, ProjectMember, ChangeMemberRoleResponse } from '@/services/projectService';
import { useAuth } from '@/app/auth/AuthProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCustomAlert } from '@/hooks/useCustomAlert';
import { CustomAlert } from '@/components/CustomAlert';

export default function MembersScreen() {
  const router = useRouter();
  const { projectId, projectName } = useLocalSearchParams<{ 
    projectId: string; 
    projectName: string; 
  }>();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { showAlert, alertConfig, hideAlert } = useCustomAlert();
  
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Get current user's role in the project
  const currentUserMember = members.find(member => member.id === user?.id);
  const isOwner = currentUserMember?.role === 'owner';

  // Fetch project members when component mounts
  useEffect(() => {
    fetchProjectMembers();
  }, [projectId]);

  const fetchProjectMembers = async () => {
    if (!projectId) return;
    
    try {
      setIsLoading(true);
      const projectMembers = await ProjectService.getProjectMembers(projectId);
      setMembers(projectMembers);
    } catch (error: any) {
      console.error('Error fetching project members:', error);
      showAlert({
        title: 'Error',
        message: 'No se pudieron cargar los miembros del proyecto. Inténtalo de nuevo.',
        type: 'error',
        buttons: [
          { text: 'Reintentar', style: 'default', onPress: fetchProjectMembers },
          { text: 'Cerrar', style: 'cancel', onPress: () => router.back() }
        ]
      });
    } finally {
      setIsLoading(false);
    }
  };

  const translateRole = (role: string): string => {
    switch (role) {
      case 'owner':
        return 'Propietario';
      case 'admin':
        return 'Colaborador';
      case 'member':
        return 'Miembro';
      default:
        return role;
    }
  };



  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return 'star';
      case 'admin':
        return 'shield';
      case 'member':
        return 'person';
      default:
        return 'person';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner':
        return '#FFD700'; // Gold
      case 'admin':
        return '#3B82F6'; // Blue
      case 'member':
        return '#6B7280'; // Gray
      default:
        return '#6B7280';
    }
  };

  const startChat = (member: ProjectMember) => {
    // Don't allow chatting with yourself
    if (user && member.id === user.id) {
      showAlert({
        title: 'Información',
        message: 'No puedes iniciar un chat contigo mismo',
        type: 'info',
        buttons: [{ text: 'Entendido', style: 'default' }]
      });
      return;
    }

    const chatName = `${member.nombre} ${member.apellidos}`;
    
    // Navigate to direct chat with this member
    router.push({
      pathname: '/chat/[chatId]',
      params: {
        chatId: member.id,
        chatType: 'direct',
        chatName: chatName
      }
    });
  };

  const handleRoleChange = (member: ProjectMember) => {
    const currentRole = member.role;
    const newRole = currentRole === 'admin' ? 'member' : 'admin';
    const roleAction = newRole === 'admin' ? 'promover a colaborador' : 'degradar a miembro';
    const fullName = `${member.nombre} ${member.apellidos}`;

    showAlert({
      title: 'Cambiar Rol',
      message: `¿Estás seguro de que quieres ${roleAction} a ${fullName}?`,
      type: 'warning',
      buttons: [
        {
          text: 'Cancelar',
          style: 'cancel',
          onPress: () => hideAlert()
        },
        {
          text: 'Confirmar',
          style: 'default',
          onPress: () => confirmRoleChange(member, newRole)
        }
      ]
    });
  };

  const confirmRoleChange = async (member: ProjectMember, newRole: 'member' | 'admin') => {
    if (!projectId) return;
    
    hideAlert();
    
    try {
      const response: ChangeMemberRoleResponse = await ProjectService.changeMemberRole(
        projectId, 
        member.id, 
        newRole
      );

      // Update local state
      setMembers(prevMembers => 
        prevMembers.map(m => 
          m.id === member.id 
            ? { ...m, role: newRole }
            : m
        )
      );

      // Show success message
      const roleText = newRole === 'admin' ? 'colaborador' : 'miembro';
      showAlert({
        title: 'Rol Cambiado',
        message: `${response.memberName} ahora es ${roleText} del proyecto.`,
        type: 'success',
        buttons: [{ text: 'Entendido', style: 'default' }]
      });

    } catch (error: any) {
      console.error('Error changing member role:', error);
      showAlert({
        title: 'Error',
        message: error.message || 'No se pudo cambiar el rol del miembro. Inténtalo de nuevo.',
        type: 'error',
        buttons: [{ text: 'Entendido', style: 'default' }]
      });
    }
  };

    const renderMember = (member: ProjectMember, index: number) => {
    const fullName = `${member.nombre} ${member.apellidos}`;
    const initials = `${member.nombre.charAt(0)}${member.apellidos.charAt(0)}`.toUpperCase();
    const isCurrentUser = user && member.id === user.id;
    const isFirst = index === 0;
    const isLast = index === members.length - 1;
    
    return (
       <View key={member.id} style={[
         styles.memberItem, 
         { 
           backgroundColor: theme.card, 
           borderBottomColor: theme.separator + '30',
           borderTopLeftRadius: isFirst ? 16 : 0,
           borderTopRightRadius: isFirst ? 16 : 0,
           borderBottomLeftRadius: isLast ? 16 : 0,
           borderBottomRightRadius: isLast ? 16 : 0,
         }
       ]}>
         <View style={styles.memberInfo}>
           {/* Avatar */}
           <View style={[styles.avatarContainer, { backgroundColor: theme.primary + '20' }]}>
             <Text style={[styles.avatarText, { color: theme.primary }]}>{initials}</Text>
           </View>
           
           {/* Member details */}
           <View style={styles.memberDetails}>
             <View style={styles.nameContainer}>
               <Text style={[styles.memberName, { color: theme.text }]}>{fullName}</Text>
               {isCurrentUser && (
                 <Text style={[styles.youLabel, { color: theme.primary }]}>(Tú)</Text>
               )}
             </View>
             
             <View style={styles.memberMeta}>
               <View style={styles.roleContainer}>
                 <Ionicons name={getRoleIcon(member.role)} size={14} color={getRoleColor(member.role)} />
                 <Text style={[styles.roleText, { color: getRoleColor(member.role) }]}>{translateRole(member.role)}</Text>
               </View>
             </View>
           </View>
         </View>
        
        {/* Action buttons */}
        <View style={styles.actionButtons}>
          {/* Role change button - only show for owners, not for themselves, and not for other owners */}
          {isOwner && !isCurrentUser && member.role !== 'owner' && (
            <TouchableOpacity 
              style={[styles.roleButton, { backgroundColor: getRoleColor(member.role) + '20', borderColor: getRoleColor(member.role) }]}
              onPress={() => handleRoleChange(member)}
            >
              <Ionicons name="swap-horizontal" size={16} color={getRoleColor(member.role)} />
            </TouchableOpacity>
          )}
          
          {/* Chat button - only show for other members */}
          {!isCurrentUser && (
            <TouchableOpacity 
              style={[styles.chatButton, { backgroundColor: theme.primary }]}
              onPress={() => startChat(member)}
            >
              <Ionicons name="chatbubble" size={18} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.separator, paddingTop: insets.top }]}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={[styles.backButton, { backgroundColor: theme.primary }]}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Miembros</Text>
          <View style={{ width: 40 }} />
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.text }]}>Cargando miembros...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.separator, paddingTop: insets.top }]}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={[styles.backButton, { backgroundColor: theme.primary }]}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Miembros</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.contentContainer}>
          {/* Project info */}
          <View style={styles.projectInfo}>
            <View style={styles.projectIconContainer}>
              <Ionicons name="people" size={40} color={theme.primary} />
            </View>
            <Text style={[styles.projectTitle, { color: theme.text }]}>{projectName}</Text>
            <Text style={[styles.memberCount, { color: theme.gray }]}>
              {members.length} {members.length === 1 ? 'miembro' : 'miembros'}
            </Text>
          </View>

                     {/* Members list */}
           <View style={styles.membersContainer}>
             {members.length > 0 ? (
               members.map((member, index) => renderMember(member, index))
             ) : (
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={64} color={theme.gray} />
                <Text style={[styles.emptyStateTitle, { color: theme.text }]}>Sin miembros</Text>
                <Text style={[styles.emptyStateSubtitle, { color: theme.gray }]}>
                  Este proyecto aún no tiene miembros
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
      
      <CustomAlert {...alertConfig} onDismiss={hideAlert} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  projectInfo: {
    alignItems: 'center',
    marginBottom: 32,
  },
  projectIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  projectTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  memberCount: {
    fontSize: 16,
  },
  membersContainer: {
    gap: 1,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  memberInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
  },

  memberDetails: {
    flex: 1,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  youLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  memberMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleText: {
    fontSize: 14,
    marginLeft: 4,
  },

  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roleButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatButton: {
    width: 36,
    height: 36,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
}); 