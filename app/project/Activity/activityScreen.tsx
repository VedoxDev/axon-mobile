import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const projectName = 'My Space App';

// Mocked task data
const tasks = [
  { id: '1', title: 'Diseñar UI', status: 'completed', timestamp: '2024-06-10 09:00' },
  { id: '2', title: 'Revisar código', status: 'added', timestamp: '2024-06-09 15:00' },
  { id: '3', title: 'Implementar API', status: 'edited', timestamp: '2024-06-09 14:00' },
  { id: '4', title: 'Testing', status: 'completed', timestamp: '2024-06-08 18:30' },
  { id: '5', title: 'Nueva tarea de QA', status: 'added', timestamp: '2024-06-08 17:00' },
  { id: '6', title: 'Actualizar documentación', status: 'edited', timestamp: '2024-06-07 11:45' },
  { id: '7', title: 'Deploy producción', status: 'completed', timestamp: '2024-06-06 10:00' },
];

const STATUS_LABELS = {
  completed: 'Tareas completadas',
  added: 'Nuevas tareas',
  edited: 'Tareas editadas',
};

const STATUS_COLORS = {
  completed: '#42A5F5', // blue
  added: '#FFB74D',    // orange
  edited: '#FFB74D',   // orange
};

// Calculate progress
const totalTasks = tasks.length;
const completedTasks = tasks.filter(t => t.status === 'completed').length;
const progress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

// Group tasks by status
const grouped = {
  completed: tasks.filter(t => t.status === 'completed'),
  added: tasks.filter(t => t.status === 'added'),
  edited: tasks.filter(t => t.status === 'edited'),
};

type StatusKey = 'completed' | 'added' | 'edited';

export default function ActivityScreen() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const router = useRouter();

  return (
    <View style={[styles.container, { backgroundColor: colorScheme === 'dark' ? theme.card : theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.projectTitle}>{projectName}</Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>{progress}% completado</Text>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
        </View>
      </View>

      {/* Activity Sections */}
      <FlatList
        data={['completed', 'added', 'edited'] as StatusKey[]}
        keyExtractor={key => key}
        renderItem={({ item: status }: { item: StatusKey }) => (
          grouped[status].length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{STATUS_LABELS[status]}</Text>
              {grouped[status].map(task => (
                <View key={task.id} style={styles.activityCard}>
                  <View style={[styles.badge, { backgroundColor: STATUS_COLORS[status] }]} />
                  <View style={styles.activityContent}>
                    <Text style={styles.taskTitle}>{task.title}</Text>
                    <Text style={styles.timestamp}>{task.timestamp}</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : null
        )}
        contentContainerStyle={styles.sectionsContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#181A20',
    padding: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 45,
  },
  backButton: {
    marginRight: 16,
    marginLeft: 16,
    backgroundColor: '#42A5F5',
    borderRadius: 20,
    padding: 6,
  },
  projectTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 10,
  },
  progressText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  progressBarBg: {
    width: '80%',
    height: 18,
    backgroundColor: '#3A3A3A',
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#42A5F5',
    borderRadius: 10,
  },
  sectionsContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  section: {
    backgroundColor: '#3A3A3A',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  badge: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 14,
  },
  activityContent: {
    flex: 1,
  },
  taskTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  timestamp: {
    color: '#aaa',
    fontSize: 12,
    marginTop: 2,
  },
}); 