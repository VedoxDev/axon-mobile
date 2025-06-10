import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { Task } from '@/services/taskService';

const { width } = Dimensions.get('window');

interface TaskInfoModalProps {
  visible: boolean;
  task: Task | null;
  onClose: () => void;
}

export const TaskInfoModal: React.FC<TaskInfoModalProps> = ({
  visible,
  task,
  onClose
}) => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  if (!task) return null;

  const getPriorityInfo = () => {
    switch (task.priority) {
      case 1:
        return { text: 'Baja', color: '#10B981', icon: 'arrow-down' as const };
      case 2:
        return { text: 'Media', color: '#F59E0B', icon: 'arrow-forward' as const };
      case 3:
        return { text: 'Alta', color: '#EF4444', icon: 'arrow-up' as const };
      case 4:
        return { text: 'Crítica', color: '#7C3AED', icon: 'flame' as const };
      default:
        return { text: 'Media', color: '#F59E0B', icon: 'arrow-forward' as const };
    }
  };

  const getStatusInfo = () => {
    switch (task.status) {
      case 'done':
        return { text: 'Completada', color: theme.green, icon: 'checkmark-circle' as const };
      case 'in_progress':
        return { text: 'En progreso', color: theme.primary, icon: 'play-circle' as const };
      default:
        return { text: 'Pendiente', color: theme.orange, icon: 'time' as const };
    }
  };

  const priorityInfo = getPriorityInfo();
  const statusInfo = getStatusInfo();
  const dueDate = task.dueDate ? new Date(task.dueDate) : null;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const completedSubtasks = task.subtasks.filter(subtask => subtask.completed).length;
  const totalSubtasks = task.subtasks.length;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '15' }]}>
                <Ionicons name={statusInfo.icon} size={16} color={statusInfo.color} />
                <Text style={[styles.statusText, { color: statusInfo.color }]}>
                  {statusInfo.text}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={theme.gray} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Task Title */}
            <Text style={[styles.title, { color: theme.text }]}>{task.title}</Text>

            {/* Priority Badge */}
            <View style={styles.priorityContainer}>
              <View style={[styles.priorityBadge, { backgroundColor: priorityInfo.color + '15' }]}>
                <Ionicons name={priorityInfo.icon} size={16} color={priorityInfo.color} />
                <Text style={[styles.priorityText, { color: priorityInfo.color }]}>
                  Prioridad {priorityInfo.text}
                </Text>
              </View>
            </View>

            {/* Description */}
            {task.description && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Descripción</Text>
                <Text style={[styles.description, { color: theme.gray }]}>
                  {task.description}
                </Text>
              </View>
            )}

            {/* Due Date */}
            {dueDate && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Fecha de Entrega</Text>
                <View style={styles.dateTimeContainer}>
                  <View style={styles.dateTimeItem}>
                    <Ionicons name="calendar" size={16} color={theme.primary} />
                    <Text style={[styles.dateTimeText, { color: theme.text }]}>
                      {formatDate(dueDate)}
                    </Text>
                  </View>
                  <View style={styles.dateTimeItem}>
                    <Ionicons name="time" size={16} color={theme.primary} />
                    <Text style={[styles.dateTimeText, { color: theme.text }]}>
                      {formatTime(dueDate)}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Project Section */}
            {task.project && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Proyecto</Text>
                <View style={styles.projectContainer}>
                  <Ionicons name="folder" size={20} color={theme.primary} />
                  <Text style={[styles.projectName, { color: theme.text }]}>
                    {task.project.name}
                  </Text>
                </View>
              </View>
            )}

            {/* Section */}
            {task.section && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Sección</Text>
                <View style={styles.sectionContainer}>
                  <Ionicons name="layers" size={16} color={theme.gray} />
                  <Text style={[styles.sectionName, { color: theme.text }]}>
                    {task.section.name}
                  </Text>
                </View>
              </View>
            )}

            {/* Created By */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Creado por</Text>
              <View style={styles.userItem}>
                <View style={[styles.userAvatar, { backgroundColor: theme.primary + '15' }]}>
                  <Text style={[styles.userInitials, { color: theme.primary }]}>
                    {task.createdBy.nombre.charAt(0)}{task.createdBy.apellidos.charAt(0)}
                  </Text>
                </View>
                <Text style={[styles.userName, { color: theme.text }]}>
                  {task.createdBy.nombre} {task.createdBy.apellidos}
                </Text>
              </View>
            </View>

            {/* Assignees */}
            {task.assignees && task.assignees.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  Asignados ({task.assignees.length})
                </Text>
                <View style={styles.assigneesContainer}>
                  {task.assignees.map((assignee, index) => {
                    const initials = assignee.nombre.charAt(0) + assignee.apellidos.charAt(0);
                    const fullName = `${assignee.nombre} ${assignee.apellidos}`;
                    
                    return (
                      <View key={index} style={styles.assigneeTag}>
                        <View style={[styles.assigneeAvatar, { backgroundColor: theme.gray + '20' }]}>
                          <Text style={[styles.assigneeInitials, { color: theme.text }]}>
                            {initials}
                          </Text>
                        </View>
                        <Text style={[styles.assigneeName, { color: theme.text }]}>
                          {fullName}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Labels */}
            {task.labels && task.labels.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  Etiquetas ({task.labels.length})
                </Text>
                <View style={styles.labelsContainer}>
                  {task.labels.map((label, index) => (
                    <View key={index} style={[styles.labelTag, { backgroundColor: label.color + '20' }]}>
                      <View style={[styles.labelDot, { backgroundColor: label.color }]} />
                      <Text style={[styles.labelName, { color: theme.text }]}>
                        {label.name}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Subtasks */}
            {task.subtasks && task.subtasks.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  Subtareas ({completedSubtasks}/{totalSubtasks})
                </Text>
                {/* Progress Bar */}
                <View style={[styles.progressBar, { backgroundColor: theme.gray + '30' }]}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { 
                        backgroundColor: theme.green, 
                        width: `${totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0}%` 
                      }
                    ]} 
                  />
                </View>
                <View style={styles.subtasksContainer}>
                  {task.subtasks.map((subtask, index) => (
                    <View key={index} style={styles.subtaskItem}>
                      <Ionicons 
                        name={subtask.completed ? "checkmark-circle" : "ellipse-outline"} 
                        size={20} 
                        color={subtask.completed ? theme.green : theme.gray} 
                      />
                      <Text 
                        style={[
                          styles.subtaskTitle, 
                          { 
                            color: subtask.completed ? theme.gray : theme.text,
                            textDecorationLine: subtask.completed ? 'line-through' : 'none'
                          }
                        ]}
                      >
                        {subtask.title}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Task ID */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>ID de Tarea</Text>
              <Text style={[styles.taskId, { color: theme.gray }]}>{task.id}</Text>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.closeButtonFooter, { borderColor: theme.gray }]}
              onPress={onClose}
            >
              <Text style={[styles.closeButtonText, { color: theme.text }]}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    maxHeight: '90%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
  },
  headerLeft: {
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
    fontFamily: 'Inter-Bold',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    paddingHorizontal: 20,
    maxHeight: 500,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
    marginBottom: 12,
  },
  priorityContainer: {
    marginBottom: 20,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  priorityText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
    fontFamily: 'Inter-Bold',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Inter-Bold',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: 'Inter-Regular',
  },
  dateTimeContainer: {
    gap: 8,
  },
  dateTimeItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateTimeText: {
    fontSize: 16,
    marginLeft: 8,
    fontFamily: 'Inter-Regular',
  },
  projectContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  projectName: {
    fontSize: 16,
    marginLeft: 8,
    fontFamily: 'Inter-Regular',
  },
  sectionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionName: {
    fontSize: 16,
    marginLeft: 8,
    fontFamily: 'Inter-Regular',
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userInitials: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-Bold',
  },
  userName: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  assigneesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  assigneeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 8,
  },
  assigneeAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  assigneeInitials: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter-Bold',
  },
  assigneeName: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  labelsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  labelTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 8,
  },
  labelDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  labelName: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter-Bold',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  subtasksContainer: {
    gap: 8,
  },
  subtaskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  subtaskTitle: {
    fontSize: 16,
    marginLeft: 12,
    fontFamily: 'Inter-Regular',
    flex: 1,
  },
  taskId: {
    fontSize: 14,
    fontFamily: 'monospace',
  },
  footer: {
    padding: 20,
    paddingTop: 10,
    gap: 12,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-Bold',
  },
  closeButtonFooter: {
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-Bold',
  },
}); 