import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { SectionService } from '@/services/sectionService';
import { Alert } from 'react-native';

export default function EditSectionModal() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const router = useRouter();
  const { projectId, sectionId, sectionName: initialName } = useLocalSearchParams<{ 
    projectId: string; 
    sectionId: string;
    sectionName: string;
  }>();
  
  const [sectionName, setSectionName] = useState(initialName || '');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdate = async () => {
    if (!sectionName.trim()) {
      Alert.alert('Error', 'Section name cannot be empty');
      return;
    }

    try {
      setIsUpdating(true);
      await SectionService.updateSection(
        projectId,
        parseInt(sectionId),
        { name: sectionName.trim() }
      );

      router.back();
    } catch (err: any) {
      console.error('Failed to update section:', err);
      Alert.alert('Error', err.message || 'Failed to update section');
    } finally {
      setIsUpdating(false);
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
        <Text style={[styles.title, { color: theme.text }]}>Rename Section</Text>
        
        <TextInput
          style={[styles.input, { 
            backgroundColor: theme.inputBackground, 
            color: theme.text,
            borderColor: theme.gray 
          }]}
          placeholder="Section name"
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
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, styles.updateButton, { backgroundColor: theme.primary }]}
            onPress={handleUpdate}
            disabled={isUpdating || !sectionName.trim()}
          >
            {isUpdating ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.updateButtonText}>Update</Text>
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
  updateButton: {
    backgroundColor: '#42A5F5',
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: '600',
  },
  updateButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
}); 