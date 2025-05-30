import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Image } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState, useMemo } from 'react';

// Types for our files
type File = {
  id: string;
  name: string;
  type: 'pdf' | 'doc' | 'image' | 'spreadsheet' | 'presentation';
  size: string;
  lastModified: Date;
  owner: string;
  thumbnail?: string;
};

// Sample files data
const SAMPLE_FILES: File[] = [
  {
    id: '1',
    name: 'Project Proposal.pdf',
    type: 'pdf',
    size: '2.4 MB',
    lastModified: new Date(),
    owner: 'John Doe',
  },
  {
    id: '2',
    name: 'Meeting Notes.docx',
    type: 'doc',
    size: '1.2 MB',
    lastModified: new Date(new Date().setDate(new Date().getDate() - 1)),
    owner: 'Jane Smith',
  },
  {
    id: '3',
    name: 'Design Mockups.png',
    type: 'image',
    size: '4.8 MB',
    lastModified: new Date(new Date().setDate(new Date().getDate() - 2)),
    owner: 'Mike Johnson',
  },
  {
    id: '4',
    name: 'Budget 2024.xlsx',
    type: 'spreadsheet',
    size: '3.1 MB',
    lastModified: new Date(new Date().setDate(new Date().getDate() - 3)),
    owner: 'Sarah Wilson',
  },
  {
    id: '5',
    name: 'Project Timeline.pptx',
    type: 'presentation',
    size: '5.6 MB',
    lastModified: new Date(new Date().setDate(new Date().getDate() - 4)),
    owner: 'David Brown',
  },
];

const fileTypes = ['Todos', 'PDF', 'Documentos', 'Imágenes', 'Hojas de cálculo', 'Presentaciones'];
const sortOptions = ['Nombre', 'Fecha', 'Tamaño', 'Propietario'];

export default function FilesScreen() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState(fileTypes[0]);
  const [sortBy, setSortBy] = useState(sortOptions[0]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [nameFocused, setNameFocused] = useState(false);

  // Filter and sort files
  const filteredFiles = useMemo(() => {
    let files = SAMPLE_FILES.filter(file => 
      file.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (selectedType === 'Todos' || file.type.toUpperCase() === selectedType.toUpperCase())
    );

    // Sort files
    switch (sortBy) {
      case 'Nombre':
        files.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'Fecha':
        files.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
        break;
      case 'Tamaño':
        files.sort((a, b) => {
          const sizeA = parseFloat(a.size);
          const sizeB = parseFloat(b.size);
          return sizeB - sizeA;
        });
        break;
      case 'Propietario':
        files.sort((a, b) => a.owner.localeCompare(b.owner));
        break;
    }

    return files;
  }, [searchQuery, selectedType, sortBy]);

  const getFileIcon = (type: File['type']) => {
    switch (type) {
      case 'pdf':
        return 'document-text';
      case 'doc':
        return 'document';
      case 'image':
        return 'image';
      case 'spreadsheet':
        return 'grid';
      case 'presentation':
        return 'easel';
      default:
        return 'document';
    }
  };

  const getFileColor = (type: File['type']) => {
    switch (type) {
      case 'pdf':
        return Colors.light.red;
      case 'doc':
        return Colors.light.primary;
      case 'image':
        return Colors.light.green;
      case 'spreadsheet':
        return Colors.light.orange;
      case 'presentation':
        return Colors.light.primary;
      default:
        return Colors.light.gray;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>Archivos</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={[styles.searchInput, { 
            backgroundColor: theme.card, 
            color: theme.text, 
            borderColor: nameFocused ? 
            theme.orange : theme.gray 
          }]}
          placeholder="Buscar archivos..."
          placeholderTextColor={theme.gray}
          onFocus={() => setNameFocused(true)}
          onBlur={() => setNameFocused(false)}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <Ionicons name="search" size={20} color={theme.gray} style={styles.searchIcon} />
      </View>

      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {fileTypes.map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.filterChip,
                {
                  backgroundColor: selectedType === type ? theme.primary : theme.inputBackground,
                  borderColor: theme.gray,
                },
              ]}
              onPress={() => setSelectedType(type)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  { color: selectedType === type ? '#fff' : theme.text },
                ]}
              >
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.toolbar}>
        <View style={styles.sortContainer}>
          <Text style={[styles.sortLabel, { color: theme.text }]}>Ordenar por:</Text>
          <TouchableOpacity
            style={[styles.sortButton, { borderColor: theme.gray }]}
            onPress={() => {
              const currentIndex = sortOptions.indexOf(sortBy);
              const nextIndex = (currentIndex + 1) % sortOptions.length;
              setSortBy(sortOptions[nextIndex]);
            }}
          >
            <Text style={[styles.sortButtonText, { color: theme.text }]}>{sortBy}</Text>
            <Ionicons name="chevron-down" size={20} color={theme.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[
              styles.viewButton,
              viewMode === 'grid' && { backgroundColor: theme.primary },
            ]}
            onPress={() => setViewMode('grid')}
          >
            <Ionicons
              name="grid"
              size={20}
              color={viewMode === 'grid' ? '#fff' : theme.text}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.viewButton,
              viewMode === 'list' && { backgroundColor: theme.primary },
            ]}
            onPress={() => setViewMode('list')}
          >
            <Ionicons
              name="list"
              size={20}
              color={viewMode === 'list' ? '#fff' : theme.text}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.filesContainer}>
        {viewMode === 'grid' ? (
          <View style={styles.gridContainer}>
            {filteredFiles.map((file) => (
              <TouchableOpacity
                key={file.id}
                style={[styles.fileCard, { backgroundColor: theme.card, borderColor: theme.gray }]}
              >
                <View style={[styles.fileIconContainer, { backgroundColor: getFileColor(file.type) }]}>
                  <Ionicons name={getFileIcon(file.type)} size={24} color="#fff" />
                </View>
                <Text style={[styles.fileName, { color: theme.text }]} numberOfLines={2}>
                  {file.name}
                </Text>
                <Text style={[styles.fileInfo, { color: theme.gray }]}>{file.size}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.listContainer}>
            {filteredFiles.map((file) => (
              <TouchableOpacity
                key={file.id}
                style={[styles.fileRow, { backgroundColor: theme.card, borderColor: theme.gray }]}
              >
                <View style={[styles.fileIconContainer, { backgroundColor: getFileColor(file.type) }]}>
                  <Ionicons name={getFileIcon(file.type)} size={24} color="#fff" />
                </View>
                <View style={styles.fileDetails}>
                  <Text style={[styles.fileName, { color: theme.text }]} numberOfLines={1}>
                    {file.name}
                  </Text>
                  <Text style={[styles.fileInfo, { color: theme.gray }]}>
                    {file.size} • {file.owner} • {file.lastModified.toLocaleDateString()}
                  </Text>
                </View>
                <Ionicons name="ellipsis-vertical" size={20} color={theme.gray} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <TouchableOpacity style={[styles.fab, { backgroundColor: theme.primary }]}>
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  backButton: {
    marginRight: 16,
    backgroundColor: '#42A5F5',
    borderRadius: 20,
    padding: 6,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchInput: {
    height: 50,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 40,
    fontSize: 16,
  },
  searchIcon: {
    position: 'absolute',
    left: 30,
    top: 15,
  },
  filtersContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortLabel: {
    fontSize: 14,
    marginRight: 8,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  sortButtonText: {
    fontSize: 14,
    marginRight: 4,
  },
  viewToggle: {
    flexDirection: 'row',
    borderRadius: 6,
    overflow: 'hidden',
  },
  viewButton: {
    padding: 8,
  },
  filesContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  fileCard: {
    width: '48%',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
  },
  fileIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  fileInfo: {
    fontSize: 12,
  },
  listContainer: {
    gap: 8,
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  fileDetails: {
    flex: 1,
    marginLeft: 12,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
}); 