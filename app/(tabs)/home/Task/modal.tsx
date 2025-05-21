import { StyleSheet, Text, View, TouchableOpacity, Dimensions, Image, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

// Mock data for demonstration
const mockTask = {
  title: '[Hero Section] - Tamaño del hero',
  status: 'En proceso',
  statusColor: '#FFB74D',
  members: [
    { id: '1', name: 'Juan', avatar: 'https://i.pravatar.cc/150?img=1' },
    { id: '2', name: 'María', avatar: 'https://i.pravatar.cc/150?img=2' },
    { id: '3', name: 'Carlos', avatar: 'https://i.pravatar.cc/150?img=3' },
  ],
  dueDate: '11 dic, 14:00',
  description: 'Ajustar el tamaño del hero section para que sea más impactante y responsivo en diferentes dispositivos. Considerar las proporciones y el espaciado para una mejor experiencia de usuario.',
  imageUrl: 'https://picsum.photos/400/200',
  comments: [
    { id: '1', user: 'Juan', avatar: 'https://i.pravatar.cc/150?img=1', message: 'He empezado a trabajar en el diseño', time: '10:30 AM' },
    { id: '2', user: 'María', avatar: 'https://i.pravatar.cc/150?img=2', message: '¿Necesitas ayuda con algo específico?', time: '11:15 AM' },
    { id: '3', user: 'Carlos', avatar: 'https://i.pravatar.cc/150?img=3', message: 'Podemos revisar juntos los cambios', time: '11:45 AM' },
  ],
};

export default function Modal() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  return (
    <View style={styles.overlay}>
      <View
        style={[
          styles.modalContainer,
          {
            backgroundColor: theme.background,
            borderColor: mockTask.statusColor,
            borderWidth: 3,
            shadowColor: mockTask.statusColor,
            shadowOpacity: 0.3,
            shadowRadius: 12,
          },
        ]}
      >
        {/* Handle bar */}
        <View style={[styles.handleBar, { backgroundColor: mockTask.statusColor }]} />
        
        <ScrollView style={styles.scrollContent}>
          {/* Header with Title and Status */}
          <View style={styles.header}>
            <TouchableOpacity 
              onPress={() => router.back()}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
            <View style={styles.titleContainer}>
              <Text style={[styles.title, { color: theme.text }]}>{mockTask.title}</Text>
              <View style={[styles.statusPill, { backgroundColor: mockTask.statusColor }]}>
                <Text style={styles.statusText}>{mockTask.status}</Text>
              </View>
            </View>
          </View>

          {/* Members Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Miembros</Text>
            <View style={styles.membersContainer}>
              {mockTask.members.map((member) => (
                <View key={member.id} style={styles.memberItem}>
                  <Image source={{ uri: member.avatar }} style={styles.memberAvatar} />
                  <Text style={[styles.memberName, { color: theme.text }]}>{member.name}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Due Date Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Plazo de entrega</Text>
            <View style={styles.dueDateContainer}>
              <Text style={[styles.dueDate, { color: theme.text }]}>{mockTask.dueDate}</Text>
              <Ionicons name="chevron-down" size={20} color={theme.text} />
            </View>
          </View>

          {/* Description Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Descripción</Text>
              <TouchableOpacity>
                <Ionicons name="pencil" size={20} color={theme.text} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.description, { color: theme.text }]}>{mockTask.description}</Text>
          </View>

          {/* Image Preview */}
          <View style={styles.section}>
            <Image source={{ uri: mockTask.imageUrl }} style={styles.previewImage} />
          </View>

          {/* Comments Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Comentarios</Text>
            {mockTask.comments.map((comment) => (
              <View key={comment.id} style={styles.commentContainer}>
                <Image source={{ uri: comment.avatar }} style={styles.commentAvatar} />
                <View style={styles.commentContent}>
                  <View style={styles.commentHeader}>
                    <Text style={[styles.commentUser, { color: theme.text }]}>{comment.user}</Text>
                    <Text style={[styles.commentTime, { color: theme.gray }]}>{comment.time}</Text>
                  </View>
                  <Text style={[styles.commentMessage, { color: theme.text }]}>{comment.message}</Text>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const { height } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    height: height * 0.7,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  scrollContent: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  closeButton: {
    padding: 8,
  },
  titleContainer: {
    flex: 1,
    marginLeft: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  statusPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  membersContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  memberItem: {
    alignItems: 'center',
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: 4,
  },
  memberName: {
    fontSize: 12,
  },
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dueDate: {
    fontSize: 16,
    fontWeight: '500',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  commentContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  commentUser: {
    fontSize: 14,
    fontWeight: '600',
  },
  commentTime: {
    fontSize: 12,
  },
  commentMessage: {
    fontSize: 14,
    lineHeight: 20,
  },
}); 