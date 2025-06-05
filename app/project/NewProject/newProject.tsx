import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { ProjectService, CreateProjectRequest } from '@/services/projectService';
import { useProjectContext } from '@/contexts/ProjectContext';

interface Member {
  id: string;
  name: string;
}

export default function NewProjectScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const { refreshProjects } = useProjectContext();
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState('#42A5F5');
  const [members, setMembers] = useState<Member[]>([]);
  const [newMember, setNewMember] = useState('');
  const [nameFocused, setNameFocused] = useState(false);
  const [descriptionFocused, setDescriptionFocused] = useState(false);
  const [memberFocused, setMemberFocused] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const colorOptions = [
    '#42A5F5', // Blue
    '#66BB6A', // Green
    '#FFA726', // Orange
    '#EF5350', // Red
    '#AB47BC', // Purple
    '#26A69A', // Teal
    '#FF45D0', // Pink
  ];

  const handleAddMember = () => {
    if (newMember.trim()) {
      setMembers([...members, { id: Date.now().toString(), name: newMember.trim() }]);
      setNewMember('');
    }
  };

  const handleRemoveMember = (id: string) => {
    setMembers(members.filter(member => member.id !== id));
  };

  const handleCreateProject = async () => {
    // Validate required fields
    if (!projectName.trim()) {
      Alert.alert('Error', 'El nombre del proyecto es obligatorio');
      return;
    }

    setIsCreating(true);
    
    try {
      const projectData: CreateProjectRequest = {
        name: projectName.trim(),
        description: description.trim() || undefined, // Only include if not empty
      };

      const response = await ProjectService.createProject(projectData);
      
      // Refresh the projects list in the context
      await refreshProjects();
      
      // Show success message
      Alert.alert(
        'Éxito', 
        'Proyecto creado exitosamente',
        [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      );
      
    } catch (error: any) {
      console.error('Error creating project:', error);
      Alert.alert('Error', error.message || 'No se pudo crear el proyecto. Inténtalo de nuevo.');
    } finally {
      setIsCreating(false);
    }
  };

  // Check if form is valid
  const isFormValid = projectName.trim().length > 0;

  return (
    <View style={[styles.container, { backgroundColor: colorScheme === 'dark' ? theme.card : theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} disabled={isCreating}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nuevo Proyecto</Text>
      </View>

      <ScrollView style={styles.formContainer}>
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.text }]}>Nombre del Proyecto *</Text>
          <TextInput
            style={[styles.input, 
              { 
                backgroundColor: theme.inputBackground, 
                color: theme.text, 
                borderColor: nameFocused ? 
                theme.orange : theme.gray 
              }]}
            value={projectName}
            onChangeText={setProjectName}
            placeholder="Ingresa el nombre del proyecto"
            onFocus={() => setNameFocused(true)}
            onBlur={() => setNameFocused(false)}
            placeholderTextColor={theme.text + '80'}
            editable={!isCreating}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.text }]}>Descripción</Text>
          <TextInput
            style={[styles.inputDescription, 
              { 
                backgroundColor: theme.inputBackground, 
                color: theme.text, 
                borderColor: descriptionFocused ? 
                theme.orange : theme.gray 
              }]}
            value={description}
            onChangeText={setDescription}
            placeholder="Ingresa una descripción del proyecto"
            onFocus={() => setDescriptionFocused(true)}
            onBlur={() => setDescriptionFocused(false)}
            placeholderTextColor={theme.text + '80'}
            multiline
            numberOfLines={4}
            editable={!isCreating}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.text }]}>Color del Proyecto</Text>
          <View style={styles.colorGrid}>
            {colorOptions.map((color) => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.colorOption,
                  { backgroundColor: color },
                  selectedColor === color && styles.selectedColor
                ]}
                onPress={() => setSelectedColor(color)}
                disabled={isCreating}
              />
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.text }]}>Miembros del Equipo</Text>
          <Text style={[styles.sublabel, { color: theme.gray }]}>Los miembros se pueden agregar después de crear el proyecto</Text>
          <View style={styles.memberInputContainer}>
            <TextInput
              style={[styles.input, styles.memberInput, 
                { 
                backgroundColor: theme.inputBackground, 
                color: theme.text, 
                borderColor: memberFocused ? 
                theme.orange : theme.gray 
              }]}
              value={newMember}
              onChangeText={setNewMember}
              placeholder="Nombre o email del miembro"
              onFocus={() => setMemberFocused(true)}
              onBlur={() => setMemberFocused(false)}
              placeholderTextColor={theme.text + '80'}
              editable={!isCreating}
            />
            <TouchableOpacity 
              style={[styles.addMemberButton, { backgroundColor: selectedColor }]}
              onPress={handleAddMember}
              disabled={isCreating}
            >
              <Ionicons name="add" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.membersList}>
            {members.map((member) => (
              <View 
                key={member.id} 
                style={[styles.memberItem, { backgroundColor: theme.inputBackground }]}
              >
                <Text style={[styles.memberName, { color: theme.text }]}>{member.name}</Text>
                <TouchableOpacity 
                  onPress={() => handleRemoveMember(member.id)}
                  style={styles.removeMemberButton}
                  disabled={isCreating}
                >
                  <Ionicons name="close-circle" size={20} color={theme.gray} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.createButton, 
            { 
              backgroundColor: isCreating ? theme.gray : selectedColor,
              opacity: (isFormValid && !isCreating) ? 1 : 0.6
            }
          ]}
          onPress={handleCreateProject}
          disabled={!isFormValid || isCreating}
        >
          {isCreating ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={[styles.createButtonText, { marginLeft: 8 }]}>Creando...</Text>
            </View>
          ) : (
            <Text style={styles.createButtonText}>Crear Proyecto</Text>
          )}
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
  },
  backButton: {
    marginRight: 16,
    marginLeft: 16,
    backgroundColor: '#42A5F5',
    borderRadius: 20,
    padding: 6,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  formContainer: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  sublabel: {
    fontSize: 12,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
  },
  inputDescription: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    height: 100,
    textAlign: 'left',
    textAlignVertical: 'top'
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 8,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedColor: {
    borderColor: '#fff',
    transform: [{ scale: 1.1 }],
  },
  memberInputContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  memberInput: {
    flex: 1,
  },
  addMemberButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  membersList: {
    marginTop: 12,
    gap: 8,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
  },
  memberName: {
    fontSize: 16,
  },
  removeMemberButton: {
    padding: 4,
  },
  createButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 32,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
