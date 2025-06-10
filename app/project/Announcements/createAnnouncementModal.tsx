import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCustomAlert } from '@/hooks/useCustomAlert';
import { CustomAlert } from '@/components/CustomAlert';
import { 
  AnnouncementService, 
  CreateAnnouncementRequest,
  getAnnouncementTypeIcon,
  getAnnouncementTypeColor,
  translateAnnouncementType
} from '@/services/announcementService';

const ANNOUNCEMENT_TYPES = [
  { value: 'info', label: 'Información', description: 'Anuncio general informativo' },
  { value: 'warning', label: 'Advertencia', description: 'Información importante que requiere atención' },
  { value: 'success', label: 'Éxito', description: 'Buenas noticias o logros alcanzados' },
  { value: 'urgent', label: 'Urgente', description: 'Mensaje crítico que requiere acción inmediata' },
] as const;

type AnnouncementType = typeof ANNOUNCEMENT_TYPES[number]['value'];

export default function CreateAnnouncementModal() {
  const router = useRouter();
  const { projectId, projectName } = useLocalSearchParams<{ 
    projectId: string; 
    projectName: string; 
  }>();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const { showAlert, alertConfig, hideAlert } = useCustomAlert();
  
  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<AnnouncementType>('info');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Focus states
  const [titleFocused, setTitleFocused] = useState(false);
  const [contentFocused, setContentFocused] = useState(false);

  // Validation
  const titleValid = title.trim().length >= 3 && title.trim().length <= 200;
  const contentValid = content.trim().length >= 10 && content.trim().length <= 2000;
  const formValid = titleValid && contentValid;

  const getTitleError = () => {
    if (title.length === 0) return null;
    if (title.trim().length < 3) return 'El título debe tener al menos 3 caracteres';
    if (title.trim().length > 200) return 'El título no puede tener más de 200 caracteres';
    return null;
  };

  const getContentError = () => {
    if (content.length === 0) return null;
    if (content.trim().length < 10) return 'El contenido debe tener al menos 10 caracteres';
    if (content.trim().length > 2000) return 'El contenido no puede tener más de 2000 caracteres';
    return null;
  };

  const handleSubmit = async () => {
    if (!formValid || !projectId) return;

    setIsSubmitting(true);

    try {
      const announcementData: CreateAnnouncementRequest = {
        title: title.trim(),
        content: content.trim(),
        type
      };

      const response = await AnnouncementService.createProjectAnnouncement(projectId, announcementData);
      
      // Show success message
      showAlert({
        title: 'Anuncio Creado',
        message: `El anuncio "${response.announcement.title}" ha sido creado exitosamente.`,
        type: 'success',
        buttons: [{
          text: 'Continuar',
          style: 'default',
          onPress: () => {
            hideAlert();
            router.back();
          }
        }]
      });

    } catch (error: any) {
      console.error('Error creating announcement:', error);
      showAlert({
        title: 'Error al Crear Anuncio',
        message: error.message || 'No se pudo crear el anuncio. Inténtalo de nuevo.',
        type: 'error',
        buttons: [{ text: 'Entendido', style: 'default' }]
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderTypeSelector = () => {
    return (
      <View style={styles.typeSelectorContainer}>
        <Text style={[styles.fieldLabel, { color: theme.text }]}>Tipo de Anuncio</Text>
        <View style={styles.typeOptions}>
          {ANNOUNCEMENT_TYPES.map((typeOption) => {
            const isSelected = type === typeOption.value;
            const typeColor = getAnnouncementTypeColor(typeOption.value);
            const typeIcon = getAnnouncementTypeIcon(typeOption.value);
            
            return (
              <TouchableOpacity
                key={typeOption.value}
                style={[
                  styles.typeOption,
                  {
                    backgroundColor: isSelected ? typeColor + '15' : theme.card,
                    borderColor: isSelected ? typeColor : theme.separator,
                    borderWidth: isSelected ? 2 : 1,
                  }
                ]}
                onPress={() => setType(typeOption.value)}
                activeOpacity={0.7}
              >
                <View style={styles.typeOptionHeader}>
                  <Ionicons 
                    name={typeIcon} 
                    size={20} 
                    color={isSelected ? typeColor : theme.gray} 
                  />
                  <Text style={[
                    styles.typeOptionLabel, 
                    { 
                      color: isSelected ? typeColor : theme.text,
                      fontWeight: isSelected ? '600' : '500'
                    }
                  ]}>
                    {typeOption.label}
                  </Text>
                </View>
                <Text style={[
                  styles.typeOptionDescription, 
                  { color: isSelected ? typeColor + 'CC' : theme.gray }
                ]}>
                  {typeOption.description}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.separator, paddingTop: insets.top }]}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={[styles.backButton, { backgroundColor: theme.primary }]}
          disabled={isSubmitting}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Crear Anuncio</Text>
        <TouchableOpacity 
          style={[
            styles.submitButton, 
            { 
              backgroundColor: formValid && !isSubmitting ? theme.orange : theme.gray,
              opacity: formValid && !isSubmitting ? 1 : 0.5
            }
          ]}
          onPress={handleSubmit}
          disabled={!formValid || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Crear</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          {/* Project Info */}
          <View style={styles.projectInfo}>
            <Ionicons name="megaphone" size={24} color={theme.orange} />
            <Text style={[styles.projectName, { color: theme.text }]}>{projectName}</Text>
          </View>

          {/* Title Field */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: theme.text }]}>
              Título del Anuncio *
            </Text>
            <View style={[
              styles.inputContainer,
              {
                borderColor: titleFocused ? theme.orange : 
                           getTitleError() ? theme.red : theme.separator,
                backgroundColor: theme.card
              }
            ]}>
              <TextInput
                style={[styles.textInput, { color: theme.text }]}
                placeholder="Escribe el título del anuncio..."
                placeholderTextColor={theme.gray}
                value={title}
                onChangeText={setTitle}
                onFocus={() => setTitleFocused(true)}
                onBlur={() => setTitleFocused(false)}
                maxLength={200}
                editable={!isSubmitting}
              />
            </View>
            <View style={styles.fieldFooter}>
              <Text style={[styles.errorText, { color: theme.red }]}>
                {getTitleError() || ' '}
              </Text>
              <Text style={[styles.characterCount, { color: theme.gray }]}>
                {title.length}/200
              </Text>
            </View>
          </View>

          {/* Content Field */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: theme.text }]}>
              Contenido del Anuncio *
            </Text>
            <View style={[
              styles.inputContainer,
              styles.textAreaContainer,
              {
                borderColor: contentFocused ? theme.orange : 
                           getContentError() ? theme.red : theme.separator,
                backgroundColor: theme.card
              }
            ]}>
              <TextInput
                style={[styles.textInput, styles.textArea, { color: theme.text }]}
                placeholder="Escribe el contenido del anuncio..."
                placeholderTextColor={theme.gray}
                value={content}
                onChangeText={setContent}
                onFocus={() => setContentFocused(true)}
                onBlur={() => setContentFocused(false)}
                maxLength={2000}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                editable={!isSubmitting}
              />
            </View>
            <View style={styles.fieldFooter}>
              <Text style={[styles.errorText, { color: theme.red }]}>
                {getContentError() || ' '}
              </Text>
              <Text style={[styles.characterCount, { color: theme.gray }]}>
                {content.length}/2000
              </Text>
            </View>
          </View>

          {/* Type Selector */}
          {renderTypeSelector()}



          {/* Form Guidelines */}
          <View style={[styles.guidelines, { backgroundColor: theme.card }]}>
            <Text style={[styles.guidelinesTitle, { color: theme.text }]}>
              Pautas para Anuncios
            </Text>
            <Text style={[styles.guidelinesText, { color: theme.gray }]}>
              • Utiliza títulos claros y descriptivos{'\n'}
              • Selecciona el tipo apropiado según la importancia{'\n'}
              • Reserva "Urgente" solo para mensajes críticos{'\n'}
              • Los anuncios aparecen ordenados por fecha de creación
            </Text>
          </View>
        </View>
      </ScrollView>

      <CustomAlert {...alertConfig} onDismiss={hideAlert} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  submitButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  formContainer: {
    padding: 16,
  },
  projectInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
    paddingVertical: 12,
  },
  projectName: {
    fontSize: 18,
    fontWeight: '600',
  },
  fieldContainer: {
    marginBottom: 24,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputContainer: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  textAreaContainer: {
    minHeight: 120,
  },
  textInput: {
    fontSize: 16,
    flex: 1,
  },
  textArea: {
    minHeight: 96,
  },
  fieldFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  errorText: {
    fontSize: 12,
    flex: 1,
  },
  characterCount: {
    fontSize: 12,
    fontWeight: '500',
  },
  typeSelectorContainer: {
    marginBottom: 24,
  },
  typeOptions: {
    gap: 12,
  },
  typeOption: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  typeOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  typeOptionLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  typeOptionDescription: {
    fontSize: 14,
    lineHeight: 18,
  },

  guidelines: {
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  guidelinesTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  guidelinesText: {
    fontSize: 14,
    lineHeight: 20,
  },
}); 