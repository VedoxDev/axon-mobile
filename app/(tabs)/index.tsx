import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function DashboardScreen() {
  return (
    <ScrollView style={styles.container}>
      {/* Banner Image */}
      <Image
        source={{ uri: 'https://picsum.photos/800/400' }}
        style={styles.banner}
      />

      {/* Project Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>AI App</Text>
          <View style={styles.icons}>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="star" size={24} color="#FFA500" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="share" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Project Stats */}
        <View style={styles.stats}>
          <Text style={styles.statText}>12 miembros</Text>
          <Text style={styles.statText}>7 tareas pendientes</Text>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '65%' }]} />
          </View>
          <Text style={styles.progressText}>65%</Text>
        </View>
      </View>

      {/* Task List */}
      <View style={styles.taskList}>
        <Text style={styles.sectionTitle}>Tareas</Text>
        
        <View style={styles.task}>
          <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
          <Text style={styles.taskText}>Implementar autenticación</Text>
        </View>
        
        <View style={styles.task}>
          <Ionicons name="time" size={24} color="#FFA500" />
          <Text style={styles.taskText}>Diseñar UI/UX</Text>
        </View>
        
        <View style={styles.task}>
          <Ionicons name="time" size={24} color="#FFA500" />
          <Text style={styles.taskText}>Configurar base de datos</Text>
        </View>
      </View>

      {/* Chat Section */}
      <View style={styles.chatSection}>
        <Text style={styles.sectionTitle}>General</Text>
        <View style={styles.chatInput}>
          <TouchableOpacity style={styles.micButton}>
            <Ionicons name="mic" size={24} color="#fff" />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="Escribe un mensaje..."
            placeholderTextColor="#666"
          />
          <TouchableOpacity style={styles.sendButton}>
            <Ionicons name="send" size={24} color="#0066cc" />
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  banner: {
    width: '100%',
    height: 200,
  },
  header: {
    padding: 20,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  icons: {
    flexDirection: 'row',
    gap: 10,
  },
  iconButton: {
    padding: 5,
  },
  stats: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 15,
  },
  statText: {
    color: '#999',
    fontSize: 14,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
  taskList: {
    padding: 20,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  task: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 15,
  },
  taskText: {
    color: '#fff',
    fontSize: 16,
  },
  chatSection: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  chatInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  micButton: {
    padding: 5,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    marginHorizontal: 10,
  },
  sendButton: {
    padding: 5,
  },
});
