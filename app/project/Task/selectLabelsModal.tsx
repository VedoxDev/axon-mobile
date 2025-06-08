import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Pressable } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ProjectLabel = {
  id: number;
  name: string;
  color: string;
};

import { TaskService } from '@/services/taskService';

export default function SelectLabelsModal() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const router = useRouter();
  const { projectId, selectedIds } = useLocalSearchParams<{ 
    projectId: string; 
    selectedIds?: string;
  }>();
  
  const [availableLabels, setAvailableLabels] = useState<ProjectLabel[]>([]);
  const [selectedLabelIds, setSelectedLabelIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Parse selected IDs from params
    if (selectedIds) {
      try {
        const ids = JSON.parse(selectedIds);
        setSelectedLabelIds(ids);
      } catch (error) {
        console.error('Failed to parse selected IDs:', error);
      }
    }
    
    fetchLabels();
  }, [selectedIds]);

  const fetchLabels = async () => {
    try {
      setIsLoading(true);
      const labels = await TaskService.getProjectLabels(projectId);
      setAvailableLabels(labels);
    } catch (error) {
      console.error('Failed to fetch labels:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleLabel = (labelId: number) => {
    setSelectedLabelIds(prev => 
      prev.includes(labelId) 
        ? prev.filter(id => id !== labelId)
        : [...prev, labelId]
    );
  };

  const handleConfirm = async () => {
    try {
      // Store selected label IDs in AsyncStorage
      await AsyncStorage.setItem('selectedLabelIds', JSON.stringify(selectedLabelIds));
      // Go back to previous modal
      router.back();
    } catch (error) {
      console.error('Failed to save selected labels:', error);
      router.back();
    }
  };

  const selectedLabels = availableLabels.filter(label => selectedLabelIds.includes(label.id));

  return (
    <View style={styles.container}>
      <Pressable style={styles.backdrop} onPress={() => router.back()} />
      
      <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
        <View style={[styles.handleBar, { backgroundColor: theme.gray }]} />
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Seleccionar Etiquetas</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={24} color={theme.text} />
          </TouchableOpacity>
        </View>

        {/* Selected Labels Preview */}
        {selectedLabels.length > 0 && (
          <View style={styles.selectedSection}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Seleccionadas ({selectedLabels.length})
            </Text>
            <View style={styles.selectedLabelsContainer}>
              {selectedLabels.map((label) => (
                <TouchableOpacity
                  key={label.id}
                  style={[styles.selectedLabelChip, { backgroundColor: label.color }]}
                  onPress={() => toggleLabel(label.id)}
                >
                  <Text style={styles.selectedLabelText}>{label.name}</Text>
                  <Ionicons name="close" size={16} color="#fff" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Available Labels */}
        <View style={styles.content}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Etiquetas Disponibles
          </Text>
          
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.primary} />
              <Text style={[styles.loadingText, { color: theme.text }]}>
                Cargando etiquetas...
              </Text>
            </View>
          ) : (
            <ScrollView style={styles.labelsList} showsVerticalScrollIndicator={false}>
              {availableLabels.map((label) => {
                const isSelected = selectedLabelIds.includes(label.id);
                
                return (
                  <TouchableOpacity
                    key={label.id}
                    style={[
                      styles.labelOption,
                      { 
                        backgroundColor: isSelected ? label.color + '20' : theme.card,
                        borderColor: isSelected ? label.color : theme.gray + '40'
                      }
                    ]}
                    onPress={() => toggleLabel(label.id)}
                  >
                    <View style={styles.labelInfo}>
                      <View style={[styles.labelColorDot, { backgroundColor: label.color }]} />
                      <Text style={[styles.labelName, { color: theme.text }]}>
                        {label.name}
                      </Text>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={24} color={label.color} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={() => router.back()}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, styles.confirmButton, { backgroundColor: theme.primary }]}
            onPress={handleConfirm}
          >
            <Text style={styles.confirmButtonText}>
              Confirmar ({selectedLabelIds.length})
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
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    height: '80%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  handleBar: {
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
  selectedSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  selectedLabelsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectedLabelChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  selectedLabelText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  labelsList: {
    flex: 1,
  },
  labelOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  labelInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  labelColorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  labelName: {
    fontSize: 16,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#E5E5E5',
  },
  confirmButton: {
    backgroundColor: '#42A5F5',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 