import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Pressable } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { TaskService } from '@/services/taskService';
import { SectionService, Section, generateSectionColor } from '@/services/sectionService';

type MoveOption = {
  id: string;
  sectionId: number | null;
  title: string;
  color: string;
  isBacklog?: boolean;
};

export default function MoveTaskModal() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const router = useRouter();
  const { projectId, taskId, taskTitle, currentSectionId } = useLocalSearchParams<{ 
    projectId: string; 
    taskId: string;
    taskTitle: string;
    currentSectionId?: string;
  }>();
  
  const [moveOptions, setMoveOptions] = useState<MoveOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMoving, setIsMoving] = useState(false);

  useEffect(() => {
    fetchSections();
  }, [projectId]);

  const fetchSections = async () => {
    try {
      setIsLoading(true);
      const sections = await SectionService.getSections(projectId);
      console.log('Fetched sections:', sections);
      console.log('Current section ID:', currentSectionId);
      
      // Create move options
      const options: MoveOption[] = [];
      
      // Add backlog option if task is not already in backlog
      const currentSectionIdNum = currentSectionId ? parseInt(currentSectionId) : null;
      console.log('Current section ID as number:', currentSectionIdNum);
      
      if (currentSectionIdNum !== null) {
        options.push({
          id: 'backlog',
          sectionId: null,
          title: 'Pendientes',
          color: '#6B7280',
          isBacklog: true
        });
      }
      
      // Add other sections
      sections.forEach((section, index) => {
        console.log('Processing section:', section.id, 'vs current:', currentSectionIdNum);
        if (section.id !== currentSectionIdNum) {
          options.push({
            id: `section-${section.id}`,
            sectionId: section.id,
            title: section.name,
            color: generateSectionColor(section.id, index)
          });
        }
      });
      
      console.log('Final move options:', options);
      setMoveOptions(options);
    } catch (error) {
      console.error('Failed to fetch sections:', error);
    } finally {
      setIsLoading(false);
    }
  };



  const handleMoveTask = async (targetSectionId: number | null) => {
    try {
      setIsMoving(true);
      console.log('Moving task:', taskId, 'to section:', targetSectionId);
      
      const updateData = { sectionId: targetSectionId };
      console.log('Update data:', updateData);
      
      const result = await TaskService.updateTask(taskId, updateData);
      console.log('Task update result:', result);
      
      router.back();
    } catch (error: any) {
      console.error('Failed to move task:', error);
      console.error('Error details:', error.response?.data || error.message);
      // TODO: Show error alert to user
    } finally {
      setIsMoving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Pressable style={styles.backdrop} onPress={() => router.back()} />
      
      <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={[styles.title, { color: theme.text }]}>Mover Tarea</Text>
            <Text style={[styles.subtitle, { color: theme.gray }]} numberOfLines={2}>
              {taskTitle}
            </Text>
          </View>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={24} color={theme.text} />
          </TouchableOpacity>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={[styles.instructions, { color: theme.text }]}>
            Selecciona la sección a la que quieres mover esta tarea:
          </Text>
        </View>

        {/* Move Options */}
        <ScrollView style={styles.optionsContainer} showsVerticalScrollIndicator={false}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={[styles.loadingText, { color: theme.gray }]}>
                Cargando secciones...
              </Text>
            </View>
          ) : moveOptions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="folder-open-outline" size={48} color={theme.gray} />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>
                No hay secciones disponibles
              </Text>
              <Text style={[styles.emptySubtitle, { color: theme.gray }]}>
                Esta tarea ya está en la única sección disponible o no hay otras secciones en el proyecto.
              </Text>
            </View>
          ) : (
            moveOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionButton,
                  { 
                    backgroundColor: theme.card,
                    borderColor: option.color + '30'
                  }
                ]}
                onPress={() => handleMoveTask(option.sectionId)}
                disabled={isMoving}
              >
                <View style={styles.optionContent}>
                  <View style={styles.optionLeft}>
                    <View 
                      style={[
                        styles.sectionIndicator, 
                        { 
                          backgroundColor: option.color,
                          borderStyle: option.isBacklog ? 'dashed' : 'solid'
                        }
                      ]} 
                    />
                    <View style={styles.optionTextContainer}>
                      <Text style={[styles.optionTitle, { color: theme.text }]}>
                        {option.title}
                      </Text>
                      <Text style={[styles.optionSubtitle, { color: theme.gray }]}>
                        {option.isBacklog ? 'Sin sección asignada' : 'Sección del proyecto'}
                      </Text>
                    </View>
                  </View>
                  
                  <Ionicons 
                    name="chevron-forward" 
                    size={20} 
                    color={theme.gray}
                    style={{ opacity: isMoving ? 0.5 : 1 }}
                  />
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>

        {/* Cancel Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.cancelButton, { backgroundColor: theme.card }]}
            onPress={() => router.back()}
          >
            <Text style={[styles.cancelButtonText, { color: theme.text }]}>
              Cancelar
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 20,
    maxHeight: '80%',
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    gap: 12,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 18,
  },
  instructionsContainer: {
    marginBottom: 20,
  },
  instructions: {
    fontSize: 16,
    lineHeight: 20,
  },
  optionsContainer: {
    maxHeight: 200,
    minHeight: 100,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  optionButton: {
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sectionIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: 12,
  },
  footer: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    marginTop: 8,
  },
  cancelButton: {
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
}); 