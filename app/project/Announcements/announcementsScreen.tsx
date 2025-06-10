import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCustomAlert } from '@/hooks/useCustomAlert';
import { CustomAlert } from '@/components/CustomAlert';
import { useFocusEffect } from '@react-navigation/native';
import { 
  AnnouncementService, 
  ProjectAnnouncement,
  getAnnouncementTypeIcon,
  getAnnouncementTypeColor,
  translateAnnouncementType
} from '@/services/announcementService';
import { useAuth } from '@/app/auth/AuthProvider';
import { useProjectContext } from '@/contexts/ProjectContext';

export default function AnnouncementsScreen() {
  const router = useRouter();
  const { projectId, projectName } = useLocalSearchParams<{ 
    projectId: string; 
    projectName: string; 
  }>();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const { user } = useAuth();
  const { projects } = useProjectContext();
  const insets = useSafeAreaInsets();
  const { showAlert, alertConfig, hideAlert } = useCustomAlert();
  
  const [announcements, setAnnouncements] = useState<ProjectAnnouncement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Get current user's role in the project
  const currentProject = projects.find(p => p.id === projectId);
  const userRole = currentProject?.role || 'member';
  const canCreateAnnouncements = userRole === 'owner' || (userRole as any) === 'admin';

  // Fetch project announcements when component mounts
  useEffect(() => {
    fetchAnnouncements();
  }, [projectId]);

  // Refresh announcements when returning from other screens
  useFocusEffect(
    React.useCallback(() => {
      if (projectId) {
        fetchAnnouncements();
      }
    }, [projectId])
  );

  const fetchAnnouncements = async () => {
    if (!projectId) return;
    
    try {
      setIsLoading(true);
      const projectAnnouncements = await AnnouncementService.getProjectAnnouncements(projectId);
      
      // Sort announcements by creation date (newest first)
      const sortedAnnouncements = projectAnnouncements.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      setAnnouncements(sortedAnnouncements);
      
      // Automatically mark unread announcements as read since user is viewing them
      markUnreadAnnouncementsAsRead(sortedAnnouncements);
    } catch (error: any) {
      console.error('Error fetching announcements:', error);
      showAlert({
        title: 'Error',
        message: error.message || 'No se pudieron cargar los anuncios del proyecto.',
        type: 'error',
        buttons: [
          { text: 'Reintentar', style: 'default', onPress: () => { hideAlert(); fetchAnnouncements(); } },
          { text: 'Cerrar', style: 'cancel', onPress: () => router.back() }
        ]
      });
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAnnouncements();
  };

  const markUnreadAnnouncementsAsRead = async (announcements: ProjectAnnouncement[]) => {
    // Find all unread announcements
    const unreadAnnouncements = announcements.filter(ann => !ann.isRead);
    
    if (unreadAnnouncements.length === 0) return;

    // Mark each unread announcement as read (fire and forget)
    for (const announcement of unreadAnnouncements) {
      try {
        await AnnouncementService.markAnnouncementAsRead(announcement.id);
      } catch (error: any) {
        console.error('Error marking announcement as read:', error);
        // Silently fail for read tracking - not critical for UX
      }
    }

    // Update local state to show all as read
    setAnnouncements(prev => 
      prev.map(ann => ({ ...ann, isRead: true }))
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      return 'Hoy';
    } else if (diffDays === 2) {
      return 'Ayer';
    } else if (diffDays <= 7) {
      return `Hace ${diffDays - 1} días`;
    } else {
      return date.toLocaleDateString('es-ES', { 
        day: 'numeric', 
        month: 'short',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const renderAnnouncement = (announcement: ProjectAnnouncement, index: number) => {
    const typeColor = getAnnouncementTypeColor(announcement.type);
    const typeIcon = getAnnouncementTypeIcon(announcement.type);
    const isFirst = index === 0;
    const isLast = index === announcements.length - 1;
    
    return (
      <View
        key={announcement.id}
        style={[
          styles.announcementCard,
          {
            backgroundColor: theme.card,
            borderLeftColor: typeColor,
            borderTopLeftRadius: isFirst ? 16 : 0,
            borderTopRightRadius: isFirst ? 16 : 0,
            borderBottomLeftRadius: isLast ? 16 : 0,
            borderBottomRightRadius: isLast ? 16 : 0,
            opacity: announcement.isRead ? 0.8 : 1,
          }
        ]}
      >
        {/* Header */}
        <View style={styles.announcementHeader}>
          <View style={styles.announcementTitleRow}>
            <View style={styles.typeIndicator}>
              <Ionicons name={typeIcon} size={20} color={typeColor} />
              <Text style={[styles.typeText, { color: typeColor }]}>
                {translateAnnouncementType(announcement.type)}
              </Text>
            </View>
            
            <View style={styles.announcementMeta}>
              {!announcement.isRead && (
                <View style={[styles.unreadDot, { backgroundColor: typeColor }]} />
              )}
            </View>
          </View>
          
          <Text style={[styles.announcementTitle, { color: theme.text }]} numberOfLines={2}>
            {announcement.title}
          </Text>
        </View>

        {/* Content */}
        <Text 
          style={[styles.announcementContent, { color: theme.gray }]} 
          numberOfLines={3}
          ellipsizeMode="tail"
        >
          {announcement.content}
        </Text>

        {/* Footer */}
        <View style={styles.announcementFooter}>
          <View style={styles.authorInfo}>
            <View style={[styles.authorAvatar, { backgroundColor: theme.primary + '20' }]}>
              <Text style={[styles.authorInitial, { color: theme.primary }]}>
                {announcement.createdBy.nombre.charAt(0)}{announcement.createdBy.apellidos.charAt(0)}
              </Text>
            </View>
            <View style={styles.authorDetails}>
              <Text style={[styles.authorName, { color: theme.text }]}>
                {announcement.createdBy.fullName}
              </Text>
              <Text style={[styles.dateText, { color: theme.gray }]}>
                {formatDate(announcement.createdAt)}
              </Text>
            </View>
          </View>
          
          {announcement.isRead && (
            <View style={styles.readIndicator}>
              <Ionicons name="checkmark-circle" size={16} color={theme.green} />
              <Text style={[styles.readText, { color: theme.green }]}>Leído</Text>
            </View>
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
          <Text style={[styles.headerTitle, { color: theme.text }]}>Anuncios</Text>
          <View style={{ width: 40 }} />
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.text }]}>Cargando anuncios...</Text>
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
        <Text style={[styles.headerTitle, { color: theme.text }]}>Anuncios</Text>
        
        {/* Create button for admin/owner */}
        {canCreateAnnouncements ? (
          <TouchableOpacity 
            style={[styles.createButton, { backgroundColor: theme.orange }]}
            onPress={() => {
              router.push({
                pathname: '/project/Announcements/createAnnouncementModal',
                params: {
                  projectId,
                  projectName
                }
              });
            }}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.contentContainer}>
          {/* Project info */}
          <View style={styles.projectInfo}>
            <View style={styles.projectIconContainer}>
              <Ionicons name="megaphone" size={40} color={theme.orange} />
            </View>
            <Text style={[styles.projectTitle, { color: theme.text }]}>{projectName}</Text>
            <Text style={[styles.announcementCount, { color: theme.gray }]}>
              {announcements.length} {announcements.length === 1 ? 'anuncio' : 'anuncios'}
            </Text>
            
            {!canCreateAnnouncements && (
              <Text style={[styles.roleNote, { color: theme.gray }]}>
                Solo los colaboradores y propietarios pueden crear anuncios
              </Text>
            )}
          </View>

          {/* Announcements list */}
          <View style={styles.announcementsContainer}>
            {announcements.length > 0 ? (
              announcements.map((announcement, index) => renderAnnouncement(announcement, index))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="megaphone-outline" size={64} color={theme.gray} />
                <Text style={[styles.emptyStateTitle, { color: theme.text }]}>Sin anuncios</Text>
                <Text style={[styles.emptyStateSubtitle, { color: theme.gray }]}>
                  {canCreateAnnouncements 
                    ? 'Aún no hay anuncios en este proyecto. ¡Crea el primero!'
                    : 'Aún no hay anuncios en este proyecto.'
                  }
                </Text>
                
                {canCreateAnnouncements && (
                  <TouchableOpacity 
                    style={[styles.createFirstButton, { backgroundColor: theme.orange }]}
                                         onPress={() => {
                       router.push({
                         pathname: '/project/Announcements/createAnnouncementModal',
                         params: {
                           projectId,
                           projectName
                         }
                       });
                     }}
                  >
                    <Text style={styles.createFirstButtonText}>Crear Anuncio</Text>
                  </TouchableOpacity>
                )}
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
  createButton: {
    width: 40,
    height: 40,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
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
  announcementCount: {
    fontSize: 16,
    marginBottom: 8,
  },
  roleNote: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  announcementsContainer: {
    gap: 1,
  },
  announcementCard: {
    padding: 16,
    borderLeftWidth: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  announcementHeader: {
    marginBottom: 12,
  },
  announcementTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  announcementMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  announcementTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    lineHeight: 22,
  },
  announcementContent: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  announcementFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  authorAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  authorInitial: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  authorDetails: {
    flex: 1,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
  },
  dateText: {
    fontSize: 12,
    marginTop: 2,
  },
  readIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  readText: {
    fontSize: 12,
    fontWeight: '500',
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
    paddingVertical: 60,
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
    marginBottom: 24,
  },
  createFirstButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createFirstButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 