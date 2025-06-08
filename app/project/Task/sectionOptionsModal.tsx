import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SectionOptionsModal() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { 
    projectId, 
    sectionId, 
    sectionName 
  } = useLocalSearchParams<{ 
    projectId: string; 
    sectionId: string;
    sectionName: string;
  }>();

  const handleRename = () => {
    router.back();
    // Small delay to ensure modal closes before opening new one
    setTimeout(() => {
      router.push({
        pathname: '/project/Task/editSectionModal',
        params: {
          projectId,
          sectionId,
          sectionName
        }
      });
    }, 100);
  };

  const handleDelete = () => {
    router.back();
    // Small delay to ensure modal closes before opening new one
    setTimeout(() => {
      router.push({
        pathname: '/project/Task/deleteSectionModal',
        params: {
          projectId,
          sectionId,
          sectionName
        }
      });
    }, 100);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.backdrop} 
        activeOpacity={1} 
        onPress={() => router.back()}
      />
      
      <View style={[styles.modalContent, { backgroundColor: theme.background, paddingBottom: insets.bottom }]}>
        <View style={[styles.handle, { backgroundColor: theme.gray }]} />
        
        <Text style={[styles.title, { color: theme.text }]}>Opciones de Sección</Text>
        <Text style={[styles.subtitle, { color: theme.text }]}>"{sectionName}"</Text>
        
        {/* Rename Option */}
        <TouchableOpacity
          style={[styles.optionItem, { backgroundColor: theme.card }]}
          onPress={handleRename}
        >
          <View style={[styles.iconContainer, { backgroundColor: '#E3F2FD' }]}>
            <Ionicons name="pencil-outline" size={24} color="#42A5F5" />
          </View>
          <View style={styles.optionContent}>
            <Text style={[styles.optionTitle, { color: theme.text }]}>Renombrar</Text>
            <Text style={[styles.optionDescription, { color: theme.gray }]}>
              Cambiar el nombre de esta sección
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.gray} />
        </TouchableOpacity>

        {/* Delete Option */}
        <TouchableOpacity
          style={[styles.optionItem, { backgroundColor: theme.card }]}
          onPress={handleDelete}
        >
          <View style={[styles.iconContainer, { backgroundColor: '#FFEBEE' }]}>
            <Ionicons name="trash-outline" size={24} color="#EF4444" />
          </View>
          <View style={styles.optionContent}>
            <Text style={[styles.optionTitle, { color: theme.text }]}>Eliminar</Text>
            <Text style={[styles.optionDescription, { color: theme.gray }]}>
              Eliminar esta sección permanentemente
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.gray} />
        </TouchableOpacity>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    height: height * 0.35,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginVertical: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
    opacity: 0.7,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
}); 