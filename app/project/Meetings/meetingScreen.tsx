import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

const projectName = 'My Space App';

const upcomingMeetings = [
  {
    id: '1',
    title: 'Sprint Review',
    date: '12 Dec, 10:00 AM',
    location: 'Zoom',
  },
  {
    id: '2',
    title: 'Design Sync',
    date: '14 Dec, 2:00 PM',
    location: 'In-person',
  },
];

const pastMeetings = [
  {
    id: '3',
    title: 'Kickoff Meeting',
    date: '5 Dec, 9:00 AM',
    location: 'Zoom',
    completed: true,
  },
  {
    id: '4',
    title: 'Retrospective',
    date: '1 Dec, 4:00 PM',
    location: 'In-person',
    completed: true,
  },
];

export default function MeetingsScreen() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const router = useRouter();
  return (
    <ScrollView style={[styles.container, { backgroundColor: colorScheme === 'dark' ? theme.card : theme.background }]} contentContainerStyle={{ paddingBottom: 32 }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.projectTitle}>{projectName}</Text>
      </View>

      {/* Upcoming Meetings */}
      <Text style={styles.sectionTitle}>Upcoming Meetings</Text>
      {upcomingMeetings.map((meeting) => (
        <View key={meeting.id} style={styles.meetingCard}>
          <Text style={styles.meetingTitle}>{meeting.title}</Text>
          <Text style={styles.meetingInfo}>{meeting.date}</Text>
          <Text style={styles.meetingInfo}>{meeting.location}</Text>
        </View>
      ))}

      {/* Past Meetings */}
      <Text style={styles.sectionTitle}>Past Meetings</Text>
      {pastMeetings.map((meeting) => (
        <View key={meeting.id} style={[styles.meetingCard, styles.pastMeetingCard]}>
          <View style={styles.pastMeetingHeader}>
            <Text style={styles.meetingTitle}>{meeting.title}</Text>
            {meeting.completed && (
              <View style={styles.completedBadge}>
                <Text style={styles.completedBadgeText}>Completed</Text>
              </View>
            )}
          </View>
          <Text style={styles.meetingInfo}>{meeting.date}</Text>
          <Text style={styles.meetingInfo}>{meeting.location}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#181A20',
    paddingHorizontal: 20,
    paddingTop: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    marginRight: 16,
    backgroundColor: '#42A5F5',
    borderRadius: 20,
    padding: 6,
  },
  projectTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  meetingCard: {
    backgroundColor: '#23262F',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  meetingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#42A5F5',
    marginBottom: 4,
  },
  meetingInfo: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 2,
  },
  pastMeetingCard: {
    backgroundColor: '#23262F',
    opacity: 0.6,
  },
  pastMeetingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  completedBadge: {
    backgroundColor: '#FFB74D',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  completedBadgeText: {
    color: '#23262F',
    fontWeight: 'bold',
    fontSize: 12,
  },
}); 