import { View, Text, StyleSheet, TouchableOpacity, Animated, ActivityIndicator, Alert } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import { useState, useEffect, useRef } from 'react';
import { SectionService, Section, generateSectionColor } from '@/services/sectionService';

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
  sectionId: number; // To keep track of the API section ID
  order: number;
};

export default function TaskScreen() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const router = useRouter();
  const { projectId, projectName } = useLocalSearchParams<{ projectId: string; projectName: string }>();
  
  const [columns, setColumns] = useState<Column[]>([]);
  const [isModalActive, setIsModalActive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const isFocused = useIsFocused();

  // Fetch sections when component mounts, projectId changes, or screen comes into focus
  useEffect(() => {
    if (projectId && isFocused) {
      fetchSections();
    }
  }, [projectId, isFocused]);

  const fetchSections = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const sections = await SectionService.getSections(projectId);
      
      // Transform sections to columns format with empty tasks for now
      const transformedColumns: Column[] = sections.map((section: Section, index: number) => ({
        id: `section-${section.id}`,
        sectionId: section.id,
        title: section.name,
        order: section.order,
        color: generateSectionColor(section.id, index),
        tasks: [] // We'll add tasks later when we integrate the tasks API
      }));
      
      setColumns(transformedColumns);
    } catch (err: any) {
      console.error('Failed to fetch sections:', err);
      setError(err.message || 'Failed to load sections');
    } finally {
      setIsLoading(false);
    }
  };



  // Delete section
  const handleDeleteSection = (sectionId: number, sectionName: string) => {
    Alert.alert(
      'Delete Section',
      `Are you sure you want to delete "${sectionName}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsDeleting(true);
              await SectionService.deleteSection(projectId, sectionId);

              // Remove from local state
              setColumns(prevColumns =>
                prevColumns.filter(col => col.sectionId !== sectionId)
              );
            } catch (err: any) {
              console.error('Failed to delete section:', err);
              Alert.alert('Error', err.message || 'Failed to delete section');
            } finally {
              setIsDeleting(false);
            }
          }
        }
      ]
    );
  };

  // Handle section reordering
  const handleSectionDragEnd = async ({ data }: { data: Column[] }) => {
    console.log('Starting section reorder...');
    console.log('Original columns:', columns.map(col => ({ id: col.sectionId, name: col.title, order: col.order })));
    console.log('New order data:', data.map(col => ({ id: col.sectionId, name: col.title, order: col.order })));

    // Update local state immediately for smooth UX
    setColumns(data);

    try {
      // Extract section IDs in new order - ensure they are numbers
      const sectionIds = data.map(col => {
        const id = typeof col.sectionId === 'string' ? parseInt(col.sectionId, 10) : col.sectionId;
        return id;
      });
      
      console.log('Sending reorder request with sectionIds:', sectionIds);
      console.log('sectionIds types:', sectionIds.map(id => typeof id));
      
      // Validate that all IDs are valid numbers
      const invalidIds = sectionIds.filter(id => isNaN(id) || id <= 0);
      if (invalidIds.length > 0) {
        console.error('Invalid section IDs found:', invalidIds);
        throw new Error('Invalid section IDs detected');
      }
      
      // Ensure we have the same number of sections
      if (sectionIds.length !== columns.length) {
        console.error('Section count mismatch:', {
          original: columns.length,
          reordered: sectionIds.length
        });
        throw new Error('Section count mismatch');
      }
      
      // Call API to persist the new order
      await SectionService.reorderSections(projectId, sectionIds);
      console.log('Reorder success!');
    } catch (err: any) {
      console.error('Failed to reorder sections:', err);
      console.error('Error details:', err.response?.data || err.message);
      Alert.alert('Error', 'Failed to save section order. Please try again.');
      // Refresh sections to restore original order
      fetchSections();
    }
  };

  useEffect(() => {
    if (isModalActive) {
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isModalActive, overlayOpacity]);

  useEffect(() => {
    if (isFocused && isModalActive) {
      setIsModalActive(false);
    }
  }, [isFocused]);

  const handleDragEnd = (columnId: string, tasks: Task[]) => {
    setColumns(prevColumns =>
      prevColumns.map(col =>
        col.id === columnId ? { ...col, tasks } : col
      )
    );
  };

  const openTaskModal = (task: Task) => {
    setIsModalActive(true);
    router.push({
      pathname: '/project/Task/modal',
      params: { taskId: task.id }
    });
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
      <Text style={[styles.taskTitle, { color: theme.textInWhite }]}>{item.title}</Text>
      <Text style={[styles.taskDescription, { color: theme.gray }]}>{item.description}</Text>
      <View style={styles.taskFooter}>
        <Text style={[styles.assignee, { color: theme.gray }]}>{item.assignee}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderColumn = ({ item: column, drag, isActive }: RenderItemParams<Column>) => (
    <TouchableOpacity
      onLongPress={drag}
      disabled={isActive}
      style={[
        styles.column,
        {
          backgroundColor: column.color,
          opacity: isActive ? 0.8 : 1,
        },
      ]}
    >
      <View style={styles.columnHeader}>
        <Text style={[styles.columnTitle, { color: '#FFFFFF' }]}>{column.title}</Text>
        <TouchableOpacity
          style={styles.columnMenu}
          onPress={() => {
            Alert.alert(
              column.title,
              'What would you like to do?',
              [
                {
                  text: 'Rename',
                  onPress: () => {
                    router.push({
                      pathname: '/project/Task/editSectionModal',
                      params: {
                        projectId,
                        sectionId: column.sectionId.toString(),
                        sectionName: column.title
                      }
                    });
                  }
                },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: () => handleDeleteSection(column.sectionId, column.title)
                },
                { text: 'Cancel', style: 'cancel' }
              ]
            );
          }}
        >
          <Ionicons name="ellipsis-vertical" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
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
    </TouchableOpacity>
  );

  if (!projectId) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.text }]}>
            No project selected. Please go back and select a project.
          </Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.errorButton}>
            <Text style={styles.errorButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colorScheme === 'dark' ? theme.card : theme.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.projectTitle}>{projectName || 'Loading...'}</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.text }]}>Loading sections...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colorScheme === 'dark' ? theme.card : theme.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.projectTitle}>{projectName || 'Error'}</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.text }]}>{error}</Text>
          <TouchableOpacity onPress={fetchSections} style={styles.errorButton}>
            <Text style={styles.errorButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colorScheme === 'dark' ? theme.card : theme.background }]}>
      <Animated.View
        pointerEvents={isModalActive ? 'auto' : 'none'}
        style={[
          styles.overlay,
          { opacity: overlayOpacity, backgroundColor: 'rgba(0, 0, 0, 0.5)' },
        ]}
      />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.projectTitle}>{projectName || 'Tasks'}</Text>
        <TouchableOpacity 
          style={styles.addSectionButton}
          onPress={() => {
            router.push({
              pathname: '/project/Task/createSectionModal',
              params: { projectId }
            });
          }}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {columns.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: theme.text }]}>
            No sections yet. Create your first section to start organizing tasks.
          </Text>
          <TouchableOpacity 
            style={[styles.createSectionButton, { backgroundColor: theme.primary }]}
            onPress={() => {
              router.push({
                pathname: '/project/Task/createSectionModal',
                params: { projectId }
              });
            }}
          >
            <Text style={styles.createSectionButtonText}>Create Section</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <DraggableFlatList
          data={columns}
          renderItem={renderColumn}
          keyExtractor={(item) => item.id}
          onDragEnd={handleSectionDragEnd}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.boardScrollContainer}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  backButton: {
    marginRight: 16,
    backgroundColor: '#42A5F5',
    borderRadius: 20,
    padding: 6,
  },
  projectTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  addSectionButton: {
    backgroundColor: '#42A5F5',
    borderRadius: 20,
    padding: 6,
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
  columnHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  columnTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  columnMenu: {
    padding: 4,
  },
  taskList: {
    paddingBottom: 8,
  },
  taskCard: {
    borderRadius: 15,
    padding: 12,
    marginBottom: 12,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 3,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  errorButton: {
    backgroundColor: '#42A5F5',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  errorButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  createSectionButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createSectionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 