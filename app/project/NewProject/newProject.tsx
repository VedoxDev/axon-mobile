import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

interface Member {
  id: string;
  name: string;
}

export default function NewProjectScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState('#42A5F5');
  const [members, setMembers] = useState<Member[]>([]);
  const [newMember, setNewMember] = useState('');
  const [nameFocused, setNameFocused] = useState(false);
  const [descriptionFocused, setDescriptionFocused] = useState(false);
  const [memberFocused, setMemberFocused] = useState(false);

  const colorOptions = [
    '#42A5F5', // Blue
    '#66BB6A', // Green
    '#FFA726', // Orange
    '#EF5350', // Red
    '#AB47BC', // Purple
    '#26A69A', // Teal
    '#FF45D0', // Teal
    
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

  const handleCreateProject = () => {
    // TODO: Implement project creation logic
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: colorScheme === 'dark' ? theme.card : theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Project</Text>
      </View>

      <ScrollView style={styles.formContainer}>
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.text }]}>Project Name</Text>
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
            placeholder="Enter project name"
            onFocus={() => setNameFocused(true)}
            onBlur={() => setNameFocused(false)}
            placeholderTextColor={theme.text + '80'}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.text }]}>Description</Text>
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
            placeholder="Enter project description"
            onFocus={() => setDescriptionFocused(true)}
            onBlur={() => setDescriptionFocused(false)}
            placeholderTextColor={theme.text + '80'}
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.text }]}>Project Color</Text>
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
              />
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.text }]}>Team Members</Text>
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
              placeholder="Enter member name or email"
              onFocus={() => setMemberFocused(true)}
              onBlur={() => setMemberFocused(false)}
              placeholderTextColor={theme.text + '80'}
            />
            <TouchableOpacity 
              style={[styles.addMemberButton, { backgroundColor: selectedColor }]}
              onPress={handleAddMember}
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
                >
                  <Ionicons name="close-circle" size={20} color={theme.gray} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.createButton, { backgroundColor: selectedColor }]}
          onPress={handleCreateProject}
        >
          <Text style={styles.createButtonText}>Create Project</Text>
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
});
