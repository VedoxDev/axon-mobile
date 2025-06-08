import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { SectionService } from '@/services/sectionService';
import { Alert } from 'react-native';

export default function CreateSectionModal() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const router = useRouter();
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  
  const [sectionName, setSectionName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!sectionName.trim()) {
      Alert.alert('Error', 'Section name cannot be empty');
      return;
    }

    try {
      setIsCreating(true);
      await SectionService.createSection(projectId, {
        name: sectionName.trim()
      });

      router.back();
    } catch (err: any) {
      console.error('Failed to create section:', err);
      Alert.alert('Error', err.message || 'Failed to create section');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.backdrop} 
        activeOpacity={1} 
        onPress={() => router.back()}
      />
      
      <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
        <Text style={[styles.title, { color: theme.text }]}>Crear nueva sección</Text>
        
        <TextInput
          style={[styles.input, { 
            backgroundColor: theme.inputBackground, 
            color: theme.text,
            borderColor: theme.gray 
          }]}
          placeholder="Nombre de la sección"
          placeholderTextColor={theme.gray}
          value={sectionName}
          onChangeText={setSectionName}
          autoFocus
          maxLength={50}
        />
        
        <View style={styles.buttons}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={() => router.back()}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, styles.createButton, { backgroundColor: theme.primary }]}
            onPress={handleCreate}
            disabled={isCreating || !sectionName.trim()}
          >
            {isCreating ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.createButtonText}>Crear</Text>
            )}
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
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    maxWidth: 400,
    borderRadius: 12,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  buttons: {
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
}); 