import { View, Text, StyleSheet, Switch, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState } from 'react';

const projectName = 'My Space App';

export default function SettingsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const [isDarkMode, setIsDarkMode] = useState(colorScheme === 'dark');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  return (
    <View style={[styles.container, { backgroundColor: colorScheme === 'dark' ? theme.card : theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.projectTitle}>{projectName}</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Apariencia</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="moon-outline" size={24} color={theme.text} />
              <Text style={[styles.settingText, { color: theme.text }]}>Modo Oscuro</Text>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={setIsDarkMode}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={isDarkMode ? '#0066cc' : '#f4f3f4'}
            />
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Notificaciones</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="notifications-outline" size={24} color={theme.text} />
              <Text style={[styles.settingText, { color: theme.text }]}>Notificaciones Push</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={notificationsEnabled ? '#0066cc' : '#f4f3f4'}
            />
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Acerca de</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="information-circle-outline" size={24} color={theme.text} />
              <Text style={[styles.settingText, { color: theme.text }]}>Versión</Text>
            </View>
            <Text style={[styles.settingValue, { color: theme.text }]}>1.0.0</Text>
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="document-text-outline" size={24} color={theme.text} />
              <Text style={[styles.settingText, { color: theme.text }]}>Términos y Condiciones</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={theme.text} />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="shield-outline" size={24} color={theme.text} />
              <Text style={[styles.settingText, { color: theme.text }]}>Política de Privacidad</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={theme.text} />
          </View>
        </View>
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
  projectTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  section: {
    margin: 16,
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    fontSize: 16,
    marginLeft: 12,
  },
  settingValue: {
    fontSize: 16,
    opacity: 0.7,
  },
}); 