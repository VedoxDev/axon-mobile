import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Alert, TextInput } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';

import { TaskService } from '@/services/taskService';

type Label = {
  id: number;
  name: string;
  color: string;
};

const PRESET_COLORS = [
  '#EF4444', // Red
  '#F59E0B', // Amber
  '#10B981', // Green
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#6B7280', // Gray
  '#F97316', // Orange
];

export default function ManageLabelsModal() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const router = useRouter();
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  
  const [labels, setLabels] = useState<Label[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingLabel, setEditingLabel] = useState<Label | null>(null);
  const [newLabelName, setNewLabelName] = useState('');
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);

  useEffect(() => {
    fetchLabels();
  }, [projectId]);

  const fetchLabels = async () => {
    try {
      setIsLoading(true);
      const projectLabels = await TaskService.getProjectLabels(projectId);
      setLabels(projectLabels);
    } catch (error) {
      console.error('Failed to fetch labels:', error);
      Alert.alert('Error', 'Error al cargar las etiquetas');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateLabel = async () => {
    if (!newLabelName.trim()) {
      Alert.alert('Error', 'El nombre de la etiqueta no puede estar vacío');
      return;
    }

    try {
      setIsCreating(true);
      const newLabel = await TaskService.createProjectLabel(projectId, {
        name: newLabelName.trim(),
        color: selectedColor
      });
      
      setLabels(prev => [...prev, newLabel]);
      setNewLabelName('');
      setSelectedColor(PRESET_COLORS[0]);
    } catch (error) {
      console.error('Failed to create label:', error);
      Alert.alert('Error', 'Error al crear la etiqueta');
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateLabel = async () => {
    if (!editingLabel || !newLabelName.trim()) return;

    try {
      const updatedLabel = await TaskService.updateProjectLabel(projectId, editingLabel.id, {
        name: newLabelName.trim(),
        color: selectedColor
      });
      
      setLabels(prev => prev.map(label => 
        label.id === editingLabel.id ? updatedLabel : label
      ));
      
      setEditingLabel(null);
      setNewLabelName('');
      setSelectedColor(PRESET_COLORS[0]);
    } catch (error) {
      console.error('Failed to update label:', error);
      Alert.alert('Error', 'Error al actualizar la etiqueta');
    }
  };

  const handleDeleteLabel = (label: Label) => {
    Alert.alert(
      'Eliminar Etiqueta',
      `¿Estás seguro de que quieres eliminar "${label.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await TaskService.deleteProjectLabel(projectId, label.id);
              setLabels(prev => prev.filter(l => l.id !== label.id));
            } catch (error) {
              console.error('Failed to delete label:', error);
              Alert.alert('Error', 'Error al eliminar la etiqueta');
            }
          }
        }
      ]
    );
  };

  const startEditingLabel = (label: Label) => {
    setEditingLabel(label);
    setNewLabelName(label.name);
    setSelectedColor(label.color);
  };

  const cancelEditing = () => {
    setEditingLabel(null);
    setNewLabelName('');
    setSelectedColor(PRESET_COLORS[0]);
  };

  const renderColorSelector = () => (
    <View style={styles.colorSelector}>
      {PRESET_COLORS.map((color) => (
        <TouchableOpacity
          key={color}
          style={[
            styles.colorOption,
            { backgroundColor: color },
            selectedColor === color && styles.selectedColor
          ]}
          onPress={() => setSelectedColor(color)}
        />
      ))}
    </View>
  );

  const renderLabel = ({ item }: { item: Label }) => (
    <View style={[styles.labelItem, { backgroundColor: theme.card }]}>
      <View style={styles.labelInfo}>
        <View style={[styles.labelColor, { backgroundColor: item.color }]} />
        <Text style={[styles.labelName, { color: theme.text }]}>{item.name}</Text>
      </View>
      <View style={styles.labelActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => startEditingLabel(item)}
        >
          <Ionicons name="pencil" size={16} color={theme.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleDeleteLabel(item)}
        >
          <Ionicons name="trash" size={16} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

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
          <Text style={[styles.title, { color: theme.text }]}>Gestionar Etiquetas</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={24} color={theme.text} />
          </TouchableOpacity>
        </View>
        


        {/* Create/Edit Label Form */}
        <View style={[styles.formSection, { backgroundColor: theme.card }]}>
          <Text style={[styles.formTitle, { color: theme.text }]}>
            {editingLabel ? 'Editar Etiqueta' : 'Crear Nueva Etiqueta'}
          </Text>
          
          <TextInput
            style={[styles.input, { 
              backgroundColor: colorScheme === 'dark' ? '#3A3A3A' : '#FFFFFF', 
              color: theme.text,
              borderColor: '#E0E0E0',
              borderWidth: 1
            }]}
            placeholder="Nombre de la etiqueta"
            placeholderTextColor={theme.gray}
            value={newLabelName}
            onChangeText={setNewLabelName}
            maxLength={30}
          />
          
          <Text style={[styles.colorTitle, { color: theme.text }]}>Color</Text>
          {renderColorSelector()}
          
          <View style={styles.formButtons}>
            {editingLabel && (
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={cancelEditing}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={[styles.button, styles.primaryButton, { backgroundColor: theme.primary }]}
              onPress={editingLabel ? handleUpdateLabel : handleCreateLabel}
              disabled={isCreating || !newLabelName.trim()}
            >
              {isCreating ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>
                  {editingLabel ? 'Actualizar' : 'Crear'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Labels List */}
        <View style={styles.labelsSection}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Etiquetas del Proyecto</Text>
          
          {isLoading ? (
            <ActivityIndicator size="large" color={theme.primary} style={styles.loader} />
          ) : (
            <FlatList
              data={labels}
              renderItem={renderLabel}
              keyExtractor={(item) => item.id.toString()}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.labelsList}
            />
          )}
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
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
    height: '80%',
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
  formSection: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  input: {
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    minHeight: 50,
  },
  colorTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  colorSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  colorOption: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedColor: {
    borderColor: '#000',
    borderWidth: 3,
  },
  formButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#ccc',
  },
  primaryButton: {
    backgroundColor: '#42A5F5',
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: '600',
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  labelsSection: {
    flex: 1,
    minHeight: 200,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  loader: {
    marginTop: 20,
  },
  labelsList: {
    gap: 8,
  },
  labelItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
  labelInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  labelColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  labelName: {
    fontSize: 16,
    flex: 1,
  },
  labelActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
}); 