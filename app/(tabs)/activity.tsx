import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { InvitationService, PendingInvitation } from '@/services/invitationService';
import { useProjectContext } from '@/contexts/ProjectContext';

export default function ActivityScreen() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const { refreshProjects } = useProjectContext();
  
  const [invitations, setInvitations] = useState<PendingInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [respondingTo, setRespondingTo] = useState<string | null>(null);

  const fetchInvitations = useCallback(async () => {
    try {
      const pendingInvitations = await InvitationService.getPendingInvitations();
      setInvitations(pendingInvitations);
    } catch (error: any) {
      console.error('Error fetching invitations:', error);
      Alert.alert('Error', error.message || 'Failed to load invitations');
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchInvitations();
    setRefreshing(false);
  }, [fetchInvitations]);

  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  const handleInvitationResponse = async (invitationId: string, action: 'accept' | 'reject') => {
    setRespondingTo(invitationId);
    
    try {
      const response = await InvitationService.respondToInvitation(invitationId, action);
      
      // Remove the invitation from the list
      setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
      
      // Show success message
      const actionText = action === 'accept' ? 'aceptada' : 'rechazada';
      Alert.alert('Éxito', `Invitación ${actionText} correctamente`);
      
      // If accepted, refresh projects to show the new project
      if (action === 'accept') {
        await refreshProjects();
      }
      
    } catch (error: any) {
      console.error('Error responding to invitation:', error);
      Alert.alert('Error', error.message || 'Failed to respond to invitation');
    } finally {
      setRespondingTo(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // Handle invalid dates
    if (isNaN(date.getTime())) {
      return 'Fecha inválida';
    }
    
    // If the date is in the future (small buffer for server/client time differences)
    if (diffTime < -60000) { // Allow 1 minute buffer
      return 'Justo ahora';
    }
    
    if (diffMinutes < 1) {
      return 'Justo ahora';
    } else if (diffMinutes < 60) {
      return diffMinutes === 1 ? 'Hace 1 minuto' : `Hace ${diffMinutes} minutos`;
    } else if (diffHours < 24) {
      return diffHours === 1 ? 'Hace 1 hora' : `Hace ${diffHours} horas`;
    } else if (diffDays === 1) {
      return 'Hace 1 día';
    } else if (diffDays < 7) {
      return `Hace ${diffDays} días`;
    } else {
      return date.toLocaleDateString('es-ES', { 
        day: 'numeric', 
        month: 'short' 
      });
    }
  };

  const renderInvitation = (invitation: PendingInvitation) => {
    const isResponding = respondingTo === invitation.id;
    
    return (
      <View key={invitation.id} style={[styles.invitationCard, { backgroundColor: theme.card, borderColor: theme.separator }]}>
        <View style={styles.invitationHeader}>
          <View style={[styles.invitationIcon, { backgroundColor: theme.primary + '20' }]}>
            <Ionicons name="people" size={24} color={theme.primary} />
          </View>
          
          <View style={styles.invitationInfo}>
            <Text style={[styles.invitationTitle, { color: theme.text }]}>
              Invitación a proyecto
            </Text>
            <Text style={[styles.invitationDate, { color: theme.icon }]}>
              {formatDate(invitation.createdAt)}
            </Text>
          </View>
        </View>
        
        <View style={styles.invitationContent}>
          <Text style={[styles.invitationText, { color: theme.text }]}>
            <Text style={{ fontWeight: '600' }}>
              {invitation.inviter.nombre} {invitation.inviter.apellidos}
            </Text>
            {' '}te ha invitado a colaborar en{' '}
            <Text style={[styles.projectName, { color: theme.primary }]}>
              "{invitation.project.name}"
            </Text>
          </Text>
          
          {invitation.project.description && (
            <Text style={[styles.projectDescription, { color: theme.icon }]}>
              {invitation.project.description}
            </Text>
          )}
        </View>
        
        <View style={styles.invitationActions}>
          <TouchableOpacity
            style={[styles.rejectButton, { backgroundColor: theme.red + '15', borderColor: theme.red + '30' }]}
            onPress={() => handleInvitationResponse(invitation.id, 'reject')}
            disabled={isResponding}
          >
            {isResponding ? (
              <ActivityIndicator size="small" color={theme.red} />
            ) : (
              <>
                <Ionicons name="close" size={18} color={theme.red} />
                <Text style={[styles.rejectButtonText, { color: theme.red }]}>
                  Rechazar
                </Text>
              </>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.acceptButton, { backgroundColor: theme.green }]}
            onPress={() => handleInvitationResponse(invitation.id, 'accept')}
            disabled={isResponding}
          >
            {isResponding ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark" size={18} color="#fff" />
                <Text style={styles.acceptButtonText}>
                  Aceptar
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="notifications-outline" size={80} color={theme.icon} />
      <Text style={[styles.emptyStateTitle, { color: theme.text }]}>
        No hay invitaciones
      </Text>
      <Text style={[styles.emptyStateSubtitle, { color: theme.icon }]}>
        Las invitaciones a proyectos aparecerán aquí
      </Text>
    </View>
  );

  const renderLoadingState = () => (
    <View style={styles.loadingState}>
      <ActivityIndicator size="large" color={theme.primary} />
      <Text style={[styles.loadingText, { color: theme.icon }]}>
        Cargando invitaciones...
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Actividad</Text>
      </View>
      
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.primary]}
            tintColor={theme.primary}
          />
        }
      >
        {loading ? (
          renderLoadingState()
        ) : invitations.length > 0 ? (
          <View style={styles.invitationsList}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Invitaciones pendientes ({invitations.length})
            </Text>
            {invitations.map(renderInvitation)}
          </View>
        ) : (
          renderEmptyState()
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  invitationsList: {
    paddingBottom: 24,
  },
  invitationCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  invitationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  invitationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  invitationInfo: {
    flex: 1,
  },
  invitationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  invitationDate: {
    fontSize: 12,
  },
  invitationContent: {
    marginBottom: 16,
  },
  invitationText: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 8,
  },
  projectName: {
    fontWeight: '600',
  },
  projectDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  invitationActions: {
    flexDirection: 'row',
    gap: 12,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  rejectButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  acceptButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 20,
  },
  loadingState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
}); 