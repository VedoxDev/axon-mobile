import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';

// Define a type for the chat items
type ChatItem = {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
};

// Temporary fake chat data
const fakeChats: ChatItem[] = [
  { id: 'c1', name: 'Alice', lastMessage: 'Hey, how are you?', time: '10:00 AM' },
  { id: 'c2', name: 'Bob', lastMessage: 'Meeting at 2 PM.', time: 'Yesterday' },
  { id: 'c3', name: 'Charlie', lastMessage: 'See you soon!', time: 'Mon' },
  { id: 'c4', name: 'David', lastMessage: 'Let me know.', time: 'Fri' },
  { id: 'c5', name: 'Eve', lastMessage: 'Okay!', time: 'Wed' },
];

export default function MessagesScreen() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  const renderChatItem = ({ item }: { item: ChatItem }) => (
    <View style={[styles.chatItem, { borderBottomColor: theme.gray + '50' }]}>
      <View style={[styles.avatarPlaceholder, { backgroundColor: theme.gray }]} />
      <View style={styles.chatDetails}>
        <Text style={[styles.chatName, { color: theme.text }]}>{item.name}</Text>
        <Text style={[styles.lastMessage, { color: theme.gray }]}>{item.lastMessage}</Text>
      </View>
      <Text style={[styles.messageTime, { color: theme.gray }]}>{item.time}</Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safeAreaContainer, { backgroundColor: colorScheme === 'dark' ? theme.card : theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>Mensajes</Text>

      <View style={[styles.searchContainer, { backgroundColor: theme.card }]}>
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Buscar chats..."
          placeholderTextColor={theme.gray}
        />
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity style={[styles.filterButton, { backgroundColor: theme.primary }]}>
          <Text style={[styles.filterButtonText, { color: theme.card }]}>Chats</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.filterButton, { backgroundColor: theme.card }]}>
          <Text style={[styles.filterButtonText, { color: theme.text }]}>Grupos</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={fakeChats}
        renderItem={renderChatItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
      />
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
  searchContainer: {
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  searchInput: {
    height: 40,
    fontSize: 16,
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
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
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
  messageTime: {
    fontSize: 12,
  },
}); 