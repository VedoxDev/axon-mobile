import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert, Platform } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { TaskService, Task, UpdateTaskRequest } from '@/services/taskService';
import DateTimePicker from '@react-native-community/datetimepicker';

const priorityColors: Record<number, string> = {
  1: '#10B981', // Green - Low
  2: '#F59E0B', // Amber - Medium  
  3: '#EF4444', // Red - High
  4: '#7C3AED', // Purple - Critical
};

const priorityLabels: Record<number, string> = {
  1: 'Baja',
  2: 'Media',
  3: 'Alta', 
  4: 'Crítica',
};

const priorityIcons: Record<number, string> = {
  1: 'arrow-down',
  2: 'arrow-forward',
  3: 'arrow-up',
  4: 'flame',
};

export default function TasksScreen() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<'today' | 'upcoming' | 'all'>('all');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [showAddTask, setShowAddTask] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // New task creation states
  const [newTaskPriority, setNewTaskPriority] = useState(2);
  const [newTaskDueDate, setNewTaskDueDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Edit task states
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTaskTitle, setEditTaskTitle] = useState('');
  const [editTaskDescription, setEditTaskDescription] = useState('');
  const [editTaskPriority, setEditTaskPriority] = useState(2);
  const [editTaskDueDate, setEditTaskDueDate] = useState<Date | null>(null);
  const [showEditDatePicker, setShowEditDatePicker] = useState(false);

  // Load personal tasks
  const loadTasks = async () => {
    try {
      setLoading(true);
      const personalTasks = await TaskService.getPersonalTasks();
      setTasks(personalTasks);
    } catch (error: any) {
      console.error('Error loading tasks:', error);
      Alert.alert('Error', error.message || 'No se pudieron cargar las tareas');
    } finally {
      setLoading(false);
    }
  };

  // Create new task
  const createTask = async () => {
    if (!newTaskTitle.trim()) return;
    
    try {
      const taskData: any = {
        title: newTaskTitle.trim(),
        priority: newTaskPriority,
        status: 'todo'
        // No projectId = personal task
      };
      
      if (newTaskDueDate) {
        taskData.dueDate = newTaskDueDate.toISOString();
      }
      
      const newTask = await TaskService.createTask(taskData);
      
      setTasks([newTask, ...tasks]);
      
      // Reset form
      setNewTaskTitle('');
      setNewTaskPriority(2);
      setNewTaskDueDate(null);
      setShowAddTask(false);
    } catch (error: any) {
      console.error('Error creating task:', error);
      Alert.alert('Error', error.message || 'No se pudo crear la tarea');
    }
  };

  // Date picker handlers
  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setNewTaskDueDate(selectedDate);
    }
  };

  const clearDate = () => {
    setNewTaskDueDate(null);
  };

  // Edit task handlers
  const startEditTask = (task: Task) => {
    setEditingTaskId(task.id);
    setEditTaskTitle(task.title);
    setEditTaskDescription(task.description || '');
    setEditTaskPriority(task.priority);
    setEditTaskDueDate(task.dueDate ? new Date(task.dueDate) : null);
  };

  const cancelEditTask = () => {
    setEditingTaskId(null);
    setEditTaskTitle('');
    setEditTaskDescription('');
    setEditTaskPriority(2);
    setEditTaskDueDate(null);
  };

  const saveEditTask = async () => {
    if (!editingTaskId || !editTaskTitle.trim()) return;
    
    try {
      const updateData: UpdateTaskRequest = {
        title: editTaskTitle.trim(),
        description: editTaskDescription.trim() || undefined,
        priority: editTaskPriority as 1 | 2 | 3 | 4,
        dueDate: editTaskDueDate ? editTaskDueDate.toISOString() : undefined,
      };
      
      const updatedTask = await TaskService.updateTask(editingTaskId, updateData);
      
      setTasks(tasks.map(t => 
        t.id === editingTaskId ? updatedTask : t
      ));
      
      cancelEditTask();
    } catch (error: any) {
      console.error('Error updating task:', error);
      Alert.alert('Error', error.message || 'No se pudo actualizar la tarea');
    }
  };

  // Edit date picker handlers
  const onEditDateChange = (event: any, selectedDate?: Date) => {
    setShowEditDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setEditTaskDueDate(selectedDate);
    }
  };

  const clearEditDate = () => {
    setEditTaskDueDate(null);
  };

  // Toggle task status
  const toggleTaskStatus = async (taskId: string) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;
      
      const newStatus = task.status === 'todo' ? 'done' : 'todo';
      
      const updatedTask = await TaskService.updateTask(taskId, { status: newStatus });
      
      setTasks(tasks.map(t => 
        t.id === taskId ? updatedTask : t
      ));
    } catch (error: any) {
      console.error('Error updating task:', error);
      Alert.alert('Error', error.message || 'No se pudo actualizar la tarea');
    }
  };

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (filter === 'today') {
      if (!task.dueDate) return false;
      const dueDate = new Date(task.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate.getTime() === today.getTime();
    }
    
    if (filter === 'upcoming') {
      if (!task.dueDate) return false;
      const dueDate = new Date(task.dueDate);
      return dueDate >= tomorrow;
    }
    
    return true; // 'all'
  });

  useEffect(() => {
    loadTasks();
  }, []);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const taskDate = new Date(date);
    taskDate.setHours(0, 0, 0, 0);
    
    if (taskDate.getTime() === today.getTime()) {
      return 'Hoy';
    } else if (taskDate.getTime() === today.getTime() + 86400000) {
      return 'Mañana';
    }
    return date.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'short' 
    });
  };

  return (
    <View style={[styles.safeAreaContainer, { backgroundColor: theme.background, paddingTop: 20 }]}>
      <Text style={[styles.title, { color: theme.text }]}>Mis Tareas</Text>

      {/* Filter Bar */}
      <View style={styles.filterBar}> 
        <TouchableOpacity 
          style={[
            styles.filterButton, 
            { backgroundColor: filter === 'today' ? theme.primary : theme.card }
          ]} 
          onPress={() => setFilter('today')}
        >
          <Text style={[
            styles.filterButtonText, 
            { color: filter === 'today' ? theme.card : theme.text }
          ]}>
            Hoy
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.filterButton, 
            { backgroundColor: filter === 'upcoming' ? theme.primary : theme.card }
          ]} 
          onPress={() => setFilter('upcoming')}
        >
          <Text style={[
            styles.filterButtonText, 
            { color: filter === 'upcoming' ? theme.card : theme.text }
          ]}>
            Próximo
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.filterButton, 
            { backgroundColor: filter === 'all' ? theme.primary : theme.card }
          ]} 
          onPress={() => setFilter('all')}
        >
          <Text style={[
            styles.filterButtonText, 
            { color: filter === 'all' ? theme.card : theme.text }
          ]}>
            Todos
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.addButton, { backgroundColor: theme.primary }]}
          onPress={() => setShowAddTask(!showAddTask)}
        >
          <Ionicons name="add" size={20} color={theme.card} />
        </TouchableOpacity>
      </View>

      {/* Add Task Input */}
      {showAddTask && (
        <View style={[styles.addTaskContainer, { backgroundColor: theme.card }]}>
          {/* Task Title Input */}
          <TextInput
            style={[styles.taskInput, { color: theme.text, borderColor: theme.gray }]}
            placeholder="Escribe tu nueva tarea..."
            placeholderTextColor={theme.gray}
            value={newTaskTitle}
            onChangeText={setNewTaskTitle}
            multiline
            maxLength={100}
          />
          
          {/* First Row: Priority Selection */}
          <View style={styles.firstOptionsRow}>
            <Text style={[styles.sectionLabel, { color: theme.text }]}>Prioridad</Text>
            <View style={styles.priorityButtonsRow}>
              {[1, 2, 3, 4].map((priority) => (
                <TouchableOpacity
                  key={priority}
                  style={[
                    styles.priorityButtonLarge,
                    {
                      backgroundColor: newTaskPriority === priority 
                        ? priorityColors[priority] 
                        : theme.background,
                      borderColor: priorityColors[priority],
                    }
                  ]}
                  onPress={() => setNewTaskPriority(priority)}
                >
                  <Ionicons 
                    name={priorityIcons[priority] as any} 
                    size={16} 
                    color={newTaskPriority === priority ? 'white' : priorityColors[priority]} 
                  />
                  <Text style={[
                    styles.priorityLabelLarge,
                    { 
                      color: newTaskPriority === priority ? 'white' : priorityColors[priority]
                    }
                  ]}>
                    {priorityLabels[priority]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Second Row: Date Selection & Actions */}
          <View style={styles.secondOptionsRow}>
            <View style={styles.dateSection}>
              <Text style={[styles.sectionLabel, { color: theme.text }]}>Fecha límite</Text>
              <View style={styles.dateControls}>
                <TouchableOpacity 
                  style={[styles.dateButtonLarge, { backgroundColor: theme.background, borderColor: theme.gray }]}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Ionicons name="calendar-outline" size={18} color={theme.primary} />
                  <Text style={[styles.dateButtonTextLarge, { color: theme.text }]}>
                    {newTaskDueDate ? formatDate(newTaskDueDate.toISOString()) : 'Seleccionar fecha'}
                  </Text>
                </TouchableOpacity>
                
                {newTaskDueDate && (
                  <TouchableOpacity 
                    style={[styles.clearDateButtonLarge, { backgroundColor: theme.gray }]}
                    onPress={clearDate}
                  >
                    <Ionicons name="close" size={16} color="white" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtonsVertical}>
              <TouchableOpacity 
                style={[
                  styles.createButtonLarge, 
                  { 
                    backgroundColor: newTaskTitle.trim() ? theme.primary : theme.gray,
                    opacity: newTaskTitle.trim() ? 1 : 0.6
                  }
                ]}
                onPress={createTask}
                disabled={!newTaskTitle.trim()}
              >
                <Ionicons name="add" size={18} color="white" />
                <Text style={[styles.createButtonTextLarge, { color: 'white' }]}>Crear</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.cancelButtonLarge, { backgroundColor: theme.background, borderColor: theme.gray }]}
                onPress={() => {
                  setShowAddTask(false);
                  setNewTaskTitle('');
                  setNewTaskPriority(2);
                  setNewTaskDueDate(null);
                }}
              >
                <Ionicons name="close" size={16} color={theme.gray} />
                <Text style={[styles.cancelButtonTextLarge, { color: theme.gray }]}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Date Picker Modal */}
          {showDatePicker && (
            <DateTimePicker
              value={newTaskDueDate || new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onDateChange}
              minimumDate={new Date()}
            />
          )}
        </View>
      )}

      {/* Task List */}
      <ScrollView style={styles.taskListContainer}>
        {loading ? (
          <Text style={[styles.loadingText, { color: theme.gray }]}>Cargando tareas...</Text>
        ) : filteredTasks.length === 0 ? (
          <Text style={[styles.emptyText, { color: theme.gray }]}>
            {filter === 'today' ? 'No hay tareas para hoy' :
             filter === 'upcoming' ? 'No hay tareas próximas' : 
             'No tienes tareas'}
          </Text>
        ) : (
          filteredTasks.map((task) => (
            <View key={task.id}>
              {editingTaskId === task.id ? (
                // Edit Mode
                <View style={[styles.editTaskContainer, { backgroundColor: theme.card }]}>
                  {/* Edit Title */}
                  <TextInput
                    style={[styles.editTaskInput, { color: theme.text, borderColor: theme.gray }]}
                    placeholder="Título de la tarea..."
                    placeholderTextColor={theme.gray}
                    value={editTaskTitle}
                    onChangeText={setEditTaskTitle}
                    multiline
                    maxLength={100}
                  />
                  
                  {/* Edit Description */}
                  <TextInput
                    style={[styles.editTaskDescInput, { color: theme.text, borderColor: theme.gray }]}
                    placeholder="Descripción (opcional)..."
                    placeholderTextColor={theme.gray}
                    value={editTaskDescription}
                    onChangeText={setEditTaskDescription}
                    multiline
                    maxLength={200}
                  />
                  
                  {/* Edit Priority */}
                  <View style={styles.editOptionsRow}>
                    <Text style={[styles.editSectionLabel, { color: theme.text }]}>Prioridad</Text>
                    <View style={styles.editPriorityButtons}>
                      {[1, 2, 3, 4].map((priority) => (
                        <TouchableOpacity
                          key={priority}
                          style={[
                            styles.editPriorityButton,
                            {
                              backgroundColor: editTaskPriority === priority 
                                ? priorityColors[priority] 
                                : theme.background,
                              borderColor: priorityColors[priority],
                            }
                          ]}
                          onPress={() => setEditTaskPriority(priority)}
                        >
                          <Ionicons 
                            name={priorityIcons[priority] as any} 
                            size={14} 
                            color={editTaskPriority === priority ? 'white' : priorityColors[priority]} 
                          />
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Edit Date */}
                  <View style={styles.editOptionsRow}>
                    <Text style={[styles.editSectionLabel, { color: theme.text }]}>Fecha</Text>
                    <View style={styles.editDateControls}>
                      <TouchableOpacity 
                        style={[styles.editDateButton, { backgroundColor: theme.background, borderColor: theme.gray }]}
                        onPress={() => setShowEditDatePicker(true)}
                      >
                        <Ionicons name="calendar-outline" size={16} color={theme.primary} />
                        <Text style={[styles.editDateText, { color: theme.text }]}>
                          {editTaskDueDate ? formatDate(editTaskDueDate.toISOString()) : 'Sin fecha'}
                        </Text>
                      </TouchableOpacity>
                      
                      {editTaskDueDate && (
                        <TouchableOpacity 
                          style={[styles.clearEditDateButton, { backgroundColor: theme.gray }]}
                          onPress={clearEditDate}
                        >
                          <Ionicons name="close" size={12} color="white" />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>

                  {/* Edit Action Buttons */}
                  <View style={styles.editActionButtons}>
                    <TouchableOpacity 
                      style={[styles.editCancelButton, { backgroundColor: theme.background, borderColor: theme.gray }]}
                      onPress={cancelEditTask}
                    >
                      <Ionicons name="close" size={16} color={theme.gray} />
                      <Text style={[styles.editCancelText, { color: theme.gray }]}>Cancelar</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[
                        styles.editSaveButton, 
                        { 
                          backgroundColor: editTaskTitle.trim() ? theme.primary : theme.gray,
                          opacity: editTaskTitle.trim() ? 1 : 0.6
                        }
                      ]}
                      onPress={saveEditTask}
                      disabled={!editTaskTitle.trim()}
                    >
                      <Ionicons name="checkmark" size={16} color="white" />
                      <Text style={[styles.editSaveText, { color: 'white' }]}>Guardar</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Edit Date Picker Modal */}
                  {showEditDatePicker && (
                    <DateTimePicker
                      value={editTaskDueDate || new Date()}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={onEditDateChange}
                      minimumDate={new Date()}
                    />
                  )}
                </View>
              ) : (
                // Display Mode
                <View style={[styles.taskItem, { backgroundColor: theme.card }]}>
                  <TouchableOpacity 
                    style={[
                      styles.checkbox, 
                      { 
                        borderColor: task.status === 'done' ? priorityColors[task.priority] : theme.gray,
                        backgroundColor: task.status === 'done' ? priorityColors[task.priority] : 'transparent'
                      }
                    ]}
                    onPress={() => toggleTaskStatus(task.id)}
                  >
                    {task.status === 'done' && (
                      <Ionicons name="checkmark" size={14} color="white" />
                    )}
                  </TouchableOpacity>
                  
                  <View style={styles.taskContent}>
                    <View style={styles.taskHeader}>
                      <Text 
                        style={[
                          styles.taskText, 
                          { 
                            color: task.status === 'done' ? theme.gray : theme.text,
                            textDecorationLine: task.status === 'done' ? 'line-through' : 'none'
                          }
                        ]}
                      >
                        {task.title}
                      </Text>
                      <View style={styles.taskActions}>
                        <TouchableOpacity 
                          style={[styles.editButton, { backgroundColor: theme.background }]}
                          onPress={() => startEditTask(task)}
                        >
                          <Ionicons name="pencil" size={14} color={theme.primary} />
                        </TouchableOpacity>
                        
                        <View style={styles.taskMeta}>
                          <View 
                            style={[
                              styles.priorityBadge, 
                              { backgroundColor: priorityColors[task.priority] }
                            ]}
                          >
                            <Text style={styles.priorityText}>
                              {priorityLabels[task.priority]}
                            </Text>
                          </View>
                          {task.dueDate && (
                            <Text style={[styles.dueDateText, { color: theme.gray }]}>
                              {formatDate(task.dueDate)}
                            </Text>
                          )}
                        </View>
                      </View>
                    </View>
                    
                    {task.description && (
                      <Text 
                        style={[
                          styles.taskDescription, 
                          { 
                            color: task.status === 'done' ? theme.gray : theme.gray,
                            textDecorationLine: task.status === 'done' ? 'line-through' : 'none'
                          }
                        ]}
                      >
                        {task.description}
                      </Text>
                    )}
                  </View>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 10,
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 10,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
  },
  addTaskContainer: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  taskInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 12,
    minHeight: 44,
  },
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '500',
    minWidth: 60,
  },
  priorityButtons: {
    flexDirection: 'row',
    flex: 1,
    gap: 6,
  },
  priorityButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    gap: 4,
  },
  priorityButtonText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  dateButtons: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
  },
  dateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    gap: 6,
  },
  dateButtonText: {
    fontSize: 14,
    flex: 1,
  },
  clearDateButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  createButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  taskListContainer: {
    flex: 1,
  },
  loadingText: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 40,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 40,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  taskContent: {
    flex: 1,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  taskText: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    marginRight: 10,
  },
  taskMeta: {
    alignItems: 'flex-end',
    gap: 4,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  priorityText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  dueDateText: {
    fontSize: 12,
    fontWeight: '500',
  },
  taskDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  // New larger, cleaner task creation styles
  firstOptionsRow: {
    marginBottom: 20,
  },
  secondOptionsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  priorityButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityButtonLarge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1.5,
    gap: 6,
    minHeight: 48,
  },
  priorityLabelLarge: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  dateSection: {
    flex: 1,
  },
  dateControls: {
    flexDirection: 'row',
    gap: 8,
  },
  dateButtonLarge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    gap: 8,
    minHeight: 48,
  },
  dateButtonTextLarge: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  clearDateButtonLarge: {
    width: 48,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonsVertical: {
    gap: 8,
    minWidth: 80,
  },
  createButtonLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
    minHeight: 48,
  },
  createButtonTextLarge: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  cancelButtonLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    gap: 6,
    minHeight: 44,
  },
  cancelButtonTextLarge: {
    fontSize: 12,
    fontWeight: '500',
  },
  // Edit task styles
  editTaskContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  editTaskInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 12,
    fontWeight: '500',
  },
  editTaskDescInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 16,
    minHeight: 60,
  },
  editOptionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  editSectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    minWidth: 60,
  },
  editPriorityButtons: {
    flexDirection: 'row',
    flex: 1,
    gap: 6,
  },
  editPriorityButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 6,
    borderWidth: 1.5,
    minHeight: 36,
  },
  editDateControls: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
  },
  editDateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    gap: 6,
  },
  editDateText: {
    fontSize: 14,
    flex: 1,
  },
  clearEditDateButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editActionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  editCancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1.5,
    gap: 6,
  },
  editCancelText: {
    fontSize: 14,
    fontWeight: '500',
  },
  editSaveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  editSaveText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  taskActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
