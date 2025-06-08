import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SectionService } from '@/services/sectionService';

export default function DeleteSectionModal() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const router = useRouter();
  const { 
    projectId, 
    sectionId, 
    sectionName 
  } = useLocalSearchParams<{ 
    projectId: string; 
    sectionId: string;
    sectionName: string;
  }>();

  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      console.log('Deleting section:', sectionName, 'with ID:', sectionId);
      
      await SectionService.deleteSection(projectId, parseInt(sectionId));
      
      console.log('Section deleted successfully');
      // Go back to task screen - the useFocusEffect will refresh the sections
      router.back();
    } catch (err: any) {
      console.error('Failed to delete section:', err);
      // For now, just go back. In the future, could show error toast/modal
      router.back();
    } finally {
      setIsDeleting(false);
    }
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
        
        {/* Warning Icon */}
        <View style={styles.iconContainer}>
          <Ionicons name="warning" size={48} color="#EF4444" />
        </View>
        
        <Text style={[styles.title, { color: theme.text }]}>Eliminar Sección</Text>
        
        <Text style={[styles.message, { color: theme.text }]}>
          ¿Estás seguro de que quieres eliminar "{sectionName}"?
        </Text>
        
        <Text style={[styles.warning, { color: '#EF4444' }]}>
          Esta acción no se puede deshacer.
        </Text>
        
        <View style={styles.buttons}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={() => router.back()}
            disabled={isDeleting}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, styles.deleteButton]}
            onPress={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="trash" size={16} color="#fff" />
                <Text style={styles.deleteButtonText}>Eliminar</Text>
              </>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    width: '85%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: 16,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    marginBottom: 8,
    textAlign: 'center',
    lineHeight: 22,
  },
  warning: {
    fontSize: 14,
    marginBottom: 24,
    textAlign: 'center',
    fontWeight: '500',
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#E5E7EB',
  },
  cancelButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#EF4444',
    flexDirection: 'row',
    gap: 8,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 