import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

export default function NewProjectScreen() {
  const router = useRouter();
  const { projectName: initialProjectName, projectDescription: initialDescription } = useLocalSearchParams<{ 
    projectName?: string; 
    projectDescription?: string; 
  }>();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const [projectName, setProjectName] = useState(initialProjectName || '');
  const [description, setDescription] = useState(initialDescription || '');
  const [nameFocused, setNameFocused] = useState(false);
  const [descriptionFocused, setDescriptionFocused] = useState(false);

  const handleContinue = () => {
    // Validate required fields
    if (!projectName.trim()) {
      alert('El nombre del proyecto es obligatorio');
      return;
    }

    // Navigate to the team members screen with the project data (no API call yet)
    router.push({
      pathname: './addMembers',
      params: { 
        projectName: projectName.trim(),
        projectDescription: description.trim() || ''
      }
    });
  };

  // Check if form is valid
  const isFormValid = projectName.trim().length > 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: theme.primary }]}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Nuevo Proyecto</Text>
      </View>

      <ScrollView style={styles.formContainer} keyboardShouldPersistTaps="handled">
        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressStep}>
            <View style={[styles.progressDot, styles.activeProgressDot, { backgroundColor: theme.progressBarFill }]}>
              <Text style={[styles.progressNumber, { color: '#fff' }]}>1</Text>
            </View>
            <Text style={[styles.progressLabel, { color: theme.progressBarText }]}>Detalles</Text>
          </View>
          <View style={[styles.progressLine, { backgroundColor: theme.progressBarBackground }]} />
          <View style={styles.progressStep}>
            <View style={[styles.progressDot, { backgroundColor: theme.progressBarBackground }]}>
              <Text style={[styles.progressNumber, { color: theme.progressBarText }]}>2</Text>
            </View>
            <Text style={[styles.progressLabel, { color: theme.icon }]}>Equipo</Text>
          </View>
        </View>

        <View style={styles.contentContainer}>
          <View style={styles.iconContainer}>
            <Ionicons name="document-text" size={60} color={theme.primary} />
          </View>
          
          <Text style={[styles.title, { color: theme.text }]}>Crea tu proyecto</Text>
          <Text style={[styles.subtitle, { color: theme.icon }]}>
            Comienza definiendo los detalles básicos de tu proyecto
          </Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Nombre del Proyecto *</Text>
            <TextInput
              style={[styles.input, 
                { 
                  backgroundColor: theme.inputBackground, 
                  color: theme.text, 
                  borderColor: nameFocused ? theme.orange : theme.separator
                }]}
              value={projectName}
              onChangeText={setProjectName}
              placeholder="Ej: App móvil, Sitio web, Marketing..."
              onFocus={() => setNameFocused(true)}
              onBlur={() => setNameFocused(false)}
              placeholderTextColor={theme.icon}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Descripción (Opcional)</Text>
            <TextInput
              style={[styles.inputDescription, 
                { 
                  backgroundColor: theme.inputBackground, 
                  color: theme.text, 
                  borderColor: descriptionFocused ? theme.orange : theme.separator
                }]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe brevemente el objetivo y alcance del proyecto..."
              onFocus={() => setDescriptionFocused(true)}
              onBlur={() => setDescriptionFocused(false)}
              placeholderTextColor={theme.icon}
              multiline
              numberOfLines={4}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.createButton, 
            { 
              backgroundColor: theme.primary,
              opacity: isFormValid ? 1 : 0.6
            }
          ]}
          onPress={handleContinue}
          disabled={!isFormValid}
        >
          <View style={styles.buttonContent}>
            <Text style={styles.createButtonText}>Continuar</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 45,
    paddingHorizontal: 16,
  },
  backButton: {
    marginRight: 16,
    borderRadius: 20,
    padding: 6,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  formContainer: {
    padding: 16,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  progressStep: {
    alignItems: 'center',
  },
  progressDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  activeProgressDot: {
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  progressNumber: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  progressLine: {
    width: 40,
    height: 2,
    marginHorizontal: 16,
  },
  contentContainer: {
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  inputGroup: {
    width: '100%',
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  inputDescription: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    height: 120,
    textAlign: 'left',
    textAlignVertical: 'top'
  },
  createButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 32,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
