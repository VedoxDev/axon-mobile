import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions, Image, ScrollView, Pressable, ActivityIndicator, Alert, TextInput, Modal as RNModal, Platform } from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { TaskService, Task } from '@/services/taskService';
import { ProjectService, ProjectMember } from '@/services/projectService';
import { generateSectionColor } from '@/services/sectionService';

// Status and Priority configurations
const STATUS_CONFIG = {
  'todo': { label: 'Pendiente', color: '#6B7280' },
  'in_progress': { label: 'En Progreso', color: '#F59E0B' },
  'done': { label: 'Completado', color: '#10B981' },
};

const PRIORITY_CONFIG = {
  1: { label: 'Baja', color: '#10B981', icon: '🟢' },
  2: { label: 'Media', color: '#F59E0B', icon: '🟡' },
  3: { label: 'Alta', color: '#EF4444', icon: '🔴' },
  4: { label: 'Crítica', color: '#7C3AED', icon: '🔥' },
};

const PRIORITY_OPTIONS = [
  { value: 1 as const, label: 'Baja', color: '#10B981', icon: '🟢' },
  { value: 2 as const, label: 'Media', color: '#F59E0B', icon: '🟡' },
  { value: 3 as const, label: 'Alta', color: '#EF4444', icon: '🔴' },
  { value: 4 as const, label: 'Crítica', color: '#7C3AED', icon: '🔥' },
];

const STATUS_OPTIONS = [
  { value: 'todo' as const, label: 'Pendiente' },
  { value: 'in_progress' as const, label: 'En Progreso' },
  { value: 'done' as const, label: 'Completado' },
];

export default function Modal() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const { taskId } = useLocalSearchParams<{ taskId: string }>();

  const [task, setTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Edit mode states
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedTask, setEditedTask] = useState<Partial<Task>>({});
  
  // Dropdown states
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  
  // Focus listener for handling label selection return
  const [refreshLabels, setRefreshLabels] = useState(0);
  
  // Assignees functionality
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>([]);
  const [availableMembers, setAvailableMembers] = useState<ProjectMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [showAssigneeModal, setShowAssigneeModal] = useState(false);
  
  // Due date functionality
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    if (taskId) {
      fetchTask();
    }
  }, [taskId]);

  useFocusEffect(
    useCallback(() => {
      const handleFocus = async () => {
        // Check if we returned from label selection
        const selectedLabelIds = await AsyncStorage.getItem('selectedLabelIds');
        if (selectedLabelIds && isEditing) {
          try {
            const labelIds = JSON.parse(selectedLabelIds);
            setEditedTask(prev => ({ ...prev, labelIds } as any));
            // Clear the stored selection
            await AsyncStorage.removeItem('selectedLabelIds');
            setRefreshLabels(prev => prev + 1);
          } catch (error) {
            console.error('Failed to parse selected labels:', error);
          }
        }
      };
      
      handleFocus();
    }, [isEditing])
  );

  const fetchTask = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const taskData = await TaskService.getTaskById(taskId);
      setTask(taskData);
      setEditedTask(taskData);
      
      // Initialize assignee IDs for editing
      setSelectedAssigneeIds(taskData.assignees?.map(a => a.id) || []);
      
      // Fetch project members if it's a project task
      if (taskData.project?.id) {
        fetchMembers(taskData.project.id);
      }
    } catch (err: any) {
      console.error('Failed to fetch task:', err);
      setError(err.message || 'Error al cargar la tarea');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMembers = async (projectId: string) => {
    try {
      setLoadingMembers(true);
      const members = await ProjectService.getProjectMembers(projectId);
      setAvailableMembers(members);
    } catch (error) {
      console.error('Failed to fetch project members:', error);
      setAvailableMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleEditToggle = () => {
    if (isEditing) {
      // Cancel editing - restore original values
      setEditedTask(task || {});
      setIsEditing(false);
      setShowPriorityDropdown(false);
      setShowStatusDropdown(false);
    } else {
      setIsEditing(true);
    }
  };

  const handleSave = async () => {
    if (!task || !editedTask.title?.trim()) {
      Alert.alert('Error', 'El título no puede estar vacío');
      return;
    }

    try {
      setIsSaving(true);
      
      const updateData: any = {
        title: editedTask.title?.trim(),
        description: editedTask.description?.trim(),
        priority: editedTask.priority,
        status: editedTask.status,
        labelIds: (editedTask as any).labelIds,
        assigneeIds: selectedAssigneeIds.length > 0 ? selectedAssigneeIds : [],
        dueDate: (editedTask as any).dueDate,
      };

      const updatedTask = await TaskService.updateTask(taskId, updateData);
      setTask(updatedTask);
      setEditedTask(updatedTask);
      setIsEditing(false);
      setShowPriorityDropdown(false);
      setShowStatusDropdown(false);
      
      Alert.alert('Éxito', 'Tarea actualizada correctamente');
    } catch (err: any) {
      console.error('Failed to update task:', err);
      Alert.alert('Error', err.message || 'Error al actualizar la tarea');
    } finally {
      setIsSaving(false);
    }
  };

  const renderPrioritySelector = () => (
    <TouchableOpacity
      onPress={() => setShowPriorityDropdown(!showPriorityDropdown)}
      style={[styles.priorityContainer, { backgroundColor: theme.inputBackground }]}
    >
      <Text style={styles.priorityIcon}>
        {editedTask.priority ? PRIORITY_CONFIG[editedTask.priority as keyof typeof PRIORITY_CONFIG]?.icon : '🟢'}
      </Text>
      <Text style={[styles.priorityText, { color: editedTask.priority ? PRIORITY_CONFIG[editedTask.priority as keyof typeof PRIORITY_CONFIG]?.color : '#10B981' }]}>
        {editedTask.priority ? PRIORITY_CONFIG[editedTask.priority as keyof typeof PRIORITY_CONFIG]?.label : 'Baja'}
      </Text>
      <Ionicons name="chevron-down" size={16} color={theme.gray} />
    </TouchableOpacity>
  );

  const renderStatusSelector = () => (
    <TouchableOpacity
      onPress={() => setShowStatusDropdown(!showStatusDropdown)}
      style={[styles.statusPill, { 
        backgroundColor: editedTask.status ? STATUS_CONFIG[editedTask.status as keyof typeof STATUS_CONFIG]?.color : '#E0E0E0' 
      }]}
    >
      <Text style={styles.statusText}>
        {editedTask.status ? STATUS_CONFIG[editedTask.status as keyof typeof STATUS_CONFIG]?.label : 'Pendiente'}
      </Text>
      <Ionicons name="chevron-down" size={16} color="#fff" />
    </TouchableOpacity>
  );

  const handleEditLabels = () => {
    const currentLabelIds = (editedTask as any).labelIds || task?.labels?.map(l => l.id) || [];
    router.push(`/project/Task/selectLabelsModal?projectId=${task?.project?.id}&selectedIds=${JSON.stringify(currentLabelIds)}`);
  };

  const getDisplayLabels = () => {
    if (isEditing) {
      // Get labels from editedTask.labelIds if available
      const labelIds = (editedTask as any).labelIds || task?.labels?.map(l => l.id) || [];
      return task?.labels?.filter(label => labelIds.includes(label.id)) || [];
    }
    return task?.labels || [];
  };

  const toggleAssignee = (memberId: string) => {
    setSelectedAssigneeIds(prev => 
      prev.includes(memberId) 
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const getDisplayAssignees = () => {
    if (isEditing) {
      return availableMembers.filter(member => selectedAssigneeIds.includes(member.id));
    }
    return task?.assignees || [];
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    
    if (selectedDate && event.type !== 'dismissed') {
      setEditedTask(prev => ({ ...prev, dueDate: selectedDate.toISOString() } as any));
      if (Platform.OS === 'ios') {
        setShowDatePicker(false);
      }
    } else if (Platform.OS === 'ios') {
      setShowDatePicker(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Pressable style={styles.backdrop} onPress={() => router.back()} />
        <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          <View style={[styles.handleBar, { backgroundColor: '#E0E0E0' }]} />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.text }]}>Cargando tarea...</Text>
          </View>
        </View>
      </View>
    );
  }

  if (error || !task) {
    return (
      <View style={styles.container}>
        <Pressable style={styles.backdrop} onPress={() => router.back()} />
        <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          <View style={[styles.handleBar, { backgroundColor: '#E0E0E0' }]} />
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: theme.text }]}>
              {error || 'Tarea no encontrada'}
            </Text>
            <TouchableOpacity onPress={fetchTask} style={styles.retryButton}>
              <Text style={styles.retryButtonText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  const statusConfig = STATUS_CONFIG[task.status as keyof typeof STATUS_CONFIG];
  const priorityConfig = PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG];

  const displayTask = isEditing ? editedTask : task;

  return (
    <View style={styles.container}>
      <Pressable style={styles.backdrop} onPress={() => router.back()} />
      <View
        style={[
          styles.modalContainer,
          {
            backgroundColor: theme.background,
            borderColor: statusConfig?.color || '#E0E0E0',
            borderWidth: 3,
            shadowColor: statusConfig?.color || '#E0E0E0',
            shadowOpacity: 0.3,
            shadowRadius: 12,
          },
        ]}
      >
        {/* Handle bar */}
        <View style={[styles.handleBar, { backgroundColor: statusConfig?.color || '#E0E0E0' }]} />
        
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
              <View style={styles.titleRow}>
                <Text style={[styles.priorityIcon]}>{priorityConfig?.icon}</Text>
                {isEditing ? (
                  <TextInput
                    style={[styles.titleInput, { color: theme.text, borderColor: theme.primary }]}
                    value={editedTask.title || ''}
                    onChangeText={(text) => setEditedTask(prev => ({ ...prev, title: text }))}
                    placeholder="Título de la tarea"
                    placeholderTextColor={theme.gray}
                    multiline
                  />
                ) : (
                  <Text style={[styles.title, { color: theme.text }]}>{task.title}</Text>
                )}
              </View>
              {isEditing ? (
                <View style={{ position: 'relative' }}>
                  {renderStatusSelector()}
                  {showStatusDropdown && (
                    <View style={[styles.statusDropdown, { backgroundColor: theme.background }]}>
                      {STATUS_OPTIONS.map((option) => (
                        <TouchableOpacity
                          key={option.value}
                          onPress={() => {
                            setEditedTask(prev => ({ ...prev, status: option.value }));
                            setShowStatusDropdown(false);
                          }}
                          style={styles.statusDropdownItem}
                        >
                          <Text style={[styles.statusDropdownText, { color: theme.text }]}>
                            {option.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              ) : (
                <View style={[styles.statusPill, { backgroundColor: statusConfig?.color || '#E0E0E0' }]}>
                  <Text style={styles.statusText}>{statusConfig?.label || 'Desconocido'}</Text>
                </View>
              )}
            </View>
            
            {/* Edit/Save/Cancel buttons */}
            <View style={styles.actionButtons}>
              {isEditing ? (
                <>
                  <TouchableOpacity 
                    onPress={handleEditToggle}
                    style={[styles.actionButton, { backgroundColor: '#E5E7EB' }]}
                    disabled={isSaving}
                  >
                    <Ionicons name="close" size={20} color="#374151" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={handleSave}
                    style={[styles.actionButton, { backgroundColor: theme.primary }]}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Ionicons name="checkmark" size={20} color="#fff" />
                    )}
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity 
                  onPress={handleEditToggle}
                  style={[styles.actionButton, { backgroundColor: theme.primary }]}
                >
                  <Ionicons name="pencil" size={20} color="#fff" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Priority Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Prioridad</Text>
            {isEditing ? (
              <View style={{ position: 'relative' }}>
                {renderPrioritySelector()}
                {showPriorityDropdown && (
                  <View style={[styles.dropdown, { backgroundColor: theme.background }]}>
                    {PRIORITY_OPTIONS.map((option) => (
                      <TouchableOpacity
                        key={option.value}
                        onPress={() => {
                          setEditedTask(prev => ({ ...prev, priority: option.value }));
                          setShowPriorityDropdown(false);
                        }}
                        style={styles.dropdownItem}
                      >
                        <Text style={styles.priorityIcon}>{option.icon}</Text>
                        <Text style={[styles.dropdownItemText, { color: option.color }]}>
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.priorityContainer}>
                <Text style={styles.priorityIcon}>{priorityConfig?.icon}</Text>
                <Text style={[styles.priorityText, { color: priorityConfig?.color }]}>
                  {priorityConfig?.label || 'Desconocido'}
                </Text>
              </View>
            )}
          </View>

          {/* Labels Section */}
          {(getDisplayLabels().length > 0 || isEditing) && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Etiquetas</Text>
                {isEditing && (
                  <TouchableOpacity
                    onPress={handleEditLabels}
                    style={[styles.editButton, { backgroundColor: theme.primary }]}
                  >
                    <Ionicons name="pencil" size={16} color="#fff" />
                  </TouchableOpacity>
                )}
              </View>
              {getDisplayLabels().length > 0 ? (
                <View style={styles.labelsContainer}>
                  {getDisplayLabels().map((label) => (
                    <View
                      key={label.id}
                      style={[styles.labelChip, { backgroundColor: label.color }]}
                    >
                      <Text style={styles.labelText}>{label.name}</Text>
                    </View>
                  ))}
                </View>
              ) : isEditing ? (
                <TouchableOpacity
                  onPress={handleEditLabels}
                  style={[styles.addLabelsButton, { backgroundColor: theme.card, borderColor: theme.gray }]}
                >
                  <Ionicons name="add" size={20} color={theme.gray} />
                  <Text style={[styles.addLabelsText, { color: theme.gray }]}>
                    Agregar etiquetas
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          )}

          {/* Assignees Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Asignado a</Text>
              {isEditing && task?.project?.id && (
                <TouchableOpacity
                  onPress={() => setShowAssigneeModal(true)}
                  style={[styles.editButton, { backgroundColor: theme.primary }]}
                >
                  <Ionicons name="pencil" size={16} color="#fff" />
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.membersContainer}>
              {getDisplayAssignees().length > 0 ? (
                getDisplayAssignees().map((assignee) => (
                  <View key={assignee.id} style={styles.memberItem}>
                    <View style={styles.memberAvatar}>
                      <Text style={styles.memberInitial}>
                        {assignee.nombre.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <Text style={[styles.memberName, { color: theme.text }]}>
                      {assignee.nombre}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={[styles.noAssigneeText, { color: theme.text }]}>
                  {isEditing && task?.project?.id ? 'Toca el ícono para asignar' : 'Sin asignar'}
                </Text>
              )}
            </View>
          </View>

          {/* Due Date Section */}
          {(task.dueDate || (editedTask as any).dueDate || isEditing) && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Fecha de vencimiento</Text>
                {isEditing && (
                  <TouchableOpacity
                    onPress={() => setShowDatePicker(true)}
                    style={[styles.editButton, { backgroundColor: theme.primary }]}
                  >
                    <Ionicons name="pencil" size={16} color="#fff" />
                  </TouchableOpacity>
                )}
              </View>
              {isEditing ? (
                <TouchableOpacity
                  style={[styles.dateButton, { 
                    backgroundColor: theme.card,
                    borderColor: theme.primary,
                    borderWidth: 1
                  }]}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Ionicons name="calendar-outline" size={20} color={theme.primary} />
                  <Text style={[styles.dateText, { color: theme.text }]}>
                    {(editedTask as any).dueDate ? formatDate((editedTask as any).dueDate) : 'Establecer fecha de vencimiento'}
                  </Text>
                  {(editedTask as any).dueDate && (
                    <TouchableOpacity onPress={() => setEditedTask(prev => ({ ...prev, dueDate: null } as any))}>
                      <Ionicons name="close-circle" size={20} color={theme.gray} />
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              ) : (
                <View style={styles.dueDateContainer}>
                  <Text style={[styles.dueDate, { color: theme.text }]}>
                    {formatDate(task.dueDate!)}
                  </Text>
                  <Ionicons name="calendar" size={20} color={theme.text} />
                </View>
              )}
            </View>
          )}

          {/* Section */}
          {task.section && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Sección</Text>
              <View style={[styles.sectionChip, { backgroundColor: generateSectionColor(task.section.id, 0) }]}>
                <Text style={styles.sectionChipText}>{task.section.name}</Text>
              </View>
            </View>
          )}

          {/* Description Section */}
          {(task.description || isEditing) && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Descripción</Text>
              {isEditing ? (
                <TextInput
                  style={[styles.descriptionInput, { 
                    color: theme.text, 
                    borderColor: theme.primary,
                    backgroundColor: theme.card 
                  }]}
                  value={editedTask.description || ''}
                  onChangeText={(text) => setEditedTask(prev => ({ ...prev, description: text }))}
                  placeholder="Descripción de la tarea"
                  placeholderTextColor={theme.gray}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              ) : (
                <Text style={[styles.description, { color: theme.text }]}>{task.description}</Text>
              )}
            </View>
          )}

          {/* Creation Info */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Información</Text>
            <Text style={[styles.infoText, { color: theme.text }]}>
              Creado por: {task.createdBy.nombre} {task.createdBy.apellidos}
            </Text>
            <Text style={[styles.infoText, { color: theme.text }]}>
              Fecha de creación: {new Date(task.createdAt).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </Text>
            {task.updatedAt !== task.createdAt && (
              <Text style={[styles.infoText, { color: theme.text }]}>
                Última actualización: {new Date(task.updatedAt).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </Text>
            )}
          </View>
        </ScrollView>

        {/* Assignee Selection Modal */}
        {task?.project?.id && (
          <RNModal
            visible={showAssigneeModal}
            animationType="slide"
            presentationStyle="pageSheet"
          >
            <View style={[styles.assigneeModalContainer, { backgroundColor: theme.background }]}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setShowAssigneeModal(false)} style={[styles.modalCloseButton, { backgroundColor: theme.inputBackground }]}>
                  <Ionicons name="close" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.modalTitle, { color: theme.text }]}>Asignar Personas</Text>
                <View style={{ width: 40 }} />
              </View>
              
              <ScrollView style={styles.modalResultsContainer}>
                {loadingMembers ? (
                  <View style={styles.modalLoadingContainer}>
                    <ActivityIndicator size="large" color={theme.primary} />
                    <Text style={[styles.modalLoadingText, { color: theme.icon }]}>
                      Cargando miembros...
                    </Text>
                  </View>
                ) : availableMembers.length > 0 ? (
                  <View>
                    {availableMembers.map((member, index) => {
                      const isSelected = selectedAssigneeIds.includes(member.id);
                      
                      return (
                        <TouchableOpacity
                          key={member.id}
                          style={[
                            styles.searchResultItem,
                            { 
                              backgroundColor: isSelected ? theme.primary + '20' : theme.card,
                              borderColor: isSelected ? theme.primary + '40' : theme.separator + '40'
                            }
                          ]}
                          onPress={() => toggleAssignee(member.id)}
                        >
                          {/* Avatar */}
                          <View style={styles.searchResultAvatar}>
                            <View style={[styles.avatarBackground, { backgroundColor: theme.primary + '20' }]}>
                              <Text style={[styles.avatarText, { color: theme.primary }]}>
                                {member.nombre.charAt(0).toUpperCase()}
                              </Text>
                            </View>
                          </View>
                          
                          {/* User Info */}
                          <View style={styles.searchResultInfo}>
                            <Text style={[styles.searchResultName, { color: theme.text }]}>
                              {member.nombre} {member.apellidos}
                            </Text>
                            <Text style={[styles.searchResultRole, { color: theme.icon }]}>
                              {member.role === 'owner' ? 'Propietario' : 'Miembro'}
                            </Text>
                            {isSelected && (
                              <Text style={[styles.selectedLabel, { color: theme.green }]}>
                                ✓ Será asignado
                              </Text>
                            )}
                          </View>
                          
                          {/* Action Icon */}
                          <View style={styles.actionIcon}>
                            {isSelected ? (
                              <Ionicons name="remove-circle" size={20} color={theme.red} />
                            ) : (
                              <Ionicons name="add-circle" size={20} color={theme.primary} />
                            )}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ) : (
                  <View style={styles.modalNoResultsContainer}>
                    <Ionicons name="people-outline" size={60} color={theme.icon} />
                    <Text style={[styles.modalNoResultsText, { color: theme.icon }]}>
                      No hay miembros disponibles en este proyecto
                    </Text>
                  </View>
                )}
              </ScrollView>
            </View>
          </RNModal>
        )}

        {/* Date Picker */}
        {showDatePicker && Platform.OS === 'android' && (
          <DateTimePicker
            value={(editedTask as any).dueDate ? new Date((editedTask as any).dueDate) : new Date()}
            mode="date"
            display="default"
            onChange={handleDateChange}
            minimumDate={new Date()}
          />
        )}
        
        {showDatePicker && Platform.OS === 'ios' && (
          <DateTimePicker
            value={(editedTask as any).dueDate ? new Date((editedTask as any).dueDate) : new Date()}
            mode="datetime"
            display="spinner"
            onChange={handleDateChange}
            minimumDate={new Date()}
          />
        )}
      </View>
    </View>
  );
}

const { height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    zIndex: 0,
  },
  modalContainer: {
    height: height * 0.7,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    zIndex: 1,
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
  retryButton: {
    backgroundColor: '#42A5F5',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  priorityIcon: {
    fontSize: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
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
  priorityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priorityText: {
    fontSize: 16,
    fontWeight: '500',
  },
  labelsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  labelChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  labelText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
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
    backgroundColor: '#42A5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  memberInitial: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  memberName: {
    fontSize: 12,
  },
  noAssigneeText: {
    fontSize: 14,
    fontStyle: 'italic',
    opacity: 0.7,
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
  sectionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  sectionChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  sectionChipText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  descriptionInput: {
    fontSize: 16,
    lineHeight: 24,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
    opacity: 0.8,
  },
  titleInput: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    minHeight: 40,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    zIndex: 1000,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  dropdownItemText: {
    fontSize: 16,
    fontWeight: '500',
  },
  statusDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    zIndex: 1000,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statusDropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  statusDropdownText: {
    fontSize: 14,
    fontWeight: '500',
  },
  editButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addLabelsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  addLabelsText: {
    fontSize: 14,
    fontWeight: '500',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  dateText: {
    fontSize: 16,
    flex: 1,
  },
  // Modal styles (copied from createTaskModal)
  assigneeModalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalCloseButton: {
    borderRadius: 20,
    padding: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalResultsContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  modalLoadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  modalLoadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  modalNoResultsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  modalNoResultsText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  searchResultAvatar: {
    marginRight: 12,
  },
  avatarBackground: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  searchResultRole: {
    fontSize: 14,
    marginBottom: 2,
  },
  selectedLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionIcon: {
    marginLeft: 8,
  },
}); 