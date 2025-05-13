import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type IconName = keyof typeof Ionicons.glyphMap;

export default function ProjectOverview() {
  const sections: { name: string; icon: IconName }[] = [
    { name: 'Tareas', icon: 'list-outline' },
    { name: 'Chat', icon: 'chatbubble-outline' },
    { name: 'Calendario', icon: 'calendar-outline' },
    { name: 'Actividad', icon: 'pulse-outline' },
    { name: 'Archivos', icon: 'folder-outline' },
    { name: 'Reuniones', icon: 'people-outline' },
    { name: 'Anuncios', icon: 'megaphone-outline' },
  ];

  return (
    <View style={styles.container}>
      {/* Project Bubbles */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.projectBubbles}
      >
        <TouchableOpacity style={[styles.projectBubble, styles.activeProject]}>
          <Ionicons name="code" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.projectBubble}>
          <Ionicons name="cart" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.projectBubble}>
          <Ionicons name="trash" size={24} color="#fff" />
        </TouchableOpacity>
      </ScrollView>

      {/* Project Overview */}
      <View style={styles.overview}>
        <View style={styles.projectHeader}>
          <View style={styles.projectIcon}>
            <Ionicons name="code" size={32} color="#fff" />
          </View>
          <View style={styles.projectInfo}>
            <Text style={styles.projectName}>AI App</Text>
            <View style={styles.members}>
              <View style={styles.avatar} />
              <View style={styles.avatar} />
              <View style={styles.avatar} />
              <Text style={styles.memberCount}>+9</Text>
            </View>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '65%' }]} />
          </View>
          <Text style={styles.progressText}>65%</Text>
        </View>

        {/* Sections */}
        <View style={styles.sections}>
          {sections.map((section, index) => (
            <TouchableOpacity key={index} style={styles.section}>
              <Ionicons name={section.icon} size={24} color="#fff" />
              <Text style={styles.sectionText}>{section.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  projectBubbles: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  projectBubble: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3a3a3a',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  activeProject: {
    backgroundColor: '#0066cc',
  },
  overview: {
    padding: 20,
  },
  projectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  projectIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#0066cc',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  projectInfo: {
    flex: 1,
  },
  projectName: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  members: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#3a3a3a',
    marginRight: -10,
    borderWidth: 2,
    borderColor: '#1a1a1a',
  },
  memberCount: {
    color: '#999',
    fontSize: 14,
    marginLeft: 15,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 30,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#2a2a2a',
    borderRadius: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0066cc',
    borderRadius: 4,
  },
  progressText: {
    color: '#fff',
    fontSize: 14,
  },
  sections: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  section: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  sectionText: {
    color: '#fff',
    fontSize: 14,
  },
}); 