import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { meetingService, CreateMeetingData, CreatePersonalMeetingData } from '@/services/meetingService';
import { UserSearchService, SearchUser } from '@/services/userSearchService';
import DateTimePicker from '@react-native-community/datetimepicker';
import { CustomAlert } from '@/components/CustomAlert';

interface Project {
  id: string;
  nombre: string;
  descripcion: string;
}

interface CreateMeetingModalProps {
  visible: boolean;
  onClose: () => void;
  onMeetingCreated: () => void;
  selectedDate: Date;
  projects: Project[];
  defaultProjectId?: string;
}

export default function CreateMeetingModal({
  visible,
  onClose,
  onMeetingCreated,
  selectedDate,
  projects,
  defaultProjectId,
}: CreateMeetingModalProps) {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showProjectPicker, setShowProjectPicker] = useState(false);
  const [meetingDate, setMeetingDate] = useState(selectedDate);
  const [meetingTime, setMeetingTime] = useState(new Date());
  const [duration, setDuration] = useState('60');
  const [isVideoCall, setIsVideoCall] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  // User search state for personal meetings
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [showUserSearch, setShowUserSearch] = useState(false);

  // Focus states
  const [titleFocused, setTitleFocused] = useState(false);
  const [descriptionFocused, setDescriptionFocused] = useState(false);
  const [durationFocused, setDurationFocused] = useState(false);
  const [userSearchFocused, setUserSearchFocused] = useState(false);

  // Alert state
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title?: string;
    message: string;
    type?: 'error' | 'success' | 'warning' | 'info';
    buttons?: Array<{ text: string; onPress?: () => void; style?: 'default' | 'cancel' | 'destructive' }>;
  }>({
    visible: false,
    message: '',
  });

  useEffect(() => {
    if (visible) {
      setMeetingDate(selectedDate);
      // Set default time to next hour
      const now = new Date();
      const nextHour = new Date(now);
      nextHour.setHours(now.getHours() + 1, 0, 0, 0);
      setMeetingTime(nextHour);
      
      // Auto-select the current project if provided
      if (defaultProjectId && projects.length > 0) {
        const defaultProject = projects.find(p => p.id === defaultProjectId);
        if (defaultProject) {
          setSelectedProject(defaultProject);
        }
      }
    }
  }, [visible, selectedDate, defaultProjectId, projects]);

  // Check if this is for personal meeting creation
  const isPersonalMeeting = defaultProjectId === undefined;

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setSelectedProject(null);
    setMeetingDate(selectedDate);
    setMeetingTime(new Date());
    setDuration('60');
    setIsVideoCall(true);
    setLoading(false);
    
    // Reset user search state
    setUserSearchQuery('');
    setSearchResults([]);
    setSelectedUsers([]);
    setSearching(false);
    setShowUserSearch(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Helper function to get user display name
  const getUserDisplayName = (user: SearchUser) => {
    if (user.fullName && user.fullName.trim()) {
      return user.fullName;
    }
    // Construct name from nombre and apellidos if fullName is not available
    const nombre = user.nombre || '';
    const apellidos = user.apellidos || '';
    return `${nombre} ${apellidos}`.trim() || user.email;
  };

  // User search functionality
  const handleUserSearch = async (query: string) => {
    setUserSearchQuery(query);
    
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const response = await UserSearchService.searchUsers(query, 10);
      console.log('🔍 User search results:', response.users.length, 'users found');
      console.log('📝 First user sample:', response.users[0]);
      setSearchResults(response.users);
    } catch (error) {
      console.error('User search error:', error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const addUser = (user: SearchUser) => {
    // Check if user is already selected
    if (!selectedUsers.find(u => u.id === user.id)) {
      console.log('➕ Adding user:', user);
      console.log('📝 Display name will be:', getUserDisplayName(user));
      setSelectedUsers([...selectedUsers, user]);
    }
    setUserSearchQuery('');
    setSearchResults([]);
    setShowUserSearch(false);
  };

  const removeUser = (userId: string) => {
    setSelectedUsers(selectedUsers.filter(u => u.id !== userId));
  };

  const handleCreateMeeting = async () => {
    if (!title.trim()) {
      setAlertConfig({
        visible: true,
        title: 'Error',
        message: 'Por favor ingresa un título para la reunión',
        type: 'error',
        buttons: [{ text: 'OK' }]
      });
      return;
    }

    // Validation for project meetings
    if (!isPersonalMeeting && !selectedProject) {
      setAlertConfig({
        visible: true,
        title: 'Error',
        message: 'Por favor selecciona un proyecto',
        type: 'error',
        buttons: [{ text: 'OK' }]
      });
      return;
    }

    // Validation for personal meetings
    if (isPersonalMeeting && selectedUsers.length === 0) {
      setAlertConfig({
        visible: true,
        title: 'Error',
        message: 'Por favor selecciona al menos un participante',
        type: 'error',
        buttons: [{ text: 'OK' }]
      });
      return;
    }

    if (!duration.trim() || isNaN(Number(duration)) || Number(duration) <= 0) {
      setAlertConfig({
        visible: true,
        title: 'Error',
        message: 'Por favor ingresa una duración válida en minutos',
        type: 'error',
        buttons: [{ text: 'OK' }]
      });
      return;
    }

    setLoading(true);

    try {
      // Combine date and time
      const scheduledDateTime = new Date(meetingDate);
      scheduledDateTime.setHours(
        meetingTime.getHours(),
        meetingTime.getMinutes(),
        0,
        0
      );

      if (isPersonalMeeting) {
        // Create personal meeting
        const personalMeetingData: CreatePersonalMeetingData = {
          title: title.trim(),
          description: description.trim(),
          participantEmails: selectedUsers.map(user => user.email),
          scheduledFor: scheduledDateTime.toISOString(),
          duration: Number(duration),
          isVideoCall,
        };

        await meetingService.createPersonalMeeting(personalMeetingData);
      } else {
        // Create project meeting
        const projectMeetingData: CreateMeetingData = {
          title: title.trim(),
          description: description.trim(),
          projectId: selectedProject!.id,
          scheduledFor: scheduledDateTime.toISOString(),
          duration: Number(duration),
          isVideoCall,
        };

        await meetingService.createMeeting(projectMeetingData);
      }
      
      setAlertConfig({
        visible: true,
        title: 'Éxito',
        message: 'Reunión creada correctamente',
        type: 'success',
        buttons: [{
          text: 'OK',
          onPress: () => {
            handleClose();
            onMeetingCreated();
          }
        }]
      });
    } catch (error: any) {
      console.error('Error creating meeting:', error);
      setAlertConfig({
        visible: true,
        title: 'Error',
        message: error.message || 'No se pudo crear la reunión',
        type: 'error',
        buttons: [{ text: 'OK' }]
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.text }]}>
            Nueva Reunión
          </Text>
          <TouchableOpacity
            onPress={handleCreateMeeting}
            style={[styles.createButton, { backgroundColor: theme.orange }]}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.createButtonText}>Crear</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
          {/* Title */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Título *</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.inputBackground,
                  color: theme.text,
                  borderColor: titleFocused ? theme.orange : theme.gray,
                },
              ]}
              placeholder="Título de la reunión"
              placeholderTextColor={theme.gray}
              value={title}
              onChangeText={setTitle}
              onFocus={() => setTitleFocused(true)}
              onBlur={() => setTitleFocused(false)}
            />
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Descripción</Text>
            <TextInput
              style={[
                styles.textArea,
                {
                  backgroundColor: theme.inputBackground,
                  color: theme.text,
                  borderColor: descriptionFocused ? theme.orange : theme.gray,
                },
              ]}
              placeholder="Descripción de la reunión"
              placeholderTextColor={theme.gray}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              onFocus={() => setDescriptionFocused(true)}
              onBlur={() => setDescriptionFocused(false)}
            />
          </View>

          {/* Project Selection or User Search */}
          {!isPersonalMeeting ? (
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>
                Proyecto * {defaultProjectId && selectedProject && selectedProject.id === defaultProjectId && (
                  <Text style={{ color: theme.orange, fontSize: 12 }}>(Proyecto actual)</Text>
                )}
              </Text>
              <TouchableOpacity
                style={[
                  styles.pickerButton,
                  {
                    backgroundColor: theme.inputBackground,
                    borderColor: selectedProject && selectedProject.id === defaultProjectId ? theme.orange : theme.gray,
                  },
                ]}
                onPress={() => setShowProjectPicker(!showProjectPicker)}
              >
                <Text style={[styles.pickerText, { color: selectedProject ? theme.text : theme.gray }]}>
                  {selectedProject ? selectedProject.nombre : 'Seleccionar proyecto'}
                </Text>
                <Ionicons name="chevron-down" size={20} color={theme.text} />
              </TouchableOpacity>
              
              {showProjectPicker && (
                <View style={[styles.pickerOptions, { backgroundColor: theme.inputBackground, borderColor: theme.gray }]}>
                  {projects.map((project) => (
                    <TouchableOpacity
                      key={project.id}
                      style={styles.pickerOption}
                      onPress={() => {
                        setSelectedProject(project);
                        setShowProjectPicker(false);
                      }}
                    >
                      <Text style={[styles.pickerOptionText, { color: theme.text }]}>
                        {project.nombre}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          ) : (
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Participantes *</Text>
              
              {/* Selected Users */}
              {selectedUsers.length > 0 && (
                <View style={styles.selectedUsersContainer}>
                  {selectedUsers.map((user) => {
                    const displayName = getUserDisplayName(user);
                    console.log('🏷️ Rendering tag for user:', user.id, 'with name:', displayName);
                    return (
                      <View key={user.id} style={[styles.userTag, { backgroundColor: theme.inputBackground, borderColor: theme.gray }]}>
                        <Text style={[styles.userTagText, { color: theme.text }]} numberOfLines={1}>
                          {displayName || 'Usuario sin nombre'}
                        </Text>
                        <TouchableOpacity onPress={() => removeUser(user.id)}>
                          <Ionicons name="close-circle" size={18} color={theme.gray} />
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              )}
              
              {/* User Search Input */}
              <View style={{ position: 'relative' }}>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.inputBackground,
                      color: theme.text,
                      borderColor: userSearchFocused ? theme.orange : theme.gray,
                    },
                  ]}
                  placeholder="Buscar usuarios por nombre o email..."
                  placeholderTextColor={theme.gray}
                  value={userSearchQuery}
                  onChangeText={handleUserSearch}
                  onFocus={() => {
                    setUserSearchFocused(true);
                    setShowUserSearch(true);
                  }}
                  onBlur={() => setUserSearchFocused(false)}
                />
                
                {searching && (
                  <ActivityIndicator 
                    style={styles.searchLoader} 
                    size="small" 
                    color={theme.orange} 
                  />
                )}
                
                {/* Search Results */}
                {showUserSearch && searchResults.length > 0 && (
                  <View style={[styles.searchResults, { backgroundColor: theme.inputBackground, borderColor: theme.gray }]}>
                    {searchResults.map((user) => (
                      <TouchableOpacity
                        key={user.id}
                        style={styles.searchResultItem}
                        onPress={() => addUser(user)}
                      >
                        <View style={styles.userInfo}>
                          <Text style={[styles.userName, { color: theme.text }]}>
                            {getUserDisplayName(user)}
                          </Text>
                          <Text style={[styles.userEmail, { color: theme.gray }]}>
                            {user.email}
                          </Text>
                        </View>
                        <Ionicons name="add-circle" size={20} color={theme.orange} />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Date and Time */}
          <View style={styles.dateTimeRow}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={[styles.label, { color: theme.text }]}>Fecha</Text>
              <TouchableOpacity
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.inputBackground,
                    borderColor: theme.gray,
                    justifyContent: 'center',
                  },
                ]}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={[styles.dateTimeText, { color: theme.text }]}>
                  {formatDate(meetingDate)}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={[styles.label, { color: theme.text }]}>Hora</Text>
              <TouchableOpacity
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.inputBackground,
                    borderColor: theme.gray,
                    justifyContent: 'center',
                  },
                ]}
                onPress={() => setShowTimePicker(true)}
              >
                <Text style={[styles.dateTimeText, { color: theme.text }]}>
                  {formatTime(meetingTime)}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Duration */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Duración (minutos) *</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.inputBackground,
                  color: theme.text,
                  borderColor: durationFocused ? theme.orange : theme.gray,
                },
              ]}
              placeholder="60"
              placeholderTextColor={theme.gray}
              value={duration}
              onChangeText={setDuration}
              keyboardType="numeric"
              onFocus={() => setDurationFocused(true)}
              onBlur={() => setDurationFocused(false)}
            />
          </View>

          {/* Video/Audio Toggle */}
          <View style={styles.switchRow}>
            <View style={styles.switchLabel}>
              <Ionicons 
                name={isVideoCall ? "videocam" : "call"} 
                size={20} 
                color={theme.text} 
              />
              <Text style={[styles.switchText, { color: theme.text }]}>
                {isVideoCall ? 'Videollamada' : 'Llamada de audio'}
              </Text>
            </View>
            <Switch
              value={isVideoCall}
              onValueChange={setIsVideoCall}
              trackColor={{ false: theme.gray, true: theme.orange }}
              thumbColor="#FFF"
            />
          </View>
        </ScrollView>

        {/* Date Picker */}
        {showDatePicker && (
          <DateTimePicker
            value={meetingDate}
            mode="date"
            display="default"
            minimumDate={new Date()}
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) {
                setMeetingDate(selectedDate);
              }
            }}
          />
        )}

        {/* Time Picker */}
        {showTimePicker && (
          <DateTimePicker
            value={meetingTime}
            mode="time"
            display="default"
            onChange={(event, selectedTime) => {
              setShowTimePicker(false);
              if (selectedTime) {
                setMeetingTime(selectedTime);
              }
            }}
          />
        )}

        {/* Custom Alert */}
        <CustomAlert
          visible={alertConfig.visible}
          title={alertConfig.title}
          message={alertConfig.message}
          type={alertConfig.type}
          buttons={alertConfig.buttons}
          onDismiss={() => setAlertConfig({ ...alertConfig, visible: false })}
        />
      </SafeAreaView>
    </Modal>
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  createButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 60,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
  form: {
    flex: 1,
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  textArea: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  pickerButton: {
    height: 50,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerText: {
    fontSize: 16,
  },
  pickerOptions: {
    marginTop: 4,
    borderRadius: 8,
    borderWidth: 1,
    maxHeight: 200,
  },
  pickerOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  pickerOptionText: {
    fontSize: 16,
  },
  dateTimeRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  dateTimeText: {
    fontSize: 16,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  switchLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchText: {
    fontSize: 16,
    marginLeft: 8,
  },
  selectedUsersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    gap: 8,
  },
  userTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    minHeight: 36,
    minWidth: 100,
    flexShrink: 0,
  },
  userTagText: {
    fontSize: 14,
    marginRight: 8,
    fontWeight: '500',
  },
  searchLoader: {
    position: 'absolute',
    right: 12,
    top: 15,
  },
  searchResults: {
    position: 'absolute',
    top: 52,
    left: 0,
    right: 0,
    borderRadius: 8,
    borderWidth: 1,
    maxHeight: 200,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
  },
  userEmail: {
    fontSize: 14,
    marginTop: 2,
  },
}); 