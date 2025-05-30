import { View, StyleSheet, TouchableOpacity, Text, Dimensions } from 'react-native';
import { Slot, Tabs, usePathname, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import React from 'react';
import AnimatedProjectButton from '@/components/AnimatedProjectButton';

// Define a type for a project
interface Project {
  id: string;
  name: string;
  color: string;
}

const PROJECTS: Project[] = [
  { id: 'p1', name: 'Project A', color: '#FFB3BA' },
  { id: 'p2', name: 'Project B', color: '#BAFFC9' },
  { id: 'p3', name: 'Project C', color: '#BAE1FF' },
  { id: 'p4', name: 'Project D', color: '#FFFFBA' },
  { id: 'p5', name: 'Project E', color: '#FFDFBA' },
  { id: 'p6', name: 'Project F', color: '#BAFFC9' },
  { id: 'p7', name: 'Project G', color: '#FFDFBA' },
  { id: 'p8', name: 'Project H', color: '#BAE1FF' },
  { id: 'p9', name: 'Project I', color: '#FFB3BA' },
];

const SIDEBAR_WIDTH = 70;
const EXPANDED_WIDTH = 412;
const SCREEN_WIDTH = Dimensions.get('window').width;

// Add sample members data
const SAMPLE_MEMBERS = [
  { id: '1', name: 'Juan', avatar: 'J' },
  { id: '2', name: 'María', avatar: 'M' },
  { id: '3', name: 'Carlos', avatar: 'C' },
  { id: '4', name: 'Ana', avatar: 'A' },
];

// ...imports stay the same

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

  const sidebarWidth = useSharedValue(SIDEBAR_WIDTH);
  const contentTranslate = useSharedValue(0);
  const mensajesTextOpacity = useSharedValue(0);
  const projectsTitleOpacity = useSharedValue(0);
  const projectDetailsTranslateY = useSharedValue(500);
  const projectDetailsOpacity = useSharedValue(0);
  const topButtonsTranslateY = useSharedValue(-20);
  const topButtonsOpacity = useSharedValue(0);
  const floatingSettingsOpacity = useSharedValue(0);

  useEffect(() => {
    if (selectedProject) {
      setIsAnimating(true);
      sidebarWidth.value = withTiming(EXPANDED_WIDTH, { duration: 350 });
      contentTranslate.value = withTiming(EXPANDED_WIDTH, { duration: 350 });
      topButtonsTranslateY.value = withTiming(0, { duration: 300 });
      topButtonsOpacity.value = withTiming(1, { duration: 300 });
      floatingSettingsOpacity.value = withTiming(0, { duration: 200 });
      setTimeout(() => setIsAnimating(false), 350);
    } else {
      setIsAnimating(true);
      sidebarWidth.value = withTiming(SIDEBAR_WIDTH, { duration: 350 });
      contentTranslate.value = withTiming(SIDEBAR_WIDTH, { duration: 350 });
      topButtonsTranslateY.value = withTiming(-20, { duration: 300 });
      topButtonsOpacity.value = withTiming(0, { duration: 300 });
      setTimeout(() => {
        floatingSettingsOpacity.value = withTiming(1, { duration: 200 });
      }, 150);
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
    } else {
      mensajesTextOpacity.value = withTiming(0, { duration: 350 });
      projectsTitleOpacity.value = withTiming(0, { duration: 350 });
      projectDetailsTranslateY.value = withTiming(500, { duration: 400 });
      projectDetailsOpacity.value = withTiming(0, { duration: 400 });
      setTimeout(() => setShowProjectDetailsCard(false), 400);
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

  const showSidebar = !pathname.startsWith('/(tabs)/chat/');

  const toggleSidebar = () => {
    if (selectedProject) {
      setSelectedProject(null);
      setIsSidebarExpanded(false);
    } else {
      setSelectedProject(PROJECTS[0]); // Select the first project by default
      setIsSidebarExpanded(true);
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
              paddingBottom: insets.bottom,
            },
            sidebarAnimStyle,
          ]}
        >
          {selectedProject ? (
            <>
              <Animated.View style={[styles.topButtonsContainer, topButtonsAnimStyle]}>
                <TouchableOpacity style={styles.largeMensajesButton} onPress={toggleSidebar}>
                  <Ionicons name="chatbubble" size={24} color={ colorScheme === 'dark' ? theme.text : theme.background } style={{ marginRight: 10 }} />
                  <Animated.View style={mensajeTextAnimStyle}>
                    <Text style={[styles.largeMensajesText, { color: colorScheme === 'dark' ? theme.text : theme.background }]}>Mensajes</Text>
                  </Animated.View>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.settingsButtonExpanded, { backgroundColor: theme.settingsButton }]}
                  onPress={() => router.push('/project/Settings/settingsScreen')}
                >
                  <Ionicons name="settings-outline" size={24} color={theme.settingsIcon} />
                </TouchableOpacity>
              </Animated.View>
              <Animated.View style={[projectsTitleAnimStyle, { width: '100%', alignItems: 'flex-start' }]}>
                <Text style={[styles.projectsTitle, { color: theme.text, textAlign: 'left', paddingLeft: 0 }]}>Tus proyectos</Text>
              </Animated.View>
              <View pointerEvents={isAnimating ? 'none' : 'auto'} style={styles.projectGrid}>
                {PROJECTS.map((project) => (
                  <AnimatedProjectButton
                    key={project.id}
                    project={project}
                    selectedProject={selectedProject}
                    setSelectedProject={setSelectedProject}
                  />
                ))}
                <TouchableOpacity onPress={() => router.push('/project/NewProject/newProject')} style={[styles.sidebarButton, styles.addProjectButton, { borderColor: theme.orange }]}>
                <Ionicons name="add" size={24} color={theme.text} />
              </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <TouchableOpacity 
                style={[styles.sidebarButton, styles.messagesButton, { backgroundColor: theme.chatButton }]}
                onPress={toggleSidebar}
              >
                <Ionicons name="chatbubble" size={24} color="#fff" />
              </TouchableOpacity>
              <View style={[styles.separator, { backgroundColor: theme.separator }]} />
              <View pointerEvents={isAnimating ? 'none' : 'auto'}>
                {PROJECTS.map((project) => (
                  <TouchableOpacity
                    key={project.id}
                    style={[styles.sidebarButton, { backgroundColor: project.color }]}
                    onPress={() => setSelectedProject(project)}
                  >
                    <Text style={styles.projectButtonText}>{project.name.charAt(0)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity onPress={() => router.push('/project/NewProject/newProject')} style={[styles.sidebarButton, styles.addProjectButton, { borderColor: theme.orange }]}>
                <Ionicons name="add" size={24} color={theme.text} />
              </TouchableOpacity>
            </>
          )}

          {showProjectDetailsCard && (
            <Animated.View style={[styles.projectDetailsCard, { backgroundColor: theme.inputBackground }, projectDetailsAnimStyle]}> 
              <Text style={[styles.projectTitle, { color: theme.text }]}>{selectedProject?.name}</Text>
              <Text style={{ color: theme.text, marginBottom: 10 }}>Rediseño Web de Axon</Text>
              
              {/* Progress Section */}
              <View style={styles.progressSection}>
                <View style={styles.progressHeader}>
                  <Text style={[styles.progressTitle, { color: theme.text }]}>Progreso del Proyecto</Text>
                  <Text style={[styles.progressPercentage, { color: theme.progressBarText }]}>45%</Text>
                </View>
                <View style={[styles.progressBarContainer, { backgroundColor: theme.progressBarBackground }]}>
                  <View style={[styles.progressBarFill, { backgroundColor: theme.progressBarFill, width: '45%' }]} />
                </View>
              </View>

              {/* Members Section */}

              <View style={styles.projectTabs}>
                <TouchableOpacity 
                  style={styles.tabItem}
                  onPress={() => router.push('/project/Task/taskScreen')}
                >
                  <Ionicons name="checkmark-circle" size={18} color={theme.text} style={styles.tabIcon} />
                  <Text style={[styles.projectTab, { color: theme.text }]}>Tareas</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.tabItem}
                  onPress={toggleSidebar}
                >
                  <Ionicons name="chatbubble" size={18} color={theme.text} style={styles.tabIcon} />
                  <Text style={[styles.projectTab, { color: theme.text }]}>Chat</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.tabItem}
                  onPress={() => router.push('/project/Calendar/calendarScreen')}
                ><Ionicons name="calendar" size={18} color={theme.text} style={styles.tabIcon} />
                  <Text style={[styles.projectTab, { color: theme.text }]}>Calendario</Text>
                </TouchableOpacity>      
                <TouchableOpacity 
                  style={styles.tabItem}
                  onPress={() => router.push('/project/Activity/activityScreen')}
                >
                  <Ionicons name="pulse" size={18} color={theme.text} style={styles.tabIcon} />
                  <Text style={[styles.projectTab, { color: theme.text }]}>Actividad</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.tabItem}
                  onPress={() => router.push('/project/Files/filesScreen')}
                >
                  <Ionicons name="folder" size={18} color={theme.text} style={styles.tabIcon} />
                  <Text style={[styles.projectTab, { color: theme.text }]}>Archivos</Text>
                  </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.tabItem}
                  onPress={() => router.push('/project/Meetings/meetingScreen')}
                >
                  <Ionicons name="people" size={18} color={theme.text} style={styles.tabIcon} />
                  <Text style={[styles.projectTab, { color: theme.text }]}>Reuniones</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.tabItem}
                  onPress={() => router.push('/project/Announcements/annScreen')}
                >
                  <Ionicons name="megaphone" size={18} color={theme.text} style={styles.tabIcon} />
                  <Text style={[styles.projectTab, { color: theme.text }]}>Anuncios</Text>
                </TouchableOpacity>
                
              </View>
            </Animated.View>
          )}
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

      {showSidebar && !selectedProject && (
        <Animated.View style={[styles.settingsButton, floatingSettingsAnimStyle]}>
          <TouchableOpacity 
            style={[styles.sidebarButton, { backgroundColor: theme.settingsButton }]}
            onPress={() => router.push('/project/Settings/settingsScreen')}
          >
            <Ionicons name="settings-outline" size={24} color={theme.settingsIcon} />
          </TouchableOpacity>
        </Animated.View>
      )}
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
    alignItems: 'center',
    gap: 10,
    padding: 10,
    marginBottom: 10,
  },
  projectGridButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 4,
  },
  projectDetailsCard: {
    flex: 1,
    borderRadius: 18,
    margin: 10,
    padding: 16,
    elevation: 2,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    marginBottom: 0,
    borderBottomWidth: 0,
    marginHorizontal: 10,
    marginTop: 10,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  projectTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  projectTabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
    gap: 8,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
    marginBottom: 15,
  },
  tabIcon: {
    marginRight: 8,
  },
  projectTab: {
    fontSize: 15,
    backgroundColor: 'transparent',
  },
  content: {
    flex: 1,
    zIndex: 1,
  },
  topButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
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
    marginBottom: 0,
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
  progressSection: {
    marginBottom: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '500',
  },
  progressBarContainer: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
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
});
