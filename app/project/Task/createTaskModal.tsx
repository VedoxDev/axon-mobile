import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, Alert, Platform, Modal } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

import { TaskService } from '@/services/taskService';
import { SectionService, Section } from '@/services/sectionService';
import { ProjectService, ProjectMember } from '@/services/projectService';
import React from 'react';

type Priority = 1 | 2 | 3 | 4;
type Status = 'todo' | 'in_progress' | 'done';

const PRIORITY_OPTIONS = [
  { value: 1 as Priority, label: 'Baja', color: '#10B981', icon: '🟢' },
  { value: 2 as Priority, label: 'Media', color: '#F59E0B', icon: '🟡' },
  { value: 3 as Priority, label: 'Alta', color: '#EF4444', icon: '🔴' },
  { value: 4 as Priority, label: 'Crítica', color: '#7C3AED', icon: '🔥' },
];

const STATUS_OPTIONS: { value: Status; label: string; icon: string }[] = [
  { value: 'todo', label: 'Pendiente', icon: '⏳' },
  { value: 'in_progress', label: 'En Progreso', icon: '🔄' },
  { value: 'done', label: 'Completado', icon: '✅' },
];

export default function CreateTaskModal() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const router = useRouter();
  const { projectId, sectionId } = useLocalSearchParams<{ 
    projectId: string; 
    sectionId?: string;
  }>();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>(2);
  const [status, setStatus] = useState<Status>('todo');
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  // Section selection
  const [selectedSectionId, setSelectedSectionId] = useState<number | null>(
    sectionId ? parseInt(sectionId) : null
  );
  const [availableSections, setAvailableSections] = useState<Section[]>([]);
  const [loadingSections, setLoadingSections] = useState(false);
  
  // Labels functionality
  const [selectedLabelIds, setSelectedLabelIds] = useState<number[]>([]);
  const [availableLabels, setAvailableLabels] = useState<ProjectLabel[]>([]);
  const [loadingLabels, setLoadingLabels] = useState(false);

  // Assignees functionality
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>([]);
  const [availableMembers, setAvailableMembers] = useState<ProjectMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [showAssigneeModal, setShowAssigneeModal] = useState(false);

  // Focus states
  const [focusedField, setFocusedField] = useState<string | null>(null);

  type ProjectLabel = {
    id: number;
    name: string;
    color: string;
  };

  // Fetch available sections when component mounts (only for project tasks)
  useEffect(() => {
    if (projectId) {
      fetchSections();
      fetchLabels();
      fetchMembers();
    }
  }, [projectId]);

  // Handle label IDs from AsyncStorage when returning from selectLabelsModal
  useFocusEffect(
    React.useCallback(() => {
      const loadSelectedLabels = async () => {
        try {
          const savedLabelIds = await AsyncStorage.getItem('selectedLabelIds');
          if (savedLabelIds) {
            const ids = JSON.parse(savedLabelIds);
            setSelectedLabelIds(ids);
            // Clear the saved data after using it
            await AsyncStorage.removeItem('selectedLabelIds');
          }
        } catch (error) {
          console.error('Failed to load selected labels:', error);
        }
      };
      
      loadSelectedLabels();
    }, [])
  );

  const fetchSections = async () => {
    try {
      setLoadingSections(true);
      const sections = await SectionService.getSections(projectId);
      setAvailableSections(sections);
    } catch (error) {
      console.error('Failed to fetch sections:', error);
      // Still allow task creation even if sections fail to load
      setAvailableSections([]);
    } finally {
      setLoadingSections(false);
    }
  };

  const fetchLabels = async () => {
    try {
      setLoadingLabels(true);
      const labels = await TaskService.getProjectLabels(projectId);
      setAvailableLabels(labels);
    } catch (error) {
      console.error('Failed to fetch labels:', error);
      setAvailableLabels([]);
    } finally {
      setLoadingLabels(false);
    }
  };

  const fetchMembers = async () => {
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

  const handleCreateTask = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'El título de la tarea no puede estar vacío');
      return;
    }

    try {
      setIsCreating(true);
      
      const taskData = {
        title: title.trim(),
        description: description.trim(),
        projectId: projectId || undefined,
        sectionId: selectedSectionId || undefined,
        priority,
        status,
        dueDate: dueDate?.toISOString(),
        labelIds: selectedLabelIds.length > 0 ? selectedLabelIds : undefined,
        assigneeIds: selectedAssigneeIds.length > 0 ? selectedAssigneeIds : undefined,
      };

      await TaskService.createTask(taskData);
      router.back();
    } catch (error) {
      console.error('Failed to create task:', error);
      Alert.alert('Error', 'Error al crear la tarea');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    
    if (selectedDate && event.type !== 'dismissed') {
      setDueDate(selectedDate);
      if (Platform.OS === 'ios') {
        setShowDatePicker(false);
      }
    } else if (Platform.OS === 'ios') {
      setShowDatePicker(false);
    }
  };

  const showDatePickerModal = () => {
    try {
      setShowDatePicker(true);
    } catch (error) {
      console.error('Error showing date picker:', error);
      Alert.alert('Error', 'No se pudo abrir el selector de fecha. Por favor inténtalo de nuevo.');
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);

  const renderPrioritySelector = () => {
    const selectedPriority = PRIORITY_OPTIONS.find(p => p.value === priority);
    
    return (
      <View>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Prioridad</Text>
        <TouchableOpacity
          style={[styles.dropdownButton, { 
            backgroundColor: colorScheme === 'dark' ? '#3A3A3A' : '#FFFFFF',
            borderColor: showPriorityDropdown ? '#F97316' : '#E0E0E0',
            borderWidth: showPriorityDropdown ? 2 : 1,
            shadowColor: showPriorityDropdown ? '#F97316' : 'transparent',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: showPriorityDropdown ? 0.3 : 0,
            shadowRadius: showPriorityDropdown ? 4 : 0,
            elevation: showPriorityDropdown ? 3 : 0,
          }]}
          onPress={() => setShowPriorityDropdown(!showPriorityDropdown)}
        >
          <View style={styles.dropdownSelected}>
            <Text style={styles.priorityIcon}>{selectedPriority?.icon}</Text>
            <Text style={[styles.dropdownText, { color: theme.text }]}>
              {selectedPriority?.label}
            </Text>
          </View>
          <Ionicons 
            name={showPriorityDropdown ? "chevron-up" : "chevron-down"} 
            size={20} 
            color={theme.gray} 
          />
        </TouchableOpacity>
        
        {showPriorityDropdown && (
          <View style={[styles.dropdownMenu, { 
            backgroundColor: colorScheme === 'dark' ? '#3A3A3A' : '#FFFFFF',
            borderColor: '#E0E0E0'
          }]}>
            {PRIORITY_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.dropdownOption,
                  priority === option.value && { backgroundColor: option.color + '20' }
                ]}
                onPress={() => {
                  setPriority(option.value);
                  setShowPriorityDropdown(false);
                }}
              >
                <Text style={styles.priorityIcon}>{option.icon}</Text>
                <Text style={[styles.dropdownOptionText, { color: theme.text }]}>
                  {option.label}
                </Text>
                {priority === option.value && (
                  <Ionicons name="checkmark" size={20} color={option.color} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  const renderStatusSelector = () => {
    const selectedStatus = STATUS_OPTIONS.find(s => s.value === status);
    
    return (
      <View>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Estado</Text>
        <TouchableOpacity
          style={[styles.dropdownButton, { 
            backgroundColor: colorScheme === 'dark' ? '#3A3A3A' : '#FFFFFF',
            borderColor: showStatusDropdown ? '#F97316' : '#E0E0E0',
            borderWidth: showStatusDropdown ? 2 : 1,
            shadowColor: showStatusDropdown ? '#F97316' : 'transparent',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: showStatusDropdown ? 0.3 : 0,
            shadowRadius: showStatusDropdown ? 4 : 0,
            elevation: showStatusDropdown ? 3 : 0,
          }]}
          onPress={() => setShowStatusDropdown(!showStatusDropdown)}
        >
          <View style={styles.dropdownSelected}>
            <Text style={styles.priorityIcon}>{selectedStatus?.icon}</Text>
            <Text style={[styles.dropdownText, { color: theme.text }]}>
              {selectedStatus?.label}
            </Text>
          </View>
          <Ionicons 
            name={showStatusDropdown ? "chevron-up" : "chevron-down"} 
            size={20} 
            color={theme.gray} 
          />
        </TouchableOpacity>
        
        {showStatusDropdown && (
          <View style={[styles.dropdownMenu, { 
            backgroundColor: colorScheme === 'dark' ? '#3A3A3A' : '#FFFFFF',
            borderColor: '#E0E0E0'
          }]}>
            {STATUS_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.dropdownOption,
                  status === option.value && { backgroundColor: theme.primary + '20' }
                ]}
                onPress={() => {
                  setStatus(option.value);
                  setShowStatusDropdown(false);
                }}
              >
                <Text style={styles.priorityIcon}>{option.icon}</Text>
                <Text style={[styles.dropdownOptionText, { color: theme.text }]}>
                  {option.label}
                </Text>
                {status === option.value && (
                  <Ionicons name="checkmark" size={20} color={theme.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  const [showSectionDropdown, setShowSectionDropdown] = useState(false);

  const renderSectionSelector = () => {
    if (!projectId) return null; // Don't show section selector for personal tasks

    const selectedSection = selectedSectionId 
      ? availableSections.find(s => s.id === selectedSectionId)
      : null;
    const displayText = selectedSection ? selectedSection.name : 'Sin Sección';

    return (
      <View>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Sección</Text>
        {loadingSections ? (
          <ActivityIndicator size="small" color={theme.primary} style={{ marginVertical: 10 }} />
        ) : (
          <>
            <TouchableOpacity
              style={[styles.dropdownButton, { 
                backgroundColor: colorScheme === 'dark' ? '#3A3A3A' : '#FFFFFF',
                borderColor: showSectionDropdown ? '#F97316' : '#E0E0E0',
                borderWidth: showSectionDropdown ? 2 : 1,
                shadowColor: showSectionDropdown ? '#F97316' : 'transparent',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: showSectionDropdown ? 0.3 : 0,
                shadowRadius: showSectionDropdown ? 4 : 0,
                elevation: showSectionDropdown ? 3 : 0,
              }]}
              onPress={() => setShowSectionDropdown(!showSectionDropdown)}
            >
              <View style={styles.dropdownSelected}>
                <Text style={[styles.dropdownText, { color: theme.text }]}>
                  {displayText}
                </Text>
              </View>
              <Ionicons 
                name={showSectionDropdown ? "chevron-up" : "chevron-down"} 
                size={20} 
                color={theme.gray} 
              />
            </TouchableOpacity>
            
            {showSectionDropdown && (
              <View style={[styles.dropdownMenu, { 
                backgroundColor: colorScheme === 'dark' ? '#3A3A3A' : '#FFFFFF',
                borderColor: '#E0E0E0'
              }]}>
                {/* No Section Option */}
                <TouchableOpacity
                  style={[
                    styles.dropdownOption,
                    selectedSectionId === null && { backgroundColor: theme.primary + '20' }
                  ]}
                  onPress={() => {
                    setSelectedSectionId(null);
                    setShowSectionDropdown(false);
                  }}
                >
                  <Text style={[styles.dropdownOptionText, { color: theme.text }]}>
                    Sin Sección
                  </Text>
                  {selectedSectionId === null && (
                    <Ionicons name="checkmark" size={20} color={theme.primary} />
                  )}
                </TouchableOpacity>
                
                {/* Available Sections */}
                {availableSections.map((section) => (
                  <TouchableOpacity
                    key={section.id}
                    style={[
                      styles.dropdownOption,
                      selectedSectionId === section.id && { backgroundColor: theme.primary + '20' }
                    ]}
                    onPress={() => {
                      setSelectedSectionId(section.id);
                      setShowSectionDropdown(false);
                    }}
                  >
                    <Text style={[styles.dropdownOptionText, { color: theme.text }]}>
                      {section.name}
                    </Text>
                    {selectedSectionId === section.id && (
                      <Ionicons name="checkmark" size={20} color={theme.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}
      </View>
    );
  };

  const toggleLabel = (labelId: number) => {
    setSelectedLabelIds(prev => 
      prev.includes(labelId) 
        ? prev.filter(id => id !== labelId)
        : [...prev, labelId]
    );
  };

  const renderLabelsSelector = () => {
    const selectedLabels = availableLabels.filter(label => selectedLabelIds.includes(label.id));
    
    return (
      <View>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Etiquetas</Text>
        <TouchableOpacity
          style={[styles.dropdownButton, { 
            backgroundColor: colorScheme === 'dark' ? '#3A3A3A' : '#FFFFFF',
            borderColor: focusedField === 'labels' ? '#F97316' : '#E0E0E0',
            borderWidth: focusedField === 'labels' ? 2 : 1,
            shadowColor: focusedField === 'labels' ? '#F97316' : 'transparent',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: focusedField === 'labels' ? 0.3 : 0,
            shadowRadius: focusedField === 'labels' ? 4 : 0,
            elevation: focusedField === 'labels' ? 3 : 0,
          }]}
          onPressIn={() => setFocusedField('labels')}
          onPressOut={() => setFocusedField(null)}
          onPress={() => {
            router.push({
              pathname: '/project/Task/selectLabelsModal',
              params: { 
                projectId,
                selectedIds: JSON.stringify(selectedLabelIds)
              }
            });
          }}
        >
          <View style={styles.dropdownSelected}>
            <Text style={[styles.dropdownText, { color: selectedLabelIds.length > 0 ? theme.text : theme.gray }]}>
              {selectedLabelIds.length > 0 
                ? `${selectedLabelIds.length} etiqueta${selectedLabelIds.length > 1 ? 's' : ''} seleccionada${selectedLabelIds.length > 1 ? 's' : ''}`
                : 'Seleccionar etiquetas'
              }
            </Text>
          </View>
          <Ionicons 
            name="chevron-forward" 
            size={20} 
            color={theme.gray} 
          />
        </TouchableOpacity>
        
        {/* Selected labels display */}
        {selectedLabels.length > 0 && (
          <View style={styles.selectedLabelsContainer}>
            {selectedLabels.map((label) => (
              <TouchableOpacity
                key={label.id}
                style={[styles.labelChip, { backgroundColor: label.color }]}
                onPress={() => toggleLabel(label.id)}
              >
                <Text style={styles.labelChipText}>{label.name}</Text>
                <Ionicons name="close" size={16} color="#fff" />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  const toggleAssignee = (memberId: string) => {
    setSelectedAssigneeIds(prev => 
      prev.includes(memberId) 
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const renderAssigneesSelector = () => {
    if (!projectId) return null; // Don't show assignees for personal tasks

    const selectedMembers = availableMembers.filter(member => selectedAssigneeIds.includes(member.id));
    
    return (
      <View>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Asignar a</Text>
        <TouchableOpacity
          style={[styles.dropdownButton, { 
            backgroundColor: colorScheme === 'dark' ? '#3A3A3A' : '#FFFFFF',
            borderColor: focusedField === 'assignees' ? '#F97316' : '#E0E0E0',
            borderWidth: focusedField === 'assignees' ? 2 : 1,
            shadowColor: focusedField === 'assignees' ? '#F97316' : 'transparent',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: focusedField === 'assignees' ? 0.3 : 0,
            shadowRadius: focusedField === 'assignees' ? 4 : 0,
            elevation: focusedField === 'assignees' ? 3 : 0,
          }]}
          onPressIn={() => setFocusedField('assignees')}
          onPressOut={() => setFocusedField(null)}
          onPress={() => setShowAssigneeModal(true)}
        >
          <View style={styles.dropdownSelected}>
            <Text style={[styles.dropdownText, { color: selectedAssigneeIds.length > 0 ? theme.text : theme.gray }]}>
              {selectedAssigneeIds.length > 0 
                ? `${selectedAssigneeIds.length} persona${selectedAssigneeIds.length > 1 ? 's' : ''} asignada${selectedAssigneeIds.length > 1 ? 's' : ''}`
                : 'Seleccionar asignados'
              }
            </Text>
          </View>
          <Ionicons 
            name="chevron-forward" 
            size={20} 
            color={theme.gray} 
          />
        </TouchableOpacity>
        
        {/* Selected assignees display */}
        {selectedMembers.length > 0 && (
          <View style={styles.selectedAssigneesContainer}>
            {selectedMembers.map((member) => (
              <TouchableOpacity
                key={member.id}
                style={[styles.assigneeChip, { backgroundColor: theme.primary + '20', borderColor: theme.primary }]}
                onPress={() => toggleAssignee(member.id)}
              >
                <View style={[styles.assigneeAvatar, { backgroundColor: theme.primary }]}>
                  <Text style={styles.assigneeInitial}>
                    {member.nombre.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text style={[styles.assigneeChipText, { color: theme.text }]}>
                  {member.nombre} {member.apellidos}
                </Text>
                <Ionicons name="close" size={16} color={theme.text} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.backdrop} 
        activeOpacity={1} 
        onPress={() => router.back()}
      />
      
      <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
        <View style={[styles.handle, { backgroundColor: theme.gray }]} />
        
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Crear Nueva Tarea</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={24} color={theme.text} />
          </TouchableOpacity>
        </View>


        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          onScrollBeginDrag={() => {
            // Close all dropdowns when scrolling
            setShowPriorityDropdown(false);
            setShowStatusDropdown(false);
            setShowSectionDropdown(false);
          }}
        >
          {/* Task Title */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Título *</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: colorScheme === 'dark' ? '#3A3A3A' : '#FFFFFF', 
                color: theme.text,
                borderColor: focusedField === 'title' ? '#F97316' : '#E0E0E0',
                borderWidth: focusedField === 'title' ? 2 : 1,
                shadowColor: focusedField === 'title' ? '#F97316' : 'transparent',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: focusedField === 'title' ? 0.3 : 0,
                shadowRadius: focusedField === 'title' ? 4 : 0,
                elevation: focusedField === 'title' ? 3 : 0,
              }]}
              placeholder="Ingresa el título de la tarea"
              placeholderTextColor={theme.gray}
              value={title}
              onChangeText={setTitle}
              onFocus={() => setFocusedField('title')}
              onBlur={() => setFocusedField(null)}
              maxLength={100}
              multiline={false}
            />
          </View>

          {/* Task Description */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Descripción</Text>
            <TextInput
              style={[styles.textArea, { 
                backgroundColor: colorScheme === 'dark' ? '#3A3A3A' : '#FFFFFF', 
                color: theme.text,
                borderColor: focusedField === 'description' ? '#F97316' : '#E0E0E0',
                borderWidth: focusedField === 'description' ? 2 : 1,
                shadowColor: focusedField === 'description' ? '#F97316' : 'transparent',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: focusedField === 'description' ? 0.3 : 0,
                shadowRadius: focusedField === 'description' ? 4 : 0,
                elevation: focusedField === 'description' ? 3 : 0,
              }]}
              placeholder="Ingresa la descripción de la tarea"
              placeholderTextColor={theme.gray}
              value={description}
              onChangeText={setDescription}
              onFocus={() => setFocusedField('description')}
              onBlur={() => setFocusedField(null)}
              maxLength={500}
              multiline={true}
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Priority and Status Selectors - Side by Side */}
          <View style={styles.compactRow}>
            <View style={styles.compactSection}>
              {renderPrioritySelector()}
            </View>
            <View style={styles.compactSection}>
              {renderStatusSelector()}
            </View>
          </View>

          {/* Section Selector */}
          <View style={styles.section}>
            {renderSectionSelector()}
          </View>

          {/* Labels Selector */}
          <View style={styles.section}>
            {renderLabelsSelector()}
          </View>

          {/* Assignees Selector */}
          <View style={styles.section}>
            {renderAssigneesSelector()}
          </View>

          {/* Due Date */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Fecha de Vencimiento</Text>
            <TouchableOpacity
              style={[styles.dateButton, { 
                backgroundColor: colorScheme === 'dark' ? '#3A3A3A' : '#F2F2F2',
                borderColor: focusedField === 'dueDate' ? '#F97316' : '#E0E0E0',
                borderWidth: focusedField === 'dueDate' ? 2 : 1,
                shadowColor: focusedField === 'dueDate' ? '#F97316' : 'transparent',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: focusedField === 'dueDate' ? 0.3 : 0,
                shadowRadius: focusedField === 'dueDate' ? 4 : 0,
                elevation: focusedField === 'dueDate' ? 3 : 0,
              }]}
              onPressIn={() => setFocusedField('dueDate')}
              onPressOut={() => setFocusedField(null)}
              onPress={showDatePickerModal}
            >
              <Ionicons name="calendar-outline" size={20} color={theme.primary} />
              <Text style={[styles.dateText, { color: theme.text }]}>
                {dueDate ? formatDate(dueDate) : 'Establecer fecha de vencimiento'}
              </Text>
              {dueDate && (
                <TouchableOpacity onPress={() => setDueDate(null)}>
                  <Ionicons name="close-circle" size={20} color={theme.gray} />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          </View>


        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={() => router.back()}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, styles.createButton, { backgroundColor: theme.primary }]}
            onPress={handleCreateTask}
            disabled={isCreating || !title.trim()}
          >
            {isCreating ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.createButtonText}>Crear Tarea</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Date Picker */}
        {showDatePicker && Platform.OS === 'android' && (
          <DateTimePicker
            value={dueDate || new Date()}
            mode="date"
            display="default"
            onChange={handleDateChange}
            minimumDate={new Date()}
          />
        )}
        
        {showDatePicker && Platform.OS === 'ios' && (
          <DateTimePicker
            value={dueDate || new Date()}
            mode="datetime"
            display="spinner"
            onChange={handleDateChange}
            minimumDate={new Date()}
          />
        )}

        {/* Assignee Selection Modal */}
        <Modal
          visible={showAssigneeModal}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
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
        </Modal>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
    height: '85%',
    minHeight: 500,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginVertical: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingBottom: 100, // Space for the footer
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 50,
  },
  textArea: {
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
  },
  priorityContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  priorityIcon: {
    fontSize: 16,
  },
  priorityLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  statusOption: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  sectionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sectionOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: '45%',
    alignItems: 'center',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
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
  infoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#ccc',
  },
  createButton: {
    backgroundColor: '#42A5F5',
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: '600',
  },
  createButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  // New dropdown styles
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 50,
  },
  dropdownSelected: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  dropdownText: {
    fontSize: 16,
    flex: 1,
  },
  dropdownMenu: {
    position: 'absolute',
    top: 55,
    left: 0,
    right: 0,
    borderRadius: 8,
    borderWidth: 1,
    maxHeight: 200,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  dropdownOptionText: {
    fontSize: 16,
    flex: 1,
  },
  // Labels styles
  selectedLabelsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  labelChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  labelChipText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  compactRow: {
    flexDirection: 'row',
    gap: 12,
  },
  compactSection: {
    flex: 1,
  },
  labelColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  // Assignee styles
  selectedAssigneesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  assigneeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  assigneeAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  assigneeInitial: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  assigneeChipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  // Modal styles
  modalContainer: {
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