import { View, Text, StyleSheet, TouchableOpacity, Animated, ActivityIndicator, Alert, FlatList } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import { useState, useEffect, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import React from 'react';
import { SectionService, Section, generateSectionColor } from '@/services/sectionService';
import { TaskService, Task as ApiTask } from '@/services/taskService';
import { useProjectContext } from '@/contexts/ProjectContext';

// Priority and Status mappings
const PRIORITY_CONFIG = {
  1: { label: 'Baja', color: '#10B981', icon: '🟢' },
  2: { label: 'Media', color: '#F59E0B', icon: '🟡' },
  3: { label: 'Alta', color: '#EF4444', icon: '🔴' },
  4: { label: 'Crítica', color: '#7C3AED', icon: '🔥' },
};

const STATUS_CONFIG = {
  'todo': { label: 'Pendiente', icon: '⏳' },
  'in_progress': { label: 'En Progreso', icon: '🔄' },
  'done': { label: 'Completado', icon: '✅' },
};

// Use the API task type and create our column type
type Column = {
  id: string;
  title: string;
  tasks: ApiTask[];
  color: string;
  sectionId: number | null; // To keep track of the API section ID (null for backlog)
  order: number;
  isBacklog?: boolean; // Flag to identify the backlog section
};

export default function TaskScreen() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const router = useRouter();
  const { projectId, projectName } = useLocalSearchParams<{ projectId: string; projectName: string }>();
  const { projects } = useProjectContext();
  
  const [columns, setColumns] = useState<Column[]>([]);
  const [isModalActive, setIsModalActive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);

  // Get current project to check user role
  const currentProject = projects.find(p => p.id === projectId);
  const canManageProject = currentProject?.role !== 'member';

  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const isFocused = useIsFocused();

  // Fetch sections when component mounts, projectId changes, or screen comes into focus
  useEffect(() => {
    if (projectId && isFocused) {
      fetchSections();
    }
  }, [projectId, isFocused]);

  // Refresh sections when returning from modals
  useFocusEffect(
    React.useCallback(() => {
      if (projectId) {
        fetchSections();
      }
    }, [projectId])
  );

  const fetchSections = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const sections = await SectionService.getSections(projectId);
      
      // Fetch all project tasks to separate those without sections
      let allProjectTasks: ApiTask[] = [];
      try {
        allProjectTasks = await TaskService.getProjectTasks(projectId);
      } catch (taskError) {
        console.warn('Failed to fetch project tasks:', taskError);
      }
      
      // Transform sections to columns format and fetch tasks for each section
      const transformedColumns: Column[] = await Promise.all(
        sections.map(async (section: Section, index: number) => {
          try {
            // Fetch tasks for this section
            const sectionTasks = await TaskService.getSectionTasks(projectId, section.id);
            
            return {
              id: `section-${section.id}`,
              sectionId: section.id,
              title: section.name,
              order: section.order,
              color: generateSectionColor(section.id, index),
              tasks: sectionTasks,
              isBacklog: false
            };
          } catch (taskError) {
            console.warn(`Failed to fetch tasks for section ${section.id}:`, taskError);
            // Return section with empty tasks if task fetching fails
            return {
              id: `section-${section.id}`,
              sectionId: section.id,
              title: section.name,
              order: section.order,
              color: generateSectionColor(section.id, index),
              tasks: [],
              isBacklog: false
            };
          }
        })
      );
      
      // Create backlog section for tasks without a section
      const tasksWithoutSection = allProjectTasks.filter(task => !task.section);
      if (tasksWithoutSection.length > 0 || sections.length === 0) {
        const backlogColumn: Column = {
          id: 'backlog',
          sectionId: null,
          title: 'Pendientes',
          order: -1, // Place at the beginning
          color: '#6B7280', // Gray color for backlog
          tasks: tasksWithoutSection,
          isBacklog: true
        };
        transformedColumns.unshift(backlogColumn); // Add at the beginning
      }
      
      setColumns(transformedColumns);
    } catch (err: any) {
      console.error('Failed to fetch sections:', err);
      setError(err.message || 'Error al cargar las secciones');
    } finally {
      setIsLoading(false);
    }
  };



  // Delete section
  const handleDeleteSection = (sectionId: number | null, sectionName: string) => {
    // Don't allow deleting the backlog section
    if (sectionId === null) {
      Alert.alert('No se puede eliminar', 'La sección de Pendientes no se puede eliminar.');
      return;
    }

    Alert.alert(
      'Eliminar Sección',
      `¿Estás seguro de que quieres eliminar "${sectionName}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
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
              Alert.alert('Error', err.message || 'Error al eliminar la sección');
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

    // Check if backlog was displaced from first position
    const backlogSection = data.find(col => col.isBacklog);
    const backlogIndex = data.findIndex(col => col.isBacklog);
    const wasBacklogMoved = backlogSection && backlogIndex !== 0;

    if (wasBacklogMoved) {
      console.log('Backlog was displaced during drag - restoring correct order');
      // Immediately restore correct order without API call
      const regularSections = data.filter(col => !col.isBacklog);
      const correctedData = [backlogSection, ...regularSections];
      setColumns(correctedData);
      return; // Don't proceed with API call since no real reordering happened
    }

    // Normal case: backlog stayed in place, regular sections were reordered
    const regularSections = data.filter(col => !col.isBacklog);
    
    const reorderedData = backlogSection 
      ? [backlogSection, ...regularSections]
      : regularSections;

    // Update local state immediately for smooth UX
    setColumns(reorderedData);

    try {
      // Extract section IDs in new order - only regular sections
      const sectionIds = regularSections.map(col => {
        const id = typeof col.sectionId === 'string' ? parseInt(col.sectionId, 10) : col.sectionId!;
        return id;
      });
      
      console.log('Sending reorder request with sectionIds:', sectionIds);
      console.log('sectionIds types:', sectionIds.map(id => typeof id));
      
      // Only proceed if we have sections to reorder
      if (sectionIds.length === 0) {
        console.log('No sections to reorder (only backlog)');
        return;
      }
      
      // Validate that all IDs are valid numbers
      const invalidIds = sectionIds.filter(id => isNaN(id) || id <= 0);
      if (invalidIds.length > 0) {
        console.error('Invalid section IDs found:', invalidIds);
        throw new Error('Invalid section IDs detected');
      }
      
      // Call API to persist the new order
      await SectionService.reorderSections(projectId, sectionIds);
      console.log('Reorder success!');
    } catch (err: any) {
      console.error('Failed to reorder sections:', err);
      console.error('Error details:', err.response?.data || err.message);
      Alert.alert('Error', 'Error al guardar el orden de las secciones. Por favor inténtalo de nuevo.');
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



  const handleTaskStatusChange = async (taskId: string, newStatus: 'todo' | 'in_progress' | 'done') => {
    try {
      await TaskService.updateTask(taskId, { status: newStatus });
      
      // Update local state
      setColumns(prevColumns =>
        prevColumns.map(col => ({
          ...col,
          tasks: col.tasks.map(task =>
            task.id === taskId ? { ...task, status: newStatus } : task
          )
        }))
      );
    } catch (error) {
      console.error('Failed to update task status:', error);
      Alert.alert('Error', 'No se pudo actualizar el estado de la tarea');
    }
  };

  const openTaskModal = (task: ApiTask) => {
    setIsModalActive(true);
    router.push({
      pathname: '/project/Task/modal',
      params: { taskId: task.id }
    });
  };

  const renderTaskCard = ({ item }: { item: ApiTask }) => {
    const priorityConfig = PRIORITY_CONFIG[item.priority as keyof typeof PRIORITY_CONFIG];
    
    const showMoveOptions = () => {
      router.push({
        pathname: '/project/Task/moveTaskModal',
        params: {
          projectId,
          taskId: item.id,
          taskTitle: item.title,
          currentSectionId: item.section?.id?.toString() || ''
        }
      });
    };
    
    return (
      <TouchableOpacity
        onPress={() => openTaskModal(item)}
        onLongPress={showMoveOptions}
        style={[
          styles.taskCard,
          {
            borderLeftWidth: 4,
            borderLeftColor: priorityConfig?.color || '#E0E0E0',
          },
        ]}
      >
        {/* Task Header */}
        <View style={styles.taskHeader}>
          <View style={styles.taskTitleContainer}>
            <View style={styles.titleRow}>
              <Text style={styles.priorityIndicator}>{priorityConfig?.icon}</Text>
              <Text style={[styles.taskTitle, { 
                textDecorationLine: item.status === 'done' ? 'line-through' : 'none',
                opacity: item.status === 'done' ? 0.6 : 1 
              }]}>
                {item.title}
              </Text>
            </View>
          </View>
          
          {/* Completion Checkbox */}
          <TouchableOpacity
            style={[
              styles.checkboxContainer,
              { backgroundColor: item.status === 'done' ? '#10B981' : 'transparent' }
            ]}
            onPress={() => {
              const newStatus = item.status === 'done' ? 'todo' : 'done';
              handleTaskStatusChange(item.id, newStatus);
            }}
          >
            {item.status === 'done' && (
              <Ionicons name="checkmark" size={16} color="#fff" />
            )}
          </TouchableOpacity>
        </View>

        {/* Description */}
        {item.description && (
          <Text style={[styles.taskDescription, {
            opacity: item.status === 'done' ? 0.6 : 1
          }]}>
            {item.description}
          </Text>
        )}

        {/* Labels */}
        {item.labels && item.labels.length > 0 && (
          <View style={styles.labelsContainer}>
            {item.labels.slice(0, 3).map((label) => (
              <View
                key={label.id}
                style={[styles.labelChip, { backgroundColor: label.color }]}
              >
                <Text style={styles.labelText}>{label.name}</Text>
              </View>
            ))}
            {item.labels.length > 3 && (
              <View style={[styles.labelChip, styles.labelChipMore]}>
                <Text style={styles.labelTextMore}>+{item.labels.length - 3}</Text>
              </View>
            )}
          </View>
        )}

        {/* Footer */}
        <View style={styles.taskFooter}>
          <Text style={styles.assignee}>
            {item.assignees.length > 0 ? item.assignees[0].nombre : 'Sin asignar'}
          </Text>
          {item.dueDate && (
            <Text style={styles.dueDate}>
              {new Date(item.dueDate).toLocaleDateString('es-ES', { 
                month: 'short', 
                day: 'numeric' 
              })}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderColumn = ({ item: column, drag, isActive }: RenderItemParams<Column>) => (
    <TouchableOpacity
      onLongPress={column.isBacklog ? undefined : drag}
      disabled={isActive || column.isBacklog}
      style={[
        styles.column,
        {
          backgroundColor: column.isBacklog ? 'transparent' : column.color,
          borderWidth: column.isBacklog ? 2 : 0,
          borderColor: column.isBacklog ? column.color : 'transparent',
          borderStyle: column.isBacklog ? 'dashed' : 'solid',
          opacity: isActive ? 0.8 : 1,
        },
      ]}
    >
      <View style={styles.columnHeader}>
        <Text style={[
          styles.columnTitle, 
          { 
            color: column.isBacklog ? column.color : '#FFFFFF',
            fontStyle: column.isBacklog ? 'italic' : 'normal'
          }
        ]}>
          {column.title}
        </Text>
        {!column.isBacklog && canManageProject && (
          <TouchableOpacity
            style={styles.columnMenu}
            onPress={() => {
              console.log('Section menu button pressed for:', column.title);
              router.push({
                pathname: '/project/Task/sectionOptionsModal',
                params: {
                  projectId,
                  sectionId: column.sectionId?.toString() || '',
                  sectionName: column.title
                }
              });
            }}
          >
            <Ionicons name="ellipsis-vertical" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.taskList}>
        {column.tasks.length > 0 ? (
          <FlatList
            data={column.tasks}
            renderItem={({ item }) => renderTaskCard({ item })}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 8 }}
          />
        ) : (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <Text style={{ color: '#FFFFFF80', fontSize: 14 }}>
              {column.isBacklog ? 'No hay tareas pendientes' : 'No hay tareas en esta sección'}
            </Text>
          </View>
        )}
      </View>
      
      {!column.isBacklog && (
        <TouchableOpacity
          style={[
            styles.addTaskButton,
            {
              backgroundColor: '#FFFFFF',
            },
          ]}
          onPress={() => {
            router.push({
              pathname: '/project/Task/createTaskModal',
              params: { 
                projectId, 
                sectionId: column.sectionId?.toString() || ''
              }
            });
          }}
        >
          <Text style={[styles.addTaskButtonText, { color: column.color }]}>+ Agregar Tarea</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  if (!projectId) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.text }]}>
            No hay proyecto seleccionado. Por favor regresa y selecciona un proyecto.
          </Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.errorButton}>
            <Text style={styles.errorButtonText}>Regresar</Text>
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
          <Text style={styles.projectTitle}>{projectName || 'Cargando...'}</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.text }]}>Cargando secciones...</Text>
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
            <Text style={styles.errorButtonText}>Reintentar</Text>
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

      {/* Invisible overlay to close menus */}
      {showOptionsMenu && (
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setShowOptionsMenu(false)}
        />
      )}

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.projectTitle}>{projectName || 'Tareas'}</Text>
        {canManageProject && (
          <View style={styles.optionsContainer}>
            <TouchableOpacity 
              style={styles.optionsButton}
              onPress={() => setShowOptionsMenu(!showOptionsMenu)}
            >
              <Ionicons name="ellipsis-horizontal" size={24} color="#fff" />
            </TouchableOpacity>
            
            {showOptionsMenu && (
              <View style={[styles.optionsDropdown, { backgroundColor: theme.background }]}>
                <TouchableOpacity
                  style={styles.optionItem}
                  onPress={() => {
                    setShowOptionsMenu(false);
                    router.push({
                      pathname: '/project/Task/createSectionModal',
                      params: { projectId }
                    });
                  }}
                >
                  <Ionicons name="add-circle-outline" size={20} color="#42A5F5" />
                  <Text style={[styles.optionText, { color: theme.text }]}>Agregar Sección</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.optionItem}
                  onPress={() => {
                    setShowOptionsMenu(false);
                    router.push({
                      pathname: '/project/Task/manageLabelsModal',
                      params: { projectId }
                    });
                  }}
                >
                  <Ionicons name="pricetag-outline" size={20} color="#42A5F5" />
                  <Text style={[styles.optionText, { color: theme.text }]}>Gestionar Etiquetas</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>

      {columns.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: theme.text }]}>
            Aún no hay secciones. Crea tu primera sección para comenzar a organizar las tareas.
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
            <Text style={styles.createSectionButtonText}>Crear Sección</Text>
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
      
      {/* Floating Action Button */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.primary }]}
        onPress={() => {
          router.push({
            pathname: '/project/Task/createTaskModal',
            params: { projectId }
          });
        }}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
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
  menuOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
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
  optionsContainer: {
    position: 'relative',
  },
  optionsButton: {
    backgroundColor: '#42A5F5',
    borderRadius: 20,
    padding: 6,
  },
  optionsDropdown: {
    position: 'absolute',
    top: 40,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 8,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 8,
    zIndex: 1000,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  boardScrollContainer: {
    padding: 16,
    gap: 16,
    height: '100%',
  },
  column: {
    width: 300,
    borderRadius: 12,
    padding: 12,
    marginRight: 16,
    maxHeight: '95%',
    minHeight: '95%',
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
  sectionMenuContainer: {
    position: 'relative',
  },
  columnMenu: {
    padding: 4,
  },
  sectionDropdown: {
    position: 'absolute',
    top: 32,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 6,
    minWidth: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 12,
    zIndex: 1001,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  sectionOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10,
  },
  sectionOptionText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#333',
  },
  taskList: {
    flex: 1,
  },
  taskCard: {
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    lineHeight: 18,
    flex: 1,
  },
  taskDescription: {
    fontSize: 13,
    marginBottom: 8,
    color: '#666666',
    lineHeight: 18,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  assignee: {
    fontSize: 12,
    color: '#999999',
  },
  addTaskButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  addTaskButtonText: {
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
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  // New task card styles
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  taskTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priorityIndicator: {
    fontSize: 16,
    lineHeight: 18,
  },
  checkboxContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D0D0D0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  labelsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 8,
  },
  labelChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    maxWidth: 80,
  },
  labelChipMore: {
    backgroundColor: '#E0E0E0',
  },
  labelText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '500',
  },
  labelTextMore: {
    color: '#666',
    fontSize: 10,
    fontWeight: '500',
  },
  dueDate: {
    fontSize: 12,
    color: '#FF6B6B',
    fontWeight: '500',
  },
}); 