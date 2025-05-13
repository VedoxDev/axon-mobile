import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

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
    <View style={styles.chatItem}>
      <View style={styles.avatarPlaceholder} />
      <View style={styles.chatDetails}>
        <Text style={[styles.chatName, { color: theme.text }]}>{item.name}</Text>
        <Text style={[styles.lastMessage, { color: theme.text + '80' }]} numberOfLines={1}>{item.lastMessage}</Text>
      </View>
      <Text style={[styles.messageTime, { color: theme.text + '80' }]}>{item.time}</Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colorScheme === 'dark' ? theme.inputBackground : theme.card }]}>
      <Text style={[styles.title, { color: theme.text }]}>Mensajes</Text>
      <FlatList
        data={fakeChats}
        renderItem={renderChatItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  listContent: {
    paddingBottom: 10,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#555',
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