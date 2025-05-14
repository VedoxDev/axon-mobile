import { View, Text, StyleSheet, Animated, TouchableOpacity, TextInput } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TasksScreen() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  // Dummy function for placeholder touchables
  const handlePressPlaceholder = () => {
    console.log('Placeholder button pressed');
  };

  return (
    <SafeAreaView style={[styles.safeAreaContainer, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>Tareas</Text>

      {/* Filter/Sort Bar */}
      <View style={styles.filterBar}> 
        {/* Filter Buttons Placeholder */}
        <TouchableOpacity style={[styles.filterButton, { backgroundColor: theme.primary }]} onPress={handlePressPlaceholder}>
          <Text style={[styles.filterButtonText, { color: theme.card }]}>Hoy</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.filterButton, { backgroundColor: theme.card }]} onPress={handlePressPlaceholder}>
          <Text style={[styles.filterButtonText, { color: theme.text }]}>Próximo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.filterButton, { backgroundColor: theme.card }]} onPress={handlePressPlaceholder}>
          <Text style={[styles.filterButtonText, { color: theme.text }]}>Todos</Text>
        </TouchableOpacity>

        {/* Sort/Search Placeholder (example) */}
        {/* Could be a search input or a sort icon */}
        <View style={[styles.sortPlaceholder, { backgroundColor: theme.card }]}>
          <Text style={{ color: theme.gray }}>🔍 Sort/Search</Text>
        </View>
      </View>

      <View style={styles.taskListContainer}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Tareas de Hoy</Text>
        <View style={[styles.taskItem, { backgroundColor: theme.card }]}>
          <View style={[styles.checkbox, { borderColor: theme.gray }]} />
          <Text style={[styles.taskText, { color: theme.text }]}>Completar informe</Text>
        </View>
        <View style={[styles.taskItem, { backgroundColor: theme.card }]}>
           <View style={[styles.checkbox, { borderColor: theme.gray }]} />
           <Text style={[styles.taskText, { color: theme.text }]}>Revisar correos</Text>
         </View>

        <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 20 }]}>Próximas Tareas</Text>
        <View style={[styles.taskItem, { backgroundColor: theme.card }]}>
          <View style={[styles.checkbox, { borderColor: theme.gray }]} />
          <Text style={[styles.taskText, { color: theme.text }]}>Planificar reunión</Text>
        </View>
        <View style={[styles.taskItem, { backgroundColor: theme.card }]}>
           <View style={[styles.checkbox, { borderColor: theme.gray }]} />
           <Text style={[styles.taskText, { color: theme.text }]}>Preparar presentación</Text>
         </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  container: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 10,
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    justifyContent: 'space-between',
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  sortPlaceholder: {
    flex: 1,
    marginLeft: 10,
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    justifyContent: 'center',
  },
  taskListContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderRadius: 4,
    marginRight: 15,
  },
  taskText: {
    fontSize: 16,
    flex: 1,
  },
});
