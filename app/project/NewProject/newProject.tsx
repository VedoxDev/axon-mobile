import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { useCustomAlert } from '@/hooks/useCustomAlert';
import { CustomAlert } from '@/components/CustomAlert';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function NewProjectScreen() {
  const router = useRouter();
  const { projectName: initialProjectName, projectDescription: initialDescription } = useLocalSearchParams<{ 
    projectName?: string; 
    projectDescription?: string; 
  }>();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const { showAlert, alertConfig, hideAlert } = useCustomAlert();
  const insets = useSafeAreaInsets();
  
  const [projectName, setProjectName] = useState(initialProjectName || '');
  const [description, setDescription] = useState(initialDescription || '');
  const [nameFocused, setNameFocused] = useState(false);
  const [descriptionFocused, setDescriptionFocused] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  
  const isProjectNameValid = projectName.trim().length >= 3;

  // Keyboard event listeners for Android
  useEffect(() => {
    if (Platform.OS === 'android') {
      const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
        setKeyboardVisible(true);
      });
      const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
        setKeyboardVisible(false);
      });

      return () => {
        keyboardDidShowListener?.remove();
        keyboardDidHideListener?.remove();
      };
    }
  }, []);

  const handleContinue = () => {
    // Validate required fields
    if (!isProjectNameValid) {
      // No popup, just block
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
  const isFormValid = isProjectNameValid;

  return (
    <View style={[styles.fullContainer, { backgroundColor: theme.background }]}>
      <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : Platform.OS === 'android' ? 'height' : undefined}
          style={[styles.keyboardAvoidingContainer, { backgroundColor: theme.background }]}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          <View style={[styles.container, { 
            backgroundColor: theme.background,
            paddingTop: insets.top + 20,
            paddingBottom: Platform.OS === 'android' && keyboardVisible ? 0 : Math.max(insets.bottom, 20)
          }]}>
            <View style={styles.header}>
              <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: theme.primary }]}>
                <Ionicons name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>
              <Text style={[styles.headerTitle, { color: theme.text }]}>Nuevo Proyecto</Text>
            </View>

            <ScrollView 
              style={styles.formContainer} 
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
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
                    style={[
                      styles.input,
                      {
                        backgroundColor: colorScheme === 'dark' ? theme.inputBackground : theme.card,
                        color: theme.text,
                        borderColor: nameFocused
                          ? (!isProjectNameValid ? theme.orange : theme.green)
                          : theme.separator
                      }
                    ]}
                    value={projectName}
                    onChangeText={setProjectName}
                    placeholder="Ej: App móvil, Sitio web, Marketing..."
                    onFocus={() => setNameFocused(true)}
                    onBlur={() => setNameFocused(false)}
                    placeholderTextColor={theme.icon}
                  />
                  {!isProjectNameValid && projectName.length > 0 && (
                    <View style={styles.validationContainer}>
                      <Ionicons name="alert-circle" size={16} color={theme.orange} />
                      <Text style={[styles.validationText, { color: theme.orange }]}>
                        El nombre debe tener al menos 3 caracteres
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: theme.text }]}>Descripción (Opcional)</Text>
                  <TextInput
                    style={[
                      styles.inputDescription,
                      {
                        backgroundColor: colorScheme === 'dark' ? theme.inputBackground : theme.card,
                        color: theme.text,
                        borderColor: descriptionFocused ? theme.orange : theme.separator
                      }
                    ]}
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Describe brevemente el objetivo y alcance del proyecto..."
                    onFocus={() => setDescriptionFocused(true)}
                    onBlur={() => setDescriptionFocused(false)}
                    placeholderTextColor={theme.icon}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
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
            
            {/* Custom Alert */}
            <CustomAlert
              visible={alertConfig.visible}
              title={alertConfig.title}
              message={alertConfig.message}
              type={alertConfig.type}
              buttons={alertConfig.buttons}
              onDismiss={hideAlert}
            />
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </View>
  );
}

const styles = StyleSheet.create({
  fullContainer: {
    flex: 1,
  },
  keyboardAvoidingContainer: {
    flex: 1,
  },
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
  validationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  validationText: {
    fontSize: 13,
  },
});
