import { View, StyleSheet, TouchableOpacity, Text, Dimensions } from 'react-native';
import { Slot, Tabs, usePathname } from 'expo-router';
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
];

const SIDEBAR_WIDTH = 70;
const EXPANDED_WIDTH = 330;
const SCREEN_WIDTH = Dimensions.get('window').width;

// ...imports stay the same

export default function HomeLayout() {
  const pathname = usePathname();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showProjectDetailsCard, setShowProjectDetailsCard] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const sidebarWidth = useSharedValue(SIDEBAR_WIDTH);
  const contentTranslate = useSharedValue(0);
  const mensajesTextOpacity = useSharedValue(0);
  const projectsTitleOpacity = useSharedValue(0);
  const projectDetailsTranslateY = useSharedValue(500);
  const projectDetailsOpacity = useSharedValue(0);

  useEffect(() => {
    if (selectedProject) {
      setIsAnimating(true);
      sidebarWidth.value = withTiming(EXPANDED_WIDTH, { duration: 350 });
      contentTranslate.value = withTiming(EXPANDED_WIDTH, { duration: 350 });
      setTimeout(() => setIsAnimating(false), 350);
    } else {
      setIsAnimating(true);
      sidebarWidth.value = withTiming(SIDEBAR_WIDTH, { duration: 350 });
      contentTranslate.value = withTiming(SIDEBAR_WIDTH, { duration: 350 });
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

  const showSidebar = !pathname.startsWith('/(tabs)/chat/');

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
              <TouchableOpacity style={styles.largeMensajesButton} onPress={() => setSelectedProject(null)}>
                <Ionicons name="chatbubble" size={24} color={ colorScheme === 'dark' ? theme.text : theme.background } style={{ marginRight: 10 }} />
                <Animated.View style={mensajeTextAnimStyle}>
                  <Text style={[styles.largeMensajesText, { color: colorScheme === 'dark' ? theme.text : theme.background }]}>Mensajes</Text>
                </Animated.View>
              </TouchableOpacity>
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
                <TouchableOpacity style={[styles.projectGridButton, styles.addProjectButton]}>
                  <Ionicons name="add" size={24} color={theme.text} />
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <TouchableOpacity 
                style={[styles.sidebarButton, styles.messagesButton]}
                onPress={() => setSelectedProject(null)}
              >
                <Ionicons name="chatbubble" size={24} color="#fff" />
              </TouchableOpacity>
              <View style={[styles.separator, { backgroundColor: colorScheme === 'dark' ? theme.card : theme.text }]} />
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
              <TouchableOpacity style={[styles.sidebarButton, styles.addProjectButton]}>
                <Ionicons name="add" size={24} color={theme.text} />
              </TouchableOpacity>
            </>
          )}

          {showProjectDetailsCard && (
            <Animated.View style={[styles.projectDetailsCard, { backgroundColor: theme.inputBackground }, projectDetailsAnimStyle]}> 
              <Text style={[styles.projectTitle, { color: theme.text }]}>{selectedProject?.name}</Text>
              <Text style={{ color: theme.text, marginBottom: 10 }}>Rediseño Web de Axon</Text>
              <View style={styles.projectTabs}>
                <View style={styles.tabItem}>
                  <Ionicons name="checkmark-circle" size={18} color={theme.text} style={styles.tabIcon} />
                  <Text style={[styles.projectTab, { color: theme.text }]}>Tareas</Text>
                </View>
                <View style={styles.tabItem}>
                  <Ionicons name="chatbubble" size={18} color={theme.text} style={styles.tabIcon} />
                  <Text style={[styles.projectTab, { color: theme.text }]}>Chat</Text>
                </View>
                <View style={styles.tabItem}>
                  <Ionicons name="calendar" size={18} color={theme.text} style={styles.tabIcon} />
                  <Text style={[styles.projectTab, { color: theme.text }]}>Calendario</Text>
                </View>
                <View style={styles.tabItem}>
                  <Ionicons name="pulse" size={18} color={theme.text} style={styles.tabIcon} />
                  <Text style={[styles.projectTab, { color: theme.text }]}>Actividad</Text>
                </View>
                <View style={styles.tabItem}>
                  <Ionicons name="folder" size={18} color={theme.text} style={styles.tabIcon} />
                  <Text style={[styles.projectTab, { color: theme.text }]}>Archivos</Text>
                </View>
                <View style={styles.tabItem}>
                  <Ionicons name="people" size={18} color={theme.text} style={styles.tabIcon} />
                  <Text style={[styles.projectTab, { color: theme.text }]}>Reuniones</Text>
                </View>
                <View style={styles.tabItem}>
                  <Ionicons name="megaphone" size={18} color={theme.text} style={styles.tabIcon} />
                  <Text style={[styles.projectTab, { color: theme.text }]}>Anuncios</Text>
                </View>
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
    backgroundColor: '#444',
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
    borderColor: '#555',
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
    shadowColor: '#000',
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
  largeMensajesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0066cc',
    borderRadius: 24,
    height: 48,
    paddingHorizontal: 20,
    alignSelf: 'stretch',
    marginHorizontal: 10,
    marginTop: 0,
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
});
