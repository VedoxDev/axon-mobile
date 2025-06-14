import { View, StyleSheet, TouchableOpacity, Text, Dimensions, ActivityIndicator, ScrollView } from 'react-native';
import { Slot, Tabs, usePathname, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import React from 'react';
import AnimatedProjectButton from '@/components/AnimatedProjectButton';
import { Project } from '@/services/projectService';
import { useProjectContext } from '@/contexts/ProjectContext';
import { AnnouncementService, ProjectAnnouncement } from '@/services/announcementService';
import { useFocusEffect } from '@react-navigation/native';


const SIDEBAR_WIDTH = 70;
const SCREEN_WIDTH = Dimensions.get('window').width;
const EXPANDED_WIDTH = SCREEN_WIDTH;

// Calculate consistent project grid layout
const PROJECTS_PER_ROW = 6;
const GRID_PADDING = 30; // 15px on each side
const PROJECT_SPACING = 10;
const TOTAL_SPACING = (PROJECTS_PER_ROW - 1) * PROJECT_SPACING;
const AVAILABLE_WIDTH = EXPANDED_WIDTH - GRID_PADDING;
const PROJECT_BUTTON_WIDTH = (AVAILABLE_WIDTH - TOTAL_SPACING) / PROJECTS_PER_ROW;

// Layout heights for better space management
const TOP_SECTION_HEIGHT = 120; // Space for buttons and title
const TOTAL_SCREEN_HEIGHT = Dimensions.get('window').height;
const PROJECT_DETAILS_HEIGHT = 520; // Fixed size for consistent project details across all devices
const PROJECT_GRID_MAX_HEIGHT = TOTAL_SCREEN_HEIGHT - TOP_SECTION_HEIGHT - PROJECT_DETAILS_HEIGHT; // Grid takes remaining space

// Add sample members data
const SAMPLE_MEMBERS = [
  { id: '1', name: 'Juan', avatar: 'J' },
  { id: '2', name: 'María', avatar: 'M' },
  { id: '3', name: 'Carlos', avatar: 'C' },
  { id: '4', name: 'Ana', avatar: 'A' },
];

// Role translation function
const translateRole = (role: string) => {
  const roleTranslations = {
    'owner': 'Propietario',
    'admin': 'Colaborador', 
    'member': 'Miembro'
  };
  return roleTranslations[role as keyof typeof roleTranslations] || role;
};

export default function HomeLayout() {
  const pathname = usePathname();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showProjectDetailsCard, setShowProjectDetailsCard] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [latestAnnouncement, setLatestAnnouncement] = useState<ProjectAnnouncement | null>(null);
  const [announcementCache, setAnnouncementCache] = useState<{[projectId: string]: {announcement: ProjectAnnouncement | null, timestamp: number}}>({});
  const [loadingAnnouncement, setLoadingAnnouncement] = useState(false);

  // Use the project context instead of the hook directly
  const { projects, isLoading, error, refetch } = useProjectContext();

  // Cache timeout: 5 minutes
  const CACHE_TIMEOUT = 5 * 60 * 1000;

  // Refresh projects when returning to home screen
  useFocusEffect(
    React.useCallback(() => {
      console.log('Home screen focused - refreshing projects');
      refetch();
      // Clear announcement cache when returning to home to ensure fresh data
      setAnnouncementCache({});
    }, []) // Remove refetch dependency to prevent infinite loops
  );

  // Fetch latest announcement for selected project
  const fetchLatestAnnouncement = React.useCallback(async (projectId: string) => {
    const now = Date.now();
    const cached = announcementCache[projectId];

    // Check if we have recent cached data
    if (cached && (now - cached.timestamp) < CACHE_TIMEOUT) {
      console.log(`Using cached announcement for project ${projectId}`);
      setLatestAnnouncement(cached.announcement);
      return;
    }

    try {
      setLoadingAnnouncement(true);
      console.log(`Fetching announcements for project ${projectId}`);
      
      const announcements = await AnnouncementService.getProjectAnnouncements(projectId);
      
      // Get the most recent announcement (they're already sorted by newest first)
      const latestAnn = announcements.length > 0 ? announcements[0] : null;
      
      // Update cache
      setAnnouncementCache(prev => ({
        ...prev,
        [projectId]: {
          announcement: latestAnn,
          timestamp: now
        }
      }));
      
      setLatestAnnouncement(latestAnn);
    } catch (error: any) {
      console.error('Error fetching latest announcement:', error);
      // Set null announcement on error (will show "No hay anuncios recientes")
      setLatestAnnouncement(null);
      
      // Cache the null result to avoid repeated failed calls
      setAnnouncementCache(prev => ({
        ...prev,
        [projectId]: {
          announcement: null,
          timestamp: now
        }
      }));
    } finally {
      setLoadingAnnouncement(false);
    }
  }, [announcementCache]);

  const sidebarWidth = useSharedValue(SIDEBAR_WIDTH);
  const contentTranslate = useSharedValue(0);
  const mensajesTextOpacity = useSharedValue(0);
  const projectsTitleOpacity = useSharedValue(0);
  const projectDetailsTranslateY = useSharedValue(500);
  const projectDetailsOpacity = useSharedValue(0);
  const topButtonsTranslateY = useSharedValue(-20);
  const topButtonsOpacity = useSharedValue(0);
  const floatingSettingsOpacity = useSharedValue(0);
  const projectGridScrollHeight = useSharedValue(0);
  const collapsedScrollHeight = useSharedValue(300); // Initial height for collapsed state
  const projectDetailsContainerHeight = useSharedValue(0);

  useEffect(() => {
    if (selectedProject) {
      setIsAnimating(true);
      sidebarWidth.value = withTiming(EXPANDED_WIDTH, { duration: 350 });
      contentTranslate.value = withTiming(EXPANDED_WIDTH, { duration: 350 });
      topButtonsTranslateY.value = withTiming(0, { duration: 300 });
      topButtonsOpacity.value = withTiming(1, { duration: 300 });
      floatingSettingsOpacity.value = withTiming(0, { duration: 200 });
      projectGridScrollHeight.value = withTiming(PROJECT_GRID_MAX_HEIGHT, { duration: 250 });
      collapsedScrollHeight.value = withTiming(0, { duration: 200 });
      projectDetailsContainerHeight.value = withTiming(PROJECT_DETAILS_HEIGHT, { duration: 300 });
      setTimeout(() => setIsAnimating(false), 350);
    } else {
      setIsAnimating(true);
      // Start ScrollView height animations immediately and faster
      projectGridScrollHeight.value = withTiming(0, { duration: 150 });
      collapsedScrollHeight.value = withTiming(300, { duration: 200 });
      projectDetailsContainerHeight.value = withTiming(0, { duration: 200 });
      
      // Start sidebar collapse after a short delay
      setTimeout(() => {
        sidebarWidth.value = withTiming(SIDEBAR_WIDTH, { duration: 300 });
        contentTranslate.value = withTiming(SIDEBAR_WIDTH, { duration: 300 });
        topButtonsTranslateY.value = withTiming(-20, { duration: 250 });
        topButtonsOpacity.value = withTiming(0, { duration: 250 });
      }, 50);
      
      setTimeout(() => {
        floatingSettingsOpacity.value = withTiming(1, { duration: 200 });
      }, 200);
      setTimeout(() => setIsAnimating(false), 350);
    }
  }, [selectedProject]);

  useEffect(() => {
    if (selectedProject) {
      setShowProjectDetailsCard(true);
      mensajesTextOpacity.value = withTiming(1, { duration: 350 });
      projectsTitleOpacity.value = withTiming(1, { duration: 350 });
      projectDetailsTranslateY.value = withTiming(0, { duration: 400 });
      projectDetailsOpacity.value = withTiming(1, { duration: 400 });
      
      // Fetch latest announcement for this project
      fetchLatestAnnouncement(selectedProject.id);
    } else {
      mensajesTextOpacity.value = withTiming(0, { duration: 350 });
      projectsTitleOpacity.value = withTiming(0, { duration: 350 });
      projectDetailsTranslateY.value = withTiming(500, { duration: 400 });
      projectDetailsOpacity.value = withTiming(0, { duration: 400 });
      setTimeout(() => setShowProjectDetailsCard(false), 400);
      
      // Clear latest announcement when no project is selected
      setLatestAnnouncement(null);
    }
  }, [selectedProject]);

  const sidebarAnimStyle = useAnimatedStyle(() => ({
    width: sidebarWidth.value,
  }));
  const contentAnimStyle = useAnimatedStyle(() => ({
    width: SCREEN_WIDTH,
    transform: [{ translateX: sidebarWidth.value - SIDEBAR_WIDTH }],
    marginLeft: SIDEBAR_WIDTH,
  }));

  const mensajeTextAnimStyle = useAnimatedStyle(() => ({
    opacity: mensajesTextOpacity.value,
  }));

  const projectsTitleAnimStyle = useAnimatedStyle(() => ({
    opacity: projectsTitleOpacity.value,
  }));

  const projectDetailsAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: projectDetailsTranslateY.value }],
    opacity: projectDetailsOpacity.value,
  }));

  const topButtonsAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: topButtonsTranslateY.value }],
    opacity: topButtonsOpacity.value,
  }));

  const floatingSettingsAnimStyle = useAnimatedStyle(() => ({
    opacity: floatingSettingsOpacity.value,
  }));

  const projectGridScrollAnimStyle = useAnimatedStyle(() => ({
    height: projectGridScrollHeight.value,
    opacity: projectGridScrollHeight.value > 50 ? 1 : 0,
  }));

  const collapsedScrollAnimStyle = useAnimatedStyle(() => ({
    height: collapsedScrollHeight.value,
    opacity: collapsedScrollHeight.value > 50 ? 1 : 0,
  }));

  const projectDetailsContainerAnimStyle = useAnimatedStyle(() => ({
    height: projectDetailsContainerHeight.value,
    opacity: projectDetailsContainerHeight.value > 50 ? 1 : 0,
  }));

  const showSidebar = !pathname.startsWith('/(tabs)/chat/');

  const toggleSidebar = () => {
    if (selectedProject) {
      setSelectedProject(null);
      setIsSidebarExpanded(false);
    } else {
      // Select the first project by default, but only if projects exist
      if (projects.length > 0) {
        setSelectedProject(projects[0]);
        setIsSidebarExpanded(true);
      }
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colorScheme === 'dark' ? theme.background : theme.card, paddingTop: insets.top, overflow: 'hidden' }]}> 
      {showSidebar && (
        <Animated.View 
          style={[
            styles.sidebar, 
            { 
              backgroundColor: colorScheme === 'dark' ? theme.background : theme.card,
              paddingTop: insets.top, 
              paddingBottom: 0,
              alignItems: selectedProject ? 'stretch' : 'center',
            },
            sidebarAnimStyle,
          ]}
        >
          {selectedProject ? (
            <>
              <Animated.View style={[styles.topButtonsContainer, topButtonsAnimStyle]}>
                <TouchableOpacity style={styles.largeMensajesButton} onPress={() => {
                  router.push('/home');
                  setSelectedProject(null); // Collapse the sidebar
                  setIsSidebarExpanded(false);
                }}>
                  <Ionicons name="chatbubble" size={24} color={ colorScheme === 'dark' ? theme.text : theme.background } style={{ marginRight: 10 }} />
                  <Animated.View style={mensajeTextAnimStyle}>
                    <Text style={[styles.largeMensajesText, { color: colorScheme === 'dark' ? theme.text : theme.background }]}>Mensajes</Text>
                  </Animated.View>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.settingsButtonExpanded, { backgroundColor: theme.settingsButton }]}
                  onPress={() => router.push('/project/Settings/settingsScreen')}
                >
                  <Ionicons name="settings-outline" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </Animated.View>
              <Animated.View style={[projectsTitleAnimStyle, { width: '100%', alignItems: 'flex-start' }]}>
                <Text style={[styles.projectsTitle, { color: theme.text, textAlign: 'left', paddingLeft: 0 }]}>Tus proyectos</Text>
              </Animated.View>
              <Animated.ScrollView 
                style={[styles.projectGridScrollView, projectGridScrollAnimStyle]}
                contentContainerStyle={styles.projectGridScrollContent}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled={true}
              >
                <View pointerEvents={isAnimating ? 'none' : 'auto'} style={styles.projectGrid}>
                  {isLoading ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="small" color={theme.text} />
                      <Text style={[styles.loadingText, { color: theme.text }]}>Cargando...</Text>
                    </View>
                  ) : error ? (
                    <View style={styles.errorContainer}>
                      <Text style={[styles.errorText, { color: theme.red || '#ff4444' }]}>Error: {error}</Text>
                      <TouchableOpacity onPress={refetch} style={[styles.retryButton, { borderColor: theme.orange }]}>
                        <Text style={[styles.retryText, { color: theme.orange }]}>Reintentar</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <>
                      {projects.map((project, index) => (
                        <AnimatedProjectButton
                          key={project.id}
                          project={project}
                          selectedProject={selectedProject}
                          setSelectedProject={setSelectedProject}
                          index={index}
                          projectsPerRow={PROJECTS_PER_ROW}
                          buttonWidth={PROJECT_BUTTON_WIDTH}
                          buttonSpacing={PROJECT_SPACING}
                        />
                      ))}
                      <TouchableOpacity 
                        onPress={() => router.push('/project/NewProject/newProject')} 
                        style={[
                          styles.sidebarButton, 
                          styles.addProjectButton, 
                          { 
                            borderColor: theme.orange,
                            width: PROJECT_BUTTON_WIDTH,
                            height: PROJECT_BUTTON_WIDTH,
                            marginRight: (projects.length % PROJECTS_PER_ROW === PROJECTS_PER_ROW - 1) ? 0 : PROJECT_SPACING,
                            marginBottom: 15,
                          }
                        ]}
                      >
                        <Ionicons name="add" size={24} color={theme.text} />
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </Animated.ScrollView>
            </>
          ) : (
            <>
              <TouchableOpacity 
                style={[styles.sidebarButton, styles.messagesButton, { backgroundColor: theme.chatButton }]}
                onPress={() => router.push('/home')}
              >
                <Ionicons name="chatbubble" size={24} color="#fff" />
              </TouchableOpacity>
              <View style={[styles.separator, { backgroundColor: theme.separator }]} />
              <Animated.ScrollView 
                style={[styles.collapsedSidebarScrollView, collapsedScrollAnimStyle]}
                contentContainerStyle={styles.collapsedSidebarScrollContent}
                showsVerticalScrollIndicator={false}
              >
                <View pointerEvents={isAnimating ? 'none' : 'auto'}>
                  {isLoading ? (
                    <View style={styles.sidebarLoadingContainer}>
                      <ActivityIndicator size="small" color={theme.text} />
                    </View>
                  ) : error ? (
                    <TouchableOpacity 
                      onPress={refetch}
                      style={[styles.sidebarButton, { backgroundColor: theme.red || '#ff4444' }]}
                    >
                      <Ionicons name="refresh" size={24} color="#fff" />
                    </TouchableOpacity>
                  ) : (
                    projects.map((project) => (
                      <TouchableOpacity
                        key={project.id}
                        style={[styles.sidebarButton, { backgroundColor: project.color }]}
                        onPress={() => setSelectedProject(project)}
                      >
                        <Text style={styles.projectButtonText}>{project.name.charAt(0)}</Text>
                      </TouchableOpacity>
                    ))
                  )}
                </View>
                <TouchableOpacity onPress={() => router.push('/project/NewProject/newProject')} style={[styles.sidebarButton, styles.addProjectButton, { borderColor: theme.orange }]}>
                  <Ionicons name="add" size={24} color={theme.text} />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.sidebarButton, { backgroundColor: theme.settingsButton, marginTop: 20 }]}
                  onPress={() => router.push('/project/Settings/settingsScreen')}
                >
                  <Ionicons name="settings-outline" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </Animated.ScrollView>
            </>
          )}

          <Animated.View style={[projectDetailsContainerAnimStyle, { overflow: 'hidden' }]}>
            {showProjectDetailsCard && (
              <Animated.View style={[styles.projectDetailsCard, { backgroundColor: theme.inputBackground }, projectDetailsAnimStyle]}> 
              <ScrollView 
                style={styles.projectDetailsScrollView}
                contentContainerStyle={styles.projectDetailsScrollContent}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled={true}
              >
                <View style={styles.projectHeader}>
                  <View style={styles.projectTitleContainer}>
                    <Text style={[styles.projectTitle, { color: theme.text }]}>{selectedProject?.name}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: theme.primary + '20' }]}>
                      <Text style={[styles.statusText, { color: theme.primary }]}>{translateRole(selectedProject?.role || 'member')}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.projectButtonsContainer}>
                    {/* View Members Button - Always visible */}
                    <TouchableOpacity 
                      style={[styles.viewMembersButtonTop, { 
                        backgroundColor: theme.gray + '15',
                        borderColor: theme.orange
                      }]}
                      onPress={() => {
                        if (selectedProject) {
                          router.push({
                            pathname: '/project/Members/membersScreen',
                            params: {
                              projectId: selectedProject.id,
                              projectName: selectedProject.name
                            }
                          });
                        }
                      }}
                    >
                      <Ionicons name="people" size={16} color={theme.gray} />
                    </TouchableOpacity>
                    
                    {/* Invite Members Button - Only show for admin/owner roles */}
                    {selectedProject?.role && selectedProject.role !== 'member' && (
                      <TouchableOpacity 
                        style={[styles.inviteMembersButtonTop, { 
                          backgroundColor: theme.primary + '15',
                          borderColor: theme.primary + '40'
                        }]}
                        onPress={() => {
                          if (selectedProject) {
                            router.push({
                              pathname: '/project/InviteMembers/inviteMembers',
                              params: {
                                projectId: selectedProject.id,
                                projectName: selectedProject.name
                              }
                            });
                          }
                        }}
                      >
                        <Ionicons name="person-add" size={16} color={theme.primary} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
                
                {selectedProject?.description && (
                  <Text style={[styles.projectDescription, { color: theme.gray }]}>{selectedProject?.description}</Text>
                )}
                
                <View style={[
                  styles.projectStatus, 
                  { backgroundColor: theme.card },
                  !selectedProject?.description && styles.projectStatusExpanded
                ]}>
                  <View style={styles.statusItem}>
                    <Text style={[styles.statusLabel, { color: theme.gray, textAlign: 'left' }]}>📣 Último anuncio</Text>
                    {loadingAnnouncement ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                        <ActivityIndicator size="small" color={theme.gray} />
                        <Text style={[styles.statusValue, { color: theme.gray, fontStyle: 'italic' }]}>
                          Cargando anuncio...
                        </Text>
                      </View>
                    ) : latestAnnouncement ? (
                      <Text style={[
                        styles.statusValue, 
                        { color: theme.text },
                        !selectedProject?.description && styles.statusValueExpanded
                      ]} numberOfLines={!selectedProject?.description ? 4 : 2} ellipsizeMode="tail">
                        {latestAnnouncement.title}
                      </Text>
                    ) : (
                      <Text style={[
                        styles.statusValue, 
                        { color: theme.gray, fontStyle: 'italic' },
                        !selectedProject?.description && styles.statusValueExpanded
                      ]} numberOfLines={!selectedProject?.description ? 4 : 2} ellipsizeMode="tail">
                        No hay anuncios recientes
                      </Text>
                    )}
                  </View>
                </View>

                {/* Quick Actions */}
                <View style={styles.quickActions}>
                  <TouchableOpacity 
                    style={[styles.actionButton, { backgroundColor: theme.primary }]}
                    onPress={() => {
                      if (selectedProject) {
                        router.push({
                          pathname: '/project/Task/taskScreen',
                          params: {
                            projectId: selectedProject.id,
                            projectName: selectedProject.name
                          }
                        });
                      }
                    }}
                  >
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                    <Text style={styles.actionButtonText}>Ver Tareas</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.actionButton, { backgroundColor: theme.chatButton }]}
                    onPress={() => {
                      if (selectedProject) {
                        router.push({
                          pathname: '/chat/[chatId]',
                          params: {
                            chatId: selectedProject.id,
                            chatType: 'project',
                            chatName: selectedProject.name
                          }
                        });
                      }
                    }}
                  >
                    <Ionicons name="chatbubble" size={20} color="#fff" />
                    <Text style={styles.actionButtonText}>Chat</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.actionButton, { backgroundColor: theme.orange }]}
                    onPress={() => {
                      if (selectedProject) {
                        router.push({
                          pathname: '/project/Calendar/calendarScreen',
                          params: {
                            projectId: selectedProject.id,
                            projectName: selectedProject.name
                          }
                        });
                      }
                    }}
                  >
                    <Ionicons name="calendar" size={20} color="#fff" />
                    <Text style={styles.actionButtonText}>Itinerario</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.actionButton, { backgroundColor: theme.gray }]}
                    onPress={() => {
                      if (selectedProject) {
                        router.push({
                          pathname: '/project/Announcements/announcementsScreen',
                          params: {
                            projectId: selectedProject.id,
                            projectName: selectedProject.name
                          }
                        });
                      }
                    }}
                  >
                    <Ionicons name="megaphone" size={20} color="#fff" />
                    <Text style={styles.actionButtonText}>Anuncios</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </Animated.View>
            )}
          </Animated.View>
        </Animated.View>
      )}

      <Animated.View
        style={[
          styles.content,
          { backgroundColor: theme.inputBackground, borderTopLeftRadius: 20, overflow: 'hidden' },
          contentAnimStyle,
        ]}
      >
        <Slot />
      </Animated.View>



    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    position: 'relative',
    overflow: 'hidden',
  },
  sidebar: {
    width: 70,
    backgroundColor: '#2a2a2a',
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'flex-start',
    zIndex: 2,
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
  },
  sidebarButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#3a3a3a',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  messagesButton: {
    backgroundColor: '#0066cc',
  },
  separator: {
    width: '60%',
    height: 1,
    marginVertical: 15,
  },
  projectButtonText: {
    color: '#1a1a1a',
    fontSize: 20,
    fontWeight: 'bold',
  },
  addProjectButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    marginTop: 10,
    borderRadius: 24,
  },
  projectGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  projectGridButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  projectDetailsCard: {
    height: PROJECT_DETAILS_HEIGHT,
    borderRadius: 18,
    padding: 20,
    elevation: 2,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    marginTop: 0,
    marginBottom: 0,
    marginHorizontal: 16,
    borderBottomWidth: 0,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    flex: 1,
  },
  projectTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    flex: 1,
  },

  content: {
    flex: 1,
    zIndex: 1,
  },
  topButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  largeMensajesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0066cc',
    borderRadius: 24,
    height: 48,
    flex: 1,
    marginRight: 10,
    paddingLeft: 15,
  },
  largeMensajesText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  projectsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginHorizontal: 20,
    marginBottom: 10,
    marginTop: 5,
    paddingLeft: 20,
  },
  settingsButton: {
    position: 'absolute',
    bottom: 20,
    left: 10,
    zIndex: 3,
  },
  settingsButtonExpanded: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  projectTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  projectDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  projectStatus: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  statusItem: {
    alignItems: 'flex-start',
  },
  quickActions: {
    flexDirection: 'column',
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  membersSection: {
    marginBottom: 20,
  },
  membersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  membersTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  memberCount: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  memberCountText: {
    fontSize: 12,
    fontWeight: '500',
  },
  membersList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  memberAvatar: {
    alignItems: 'center',
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
  },
  memberName: {
    fontSize: 12,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
  },
  sidebarLoadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  errorContainer: {
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 10,
  },
  retryButton: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  retryText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  statusValue: {
    fontSize: 16,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  projectGridScrollView: {
    maxHeight: PROJECT_GRID_MAX_HEIGHT,
    flexGrow: 0,
    flexShrink: 1,
  },
  projectGridScrollContent: {
    paddingBottom: 10,
  },
  projectDetailsScrollView: {
    flex: 1,
  },
  projectDetailsScrollContent: {
    paddingBottom: 10,
  },
  collapsedSidebarScrollView: {
    flex: 1,
  },
  collapsedSidebarScrollContent: {
    alignItems: 'center',
    paddingBottom: 10,
  },
  inviteMembersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
    gap: 6,
  },
  projectButtonsContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  viewMembersButtonTop: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  inviteMembersButtonTop: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  inviteMembersText: {
    fontSize: 14,
    fontWeight: '500',
  },
  projectStatusExpanded: {
    minHeight: 80,
    paddingVertical: 20,
  },
  statusValueExpanded: {
    fontSize: 14,
    lineHeight: 18,
  },
});
