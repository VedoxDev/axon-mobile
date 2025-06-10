import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { InvitationService, PendingInvitation } from '@/services/invitationService';
import { useProjectContext } from '@/contexts/ProjectContext';
import { CustomAlert } from '@/components/CustomAlert';
import { useCustomAlert } from '@/hooks/useCustomAlert';
import { AnnouncementService, ProjectAnnouncement, UserAnnouncementsResponse } from '@/services/announcementService';

export default function ActivityScreen() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const { refreshProjects } = useProjectContext();
  const { showAlert, alertConfig, hideAlert } = useCustomAlert();
  
  const [invitations, setInvitations] = useState<PendingInvitation[]>([]);
  const [announcements, setAnnouncements] = useState<Array<ProjectAnnouncement & { project: { id: string; name: string; } }>>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'invitations' | 'announcements'>('invitations');

  const fetchInvitations = useCallback(async () => {
    try {
      const pendingInvitations = await InvitationService.getPendingInvitations();
      setInvitations(pendingInvitations);
    } catch (error: any) {
      console.error('Error fetching invitations:', error);
      showAlert({
        title: 'Error',
        message: error.message || 'Error al cargar las invitaciones',
        type: 'error',
        buttons: [{ text: 'Entendido', style: 'default' }]
      });
    }
  }, [showAlert]);

  const fetchAnnouncements = useCallback(async () => {
    try {
      const response = await AnnouncementService.getUserAnnouncements();
      setAnnouncements(response.announcements);
      setUnreadCount(response.unreadCount);
    } catch (error: any) {
      console.error('Error fetching announcements:', error);
      showAlert({
        title: 'Error',
        message: error.message || 'Error al cargar los anuncios',
        type: 'error',
        buttons: [{ text: 'Entendido', style: 'default' }]
      });
    }
  }, [showAlert]);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchInvitations(), fetchAnnouncements()]);
    setLoading(false);
  }, [fetchInvitations, fetchAnnouncements]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
  }, [fetchAllData]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const handleInvitationResponse = async (invitationId: string, action: 'accept' | 'reject') => {
    setRespondingTo(invitationId);
    
    try {
      const response = await InvitationService.respondToInvitation(invitationId, action);
      
      // Remove the invitation from the list
      setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
      
      // Show success message
      const actionText = action === 'accept' ? 'aceptada' : 'rechazada';
      showAlert({
        title: 'Éxito',
        message: `Invitación ${actionText} correctamente`,
        type: 'success',
        buttons: [{ text: 'Continuar', style: 'default', onPress: hideAlert }]
      });
      
      // If accepted, refresh projects to show the new project
      if (action === 'accept') {
        await refreshProjects();
      }
      
    } catch (error: any) {
      console.error('Error responding to invitation:', error);
      showAlert({
        title: 'Error',
        message: error.message || 'Error al responder la invitación',
        type: 'error',
        buttons: [{ text: 'Entendido', style: 'default' }]
      });
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

  const getAnnouncementTypeColor = (type: string) => {
    switch (type) {
      case 'success': return theme.green;
      case 'warning': return theme.orange;
      case 'urgent': return theme.red;
      case 'info': 
      default: return theme.primary;
    }
  };

  const getAnnouncementTypeIcon = (type: string) => {
    switch (type) {
      case 'success': return 'checkmark-circle';
      case 'warning': return 'warning';
      case 'urgent': return 'alert-circle';
      case 'info':
      default: return 'information-circle';
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

  const renderAnnouncement = (announcement: ProjectAnnouncement & { project: { id: string; name: string; } }) => {
    const typeColor = getAnnouncementTypeColor(announcement.type);
    const typeIcon = getAnnouncementTypeIcon(announcement.type);
    
    return (
      <View key={announcement.id} style={[
        styles.announcementCard, 
        { 
          backgroundColor: theme.card, 
          borderColor: theme.separator,
          borderLeftColor: typeColor,
          opacity: announcement.isRead ? 0.8 : 1
        }
      ]}>
        <View style={styles.announcementHeader}>
          <View style={[styles.announcementIcon, { backgroundColor: typeColor + '20' }]}>
            <Ionicons name={typeIcon} size={20} color={typeColor} />
          </View>
          
          <View style={styles.announcementInfo}>
            <View style={styles.announcementTitleRow}>
              <Text style={[styles.announcementTitle, { color: theme.text }]} numberOfLines={1}>
                {announcement.title}
              </Text>
              {!announcement.isRead && (
                <View style={[styles.unreadDot, { backgroundColor: typeColor }]} />
              )}
            </View>
            <Text style={[styles.announcementProject, { color: theme.icon }]}>
              {announcement.project.name}
            </Text>
            <Text style={[styles.announcementDate, { color: theme.icon }]}>
              {formatDate(announcement.createdAt)}
            </Text>
          </View>
        </View>
        
        <Text style={[styles.announcementContent, { color: theme.text }]} numberOfLines={2}>
          {announcement.content}
        </Text>
        
        <View style={styles.announcementFooter}>
          <Text style={[styles.announcementAuthor, { color: theme.icon }]}>
            Por {announcement.createdBy.fullName}
          </Text>
          {announcement.isRead && (
            <View style={styles.readIndicator}>
              <Ionicons name="checkmark-circle" size={14} color={theme.green} />
              <Text style={[styles.readText, { color: theme.green }]}>Leído</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderEmptyInvitations = () => (
    <View style={styles.emptySection}>
      <Ionicons name="mail-outline" size={48} color={theme.icon} />
      <Text style={[styles.emptySectionTitle, { color: theme.text }]}>
        No hay invitaciones
      </Text>
      <Text style={[styles.emptySectionSubtitle, { color: theme.icon }]}>
        Las invitaciones a proyectos aparecerán aquí
      </Text>
    </View>
  );

  const renderEmptyAnnouncements = () => (
    <View style={styles.emptySection}>
      <Ionicons name="megaphone-outline" size={48} color={theme.icon} />
      <Text style={[styles.emptySectionTitle, { color: theme.text }]}>
        No hay anuncios
      </Text>
      <Text style={[styles.emptySectionSubtitle, { color: theme.icon }]}>
        Los anuncios de tus proyectos aparecerán aquí
      </Text>
    </View>
  );

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
        Cargando...
      </Text>
    </View>
  );

  const renderTabBar = () => (
    <View style={[styles.tabBar, { backgroundColor: theme.background, borderBottomColor: theme.separator }]}>
      <TouchableOpacity
        style={[
          styles.tab,
          activeTab === 'invitations' && { borderBottomColor: theme.primary, borderBottomWidth: 2 }
        ]}
        onPress={() => setActiveTab('invitations')}
      >
        <Ionicons 
          name="mail" 
          size={20} 
          color={activeTab === 'invitations' ? theme.primary : theme.icon} 
        />
        <Text style={[
          styles.tabText, 
          { color: activeTab === 'invitations' ? theme.primary : theme.icon }
        ]}>
          Invitaciones
        </Text>
        {invitations.length > 0 && (
          <View style={[styles.tabBadge, { backgroundColor: theme.orange }]}>
            <Text style={styles.tabBadgeText}>{invitations.length}</Text>
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.tab,
          activeTab === 'announcements' && { borderBottomColor: theme.primary, borderBottomWidth: 2 }
        ]}
        onPress={() => setActiveTab('announcements')}
      >
        <Ionicons 
          name="megaphone" 
          size={20} 
          color={activeTab === 'announcements' ? theme.primary : theme.icon} 
        />
        <Text style={[
          styles.tabText, 
          { color: activeTab === 'announcements' ? theme.primary : theme.icon }
        ]}>
          Anuncios
        </Text>
        {unreadCount > 0 && (
          <View style={[styles.tabBadge, { backgroundColor: theme.red }]}>
            <Text style={styles.tabBadgeText}>{unreadCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderTabContent = () => {
    if (loading) {
      return renderLoadingState();
    }

    if (activeTab === 'invitations') {
      return (
        <View style={styles.tabContent}>
          {invitations.length > 0 ? (
            <View style={styles.itemsList}>
              {invitations.map(renderInvitation)}
            </View>
          ) : (
            renderEmptyInvitations()
          )}
        </View>
      );
    }

    // announcements tab
    return (
      <View style={styles.tabContent}>
        {announcements.length > 0 ? (
          <View style={styles.itemsList}>
            {announcements.map(renderAnnouncement)}
          </View>
        ) : (
          renderEmptyAnnouncements()
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Actividad</Text>
      </View>
      
      {renderTabBar()}
      
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
        {renderTabContent()}
      </ScrollView>
      
      <CustomAlert {...alertConfig} onDismiss={hideAlert} />
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
  // Tab styles
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    gap: 6,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
  },
  tabBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    marginLeft: 4,
  },
  tabBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  tabContent: {
    flex: 1,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },

  itemsList: {
    gap: 12,
  },
  emptySection: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptySectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 4,
  },
  emptySectionSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 32,
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
  // Announcement styles
  announcementCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderLeftWidth: 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  announcementHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  announcementIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  announcementInfo: {
    flex: 1,
  },
  announcementTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  announcementTitle: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  announcementProject: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 2,
  },
  announcementDate: {
    fontSize: 12,
  },
  announcementContent: {
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 12,
  },
  announcementFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  announcementAuthor: {
    fontSize: 12,
    flex: 1,
  },
  readIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  readText: {
    fontSize: 11,
    fontWeight: '500',
  },
}); 