import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';

// Define types for the items
type ChatItem = {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
};

type GroupItem = {
  id: string;
  name: string;
  members: number;
  lastActivity: string;
  description: string;
};

// Temporary fake chat data
const fakeChats: ChatItem[] = [
  { id: 'c1', name: 'Alice Johnson', lastMessage: 'Hey, how are you?', time: '10:00 AM' },
  { id: 'c2', name: 'Bob Smith', lastMessage: 'Meeting at 2 PM.', time: 'Yesterday' },
  { id: 'c3', name: 'Charlie Brown', lastMessage: 'See you soon!', time: 'Mon' },
  { id: 'c4', name: 'David Wilson', lastMessage: 'Let me know.', time: 'Fri' },
  { id: 'c5', name: 'Eve Anderson', lastMessage: 'Okay!', time: 'Wed' },
];

// Temporary fake groups data
const fakeGroups: GroupItem[] = [
  { id: 'g1', name: 'Project Team', members: 8, lastActivity: '2h ago', description: 'Main project discussion' },
  { id: 'g2', name: 'Design Squad', members: 12, lastActivity: '1d ago', description: 'UI/UX discussions' },
  { id: 'g3', name: 'Marketing', members: 15, lastActivity: '3h ago', description: 'Marketing strategies' },
  { id: 'g4', name: 'Development', members: 20, lastActivity: '5h ago', description: 'Code reviews and updates' },
  { id: 'g5', name: 'HR Updates', members: 5, lastActivity: '1d ago', description: 'HR announcements' },
];

export default function MessagesScreen() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const [activeView, setActiveView] = useState<'chats' | 'groups'>('chats');
  const [nameFocused, setNameFocused] = useState(false);

  const renderChatItem = ({ item }: { item: ChatItem }) => (
    <View style={[styles.chatItem, { borderBottomColor: colorScheme === 'dark' ? theme.background : theme.card }]}>
      <View style={[styles.chatAvatarPlaceholder, { backgroundColor: theme.chatAvatar }]}>
        <Text style={[styles.chatInitial, { color: theme.card }]}>{item.name[0]}</Text>
      </View>
      <View style={styles.chatDetails}>
        <Text style={[styles.chatName, { color: theme.text }]}>{item.name}</Text>
        <Text style={[styles.lastMessage, { color: theme.gray }]}>{item.lastMessage}</Text>
        <View style={styles.chatMeta}>
          <Text style={[styles.messageTime, { color: theme.gray }]}>{item.time}</Text>
        </View>
      </View>
    </View>
  );

  const renderGroupItem = ({ item }: { item: GroupItem }) => (
    <View style={[styles.groupItem, { borderBottomColor: colorScheme === 'dark' ? theme.background : theme.card }]}>
      <View style={[styles.groupAvatarPlaceholder, { backgroundColor: theme.groupAvatar }]}>
        <Text style={[styles.groupInitial, { color: theme.card }]}>{item.name[0]}</Text>
      </View>
      <View style={styles.groupDetails}>
        <Text style={[styles.groupName, { color: theme.text }]}>{item.name}</Text>
        <Text style={[styles.groupDescription, { color: theme.gray }]}>{item.description}</Text>
        <View style={styles.groupMeta}>
          <Text style={[styles.memberCount, { color: theme.gray }]}>{item.members} miembros</Text>
          <Text style={[styles.lastActivity, { color: theme.gray }]}>{item.lastActivity}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safeAreaContainer, { backgroundColor: colorScheme === 'dark' ? theme.card : theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>Mensajes</Text>

        <TextInput
          style={[styles.searchInput, { 
            backgroundColor: theme.inputBackground, 
            color: theme.text, 
            borderColor: nameFocused ? 
            theme.orange : theme.gray 
          }]}
          placeholder={activeView === 'chats' ? "Buscar chats..." : "Buscar grupos..."}
          placeholderTextColor={theme.gray}
          onFocus={() => setNameFocused(true)}
          onBlur={() => setNameFocused(false)}
        />

      <View style={styles.filterContainer}>
        <TouchableOpacity 
          style={[styles.filterButton, { backgroundColor: activeView === 'chats' ? theme.chatAvatar : theme.card }]}
          onPress={() => setActiveView('chats')}
        >
          <Text style={[styles.filterButtonText, { color: activeView === 'chats' ? theme.card : theme.text }]}>Chats</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterButton, { backgroundColor: activeView === 'groups' ? theme.groupsButton : theme.card }]}
          onPress={() => setActiveView('groups')}
        >
          <Text style={[styles.filterButtonText, { color: activeView === 'groups' ? theme.card : theme.text }]}>Grupos</Text>
        </TouchableOpacity>
      </View>

      {activeView === 'chats' ? (
        <FlatList
          data={fakeChats}
          renderItem={renderChatItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <FlatList
          data={fakeGroups}
          renderItem={renderGroupItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
    paddingHorizontal: 10,
  },
  container: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    marginTop: 10,
    paddingLeft: 10,
  },
  searchInput: {
    height: 50,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    fontSize: 16,
    marginBottom: 10
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginRight: 10,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  listContent: {
    paddingBottom: 10,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    borderBottomWidth: 1,
  },
  chatAvatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatInitial: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  chatDetails: {
    flex: 1,
  },
  chatName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  lastMessage: {
    fontSize: 14,
    marginTop: 2,
  },
  chatMeta: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  messageTime: {
    fontSize: 12,
  },
  groupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  groupAvatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupInitial: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  groupDetails: {
    flex: 1,
  },
  groupName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  groupDescription: {
    fontSize: 14,
    marginTop: 2,
  },
  groupMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  memberCount: {
    fontSize: 12,
  },
  lastActivity: {
    fontSize: 12,
  },
}); 