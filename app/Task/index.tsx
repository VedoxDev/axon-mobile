import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView, Image } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import { useState } from 'react';
import Modal from 'react-native-modal';

// Define types for our task board
type Task = {
  id: string;
  title: string;
  description: string;
  assignee: string;
  dueDate?: string;
  deadlineType?: string;
  comments?: Comment[];
  members?: Member[];
};

type Comment = {
  id: string;
  user: string;
  avatar: string;
  message: string;
  timestamp: string;
};

type Member = {
  id: string;
  name: string;
  avatar: string;
};

type Column = {
  id: string;
  title: string;
  tasks: Task[];
  color: string;
};

// Temporary data for demonstration
const initialColumns: Column[] = [
  {
    id: 'assigned',
    title: 'Asignado',
    color: '#42A5F5',
    tasks: [
      {
        id: '1',
        title: '[Hero Section] - Tamaño del hero',
        description: 'Ajustar el tamaño del hero section para que sea más impactante y responsivo en diferentes dispositivos.',
        assignee: 'Juan',
        dueDate: '11 dic, 14:00',
        deadlineType: 'Plazo abierto',
        members: [
          { id: 'm1', name: 'Juan', avatar: 'https://i.pravatar.cc/150?img=1' },
          { id: 'm2', name: 'María', avatar: 'https://i.pravatar.cc/150?img=2' },
        ],
        comments: [
          {
            id: 'c1',
            user: 'Juan',
            avatar: 'https://i.pravatar.cc/150?img=1',
            message: 'He empezado a trabajar en el diseño',
            timestamp: '10:30 AM',
          },
          {
            id: 'c2',
            user: 'María',
            avatar: 'https://i.pravatar.cc/150?img=2',
            message: '¿Necesitas ayuda con algo específico?',
            timestamp: '11:15 AM',
          },
        ],
      },
      { id: '2', title: 'Revisar código', description: 'Code review del PR #123', assignee: 'María' },
    ],
  },
  {
    id: 'in-progress',
    title: 'En proceso',
    color: '#FFB74D',
    tasks: [
      { id: '3', title: 'Implementar API', description: 'Desarrollar endpoints para usuarios', assignee: 'Carlos' },
    ],
  },
  {
    id: 'completed',
    title: 'Terminado',
    color: '#4CAF50',
    tasks: [
      { id: '4', title: 'Testing', description: 'Pruebas unitarias completadas', assignee: 'Ana' },
    ],
  },
];

export default function TaskScreen() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const router = useRouter();
  const [columns, setColumns] = useState(initialColumns);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalVisible, setModalVisible] = useState(false);

  const handleDragEnd = (columnId: string, tasks: Task[]) => {
    setColumns(prevColumns =>
      prevColumns.map(col =>
        col.id === columnId ? { ...col, tasks } : col
      )
    );
  };

  const openTaskModal = (task: Task) => {
    setSelectedTask(task);
    setModalVisible(true);
  };

  const closeTaskModal = () => {
    setModalVisible(false);
    setSelectedTask(null);
  };

  const getColumnForTask = (taskId: string) => {
    return columns.find(col => col.tasks.some(t => t.id === taskId));
  };

  const renderTaskCard = ({ item, drag, isActive }: RenderItemParams<Task>) => (
    <TouchableOpacity
      onLongPress={drag}
      onPress={() => openTaskModal(item)}
      disabled={isActive}
      style={[
        styles.taskCard,
        {
          backgroundColor: '#FFFFFF',
          borderColor: colorScheme === 'dark' ? theme.gray : '#E0E0E0',
          opacity: isActive ? 0.5 : 1,
        },
      ]}
    >
      <Text style={[styles.taskTitle, { color: theme.text }]}>{item.title}</Text>
      <Text style={[styles.taskDescription, { color: theme.gray }]}>{item.description}</Text>
      <View style={styles.taskFooter}>
        <Text style={[styles.assignee, { color: theme.gray }]}>{item.assignee}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderColumn = (column: Column) => (
    <View
      key={column.id}
      style={[
        styles.column,
        {
          backgroundColor: column.color,
        },
      ]}
    >
      <Text style={[styles.columnTitle, { color: '#FFFFFF' }]}>{column.title}</Text>
      <DraggableFlatList
        data={column.tasks}
        renderItem={renderTaskCard}
        keyExtractor={(item) => item.id}
        onDragEnd={({ data }) => handleDragEnd(column.id, data)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.taskList}
      />
      <TouchableOpacity
        style={[
          styles.addCardButton,
          {
            backgroundColor: '#FFFFFF',
          },
        ]}
      >
        <Text style={[styles.addCardText, { color: column.color }]}>+ Añade una tarjeta</Text>
      </TouchableOpacity>
    </View>
  );

  const renderTaskModal = () => {
    if (!selectedTask) return null;
    const column = getColumnForTask(selectedTask.id);

    return (
      <Modal
        isVisible={isModalVisible}
        onSwipeComplete={closeTaskModal}
        swipeDirection={['down']}
        style={styles.modal}
        onBackdropPress={closeTaskModal}
      >
        <View style={[styles.modalContent, { borderColor: column?.color }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => router.push('/(tabs)/home')} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
            <View style={[styles.statusTag, { backgroundColor: column?.color }]}>
              <Text style={styles.statusText}>{column?.title}</Text>
            </View>
          </View>

        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/home')}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.projectTitle, { color: theme.text }]}>My Space App</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.boardScrollContainer}
        pagingEnabled={false}
        decelerationRate="fast"
        snapToInterval={316}
        snapToAlignment="start"
      >
        {columns.map(renderColumn)}
      </ScrollView>

      {renderTaskModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    marginRight: 16,
  },
  projectTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  boardScrollContainer: {
    padding: 16,
    gap: 16,
  },
  column: {
    width: 300,
    borderRadius: 12,
    padding: 12,
    marginRight: 16,
    maxHeight: '90%',
  },
  columnTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  taskList: {
    paddingBottom: 8,
  },
  taskCard: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  taskDescription: {
    fontSize: 14,
    marginBottom: 8,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  assignee: {
    fontSize: 12,
  },
  addCardButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  addCardText: {
    fontSize: 14,
    fontWeight: '500',
  },
  // Modal styles
  modal: {
    padding: 0,
    marginTop: 350,
    width: 370,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    borderWidth: 4,
    minHeight: 500,
    maxHeight: 700,
    width: '100%',
    maxWidth: 425,
    alignSelf: 'center',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  closeButton: {
    padding: 8,
  },
  statusTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  modalBody: {
    padding: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  membersSection: {
    marginBottom: 24,
  },
  membersList: {
    flexDirection: 'row',
  },
  memberAvatar: {
    alignItems: 'center',
    marginRight: 16,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: 4,
  },
  memberName: {
    fontSize: 12,
  },
  dueDateSection: {
    marginBottom: 24,
  },
  dueDateContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dueDate: {
    fontSize: 16,
    fontWeight: '500',
  },
  deadlineType: {
    fontSize: 14,
  },
  descriptionSection: {
    marginBottom: 24,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  commentsSection: {
    marginBottom: 24,
  },
  comment: {
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