import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { useRouter } from 'expo-router';

const projectName = 'My Space App';

const ANNOUNCEMENTS = [
  {
    id: '1',
    autor: 'Richard L.',
    message: 'Sprint 2 will start this Thursday. Prepare your tasks.',
    timestamp: '2024-06-10 09:00',
  },
  {
    id: '2',
    autor: 'María G.',
    message: 'Design review meeting on Friday at 3 PM.',
    timestamp: '2024-06-09 15:00',
  },
  {
    id: '3',
    autor: 'Verónica M.',
    message: 'Remember to update your progress in the Kanban board.',
    timestamp: '2024-06-08 18:30',
  },
  {
    id: '4',
    autor: 'Mario R.',
    message: 'New Figma assets are available for the mobile team.',
    timestamp: '2024-06-07 11:45',
  },
  {
    id: '5',
    autor: 'Benson N',
    message: 'Sprint 1 retrospective is scheduled for Monday.',
    timestamp: '2024-06-06 10:00',
  },
];

const COLORS = ['#42A5F5', '#FFB74D'];

export default function AnnScreen() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const router = useRouter();

  return (
    <View style={[styles.container, { backgroundColor: colorScheme === 'dark' ? theme.card : theme.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/(tabs)/home')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.projectTitle}>{projectName}</Text>
      </View>
      <FlatList
        data={ANNOUNCEMENTS}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item, index }) => {
          const bgColor = COLORS[index % COLORS.length];
          const textColor = index % 2 === 0 ? '#FFFFFF' : '#000000';
          return (
            <View style={[styles.card, { backgroundColor: bgColor }]}>
              <Text style={[styles.author, { color: textColor }]}>{item.autor}</Text>
              <Text style={[styles.message, { color: textColor }]}>{item.message}</Text>
              <Text style={[styles.timestamp, { color: textColor, opacity: 0.7 }]}>{item.timestamp}</Text>
            </View>
          );
        }}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#181A20',
    padding: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 30,
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
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    borderRadius: 18,
    padding: 20,
    minHeight: 90,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  author:{
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 10,
  },
  message: {
    fontSize: 17,
    marginBottom: 10,
  },
  timestamp: {
    fontSize: 13,
    fontWeight: '400',
  },
  separator: {
    height: 16,
  },
}); 