import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState, useMemo } from 'react';

// Types for our calendar
type Event = {
  id: string;
  title: string;
  date: Date;
  time: string;
  description: string;
  color: string;
};

type Day = {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: Event[];
};

// Sample events data
const SAMPLE_EVENTS: Event[] = [
  {
    id: '1',
    title: 'Team Meeting',
    date: new Date(),
    time: '10:00 AM',
    description: 'Weekly team sync',
    color: Colors.light.orange,
  },
  {
    id: '2',
    title: 'Project Review',
    date: new Date(),
    time: '2:00 PM',
    description: 'Review project progress',
    color: Colors.light.primary,
  },
  {
    id: '3',
    title: 'Client Call',
    date: new Date(),
    time: '11:30 AM',
    description: 'Discuss new requirements',
    color: Colors.light.orange,
  },
  {
    id: '4',
    title: 'Planning Session',
    date: new Date(new Date().setDate(new Date().getDate() + 2)),
    time: '3:00 PM',
    description: 'Plan for next sprint',
    color: Colors.light.primary,
  },
  {
    id: '5',
    title: 'Demo Day',
    date: new Date(new Date().setDate(new Date().getDate() + 2)),
    time: '9:00 AM',
    description: 'Present completed features',
    color: Colors.light.orange,
  },
  {
    id: '6',
    title: 'Design Review',
    date: new Date(new Date().setDate(new Date().getDate() + 4)),
    time: '1:00 PM',
    description: 'Review UI/UX designs',
    color: Colors.light.primary,
  },
  {
    id: '7',
    title: 'Code Refactoring',
    date: new Date(new Date().setDate(new Date().getDate() + 5)),
    time: '9:30 AM',
    description: 'Improve codebase structure',
    color: Colors.light.orange,
  },
  {
    id: '8',
    title: 'Marketing Sync',
    date: new Date(new Date().setDate(new Date().getDate() + 5)),
    time: '2:30 PM',
    description: 'Align on marketing campaigns',
    color: Colors.light.primary,
  },
];

const eventFilters = ['Todos los Eventos', 'Reuniones', 'Revisiones', 'Llamadas']; // Sample filters

export default function CalendarScreen() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState(eventFilters[0]);
  const [nameFocused, setNameFocused] = useState(false);

  // Generate calendar days
  const generateCalendarDays = (date: Date): Day[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: Day[] = [];

    // Add days from previous month
    const firstDayOfWeek = firstDay.getDay();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i);
      days.push({
        date: prevDate,
        isCurrentMonth: false,
        isToday: false,
        events: SAMPLE_EVENTS.filter(event => 
          event.date.getDate() === prevDate.getDate() &&
          event.date.getMonth() === prevDate.getMonth() &&
          event.date.getFullYear() === prevDate.getFullYear()
        ),
      });
    }

    // Add days of current month
    const today = new Date();
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const currentDate = new Date(year, month, i);
      days.push({
        date: currentDate,
        isCurrentMonth: true,
        isToday: currentDate.toDateString() === today.toDateString(),
        events: SAMPLE_EVENTS.filter(event => 
          event.date.getDate() === i &&
          event.date.getMonth() === month &&
          event.date.getFullYear() === year
        ),
      });
    }

    // Add days from next month
    const remainingDays = 42 - days.length; // 6 rows * 7 days
    for (let i = 1; i <= remainingDays; i++) {
      const nextDate = new Date(year, month + 1, i);
      days.push({
        date: nextDate,
        isCurrentMonth: false,
        isToday: false,
        events: SAMPLE_EVENTS.filter(event => 
          event.date.getDate() === nextDate.getDate() &&
          event.date.getMonth() === nextDate.getMonth() &&
          event.date.getFullYear() === nextDate.getFullYear()
        ),
      });
    }

    return days;
  };

  const days = generateCalendarDays(currentMonth);
  const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  const changeMonth = (increment: number) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + increment);
    setCurrentMonth(newMonth);
  };

  const renderEventDot = (events: Event[]) => {
    if (events.length === 0) return null;
    return (
      <View style={styles.eventDots}>
        {events.slice(0, 3).map((event, index) => (
          <View
            key={event.id}
            style={[
              styles.eventDot,
              { backgroundColor: event.color },
              index > 0 && { marginLeft: 2 },
            ]}
          />
        ))}
        {events.length > 3 && (
          <Text style={[styles.moreEvents, { color: theme.text }]}>+{events.length - 3}</Text>
        )}
      </View>
    );
  };

  // Filter events based on selected date, search query, and filter
  const filteredEvents = useMemo(() => {
    return SAMPLE_EVENTS.filter(event =>
      event.date.toDateString() === selectedDate.toDateString() &&
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (selectedFilter === 'Todos los Eventos' || event.title.includes(selectedFilter))
    );
  }, [selectedDate, searchQuery, selectedFilter]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>Calendario</Text>
      </View>

      <View style={styles.calendarHeader}>
        <TouchableOpacity onPress={() => changeMonth(-1)}>
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.monthTitle, { color: theme.text }]}>
          {currentMonth.toLocaleString('es', { month: 'long', year: 'numeric' })}
        </Text>
        <TouchableOpacity onPress={() => changeMonth(1)}>
          <Ionicons name="chevron-forward" size={24} color={theme.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.weekDays}>
        {weekDays.map((day) => (
          <Text key={day} style={[styles.weekDay, { color: theme.text }]}>
            {day}
          </Text>
        ))}
      </View>

      <View style={styles.calendarGrid}>
        {days.map((day, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.dayCell,
              {
                backgroundColor: day.isToday ? theme.inputBackground : 'transparent',
                opacity: day.isCurrentMonth ? 1 : 0.5,
              },
            ]}
            onPress={() => setSelectedDate(day.date)}
          >
            <Text
              style={[
                styles.dayNumber,
                {
                  color: day.isToday ? '#fff' : theme.text,
                },
              ]}
            >
              {day.date.getDate()}
            </Text>
            {renderEventDot(day.events)}
          </TouchableOpacity>
        ))}
      </View>

      <View style={[styles.eventsSection, { backgroundColor: theme.card, borderColor: theme.gray }]}>
        <View style={styles.searchContainer}>
          <TextInput
            style={[styles.searchInput, 
            { 
              backgroundColor: theme.inputBackground, 
              color: theme.text, 
              borderColor: nameFocused ? 
              theme.orange : theme.gray 
            }]}
            placeholder="Buscar Evento"
            placeholderTextColor={theme.gray}
            value={searchQuery}
            onFocus={() => setNameFocused(true)}
            onBlur={() => setNameFocused(false)}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity style={[styles.filterButton, { borderColor: theme.gray }]}>
           <Text style={[styles.filterButtonText, { color: theme.text }]}>{selectedFilter}</Text>
           <Ionicons name="chevron-down" size={20} color={theme.text} />
        </TouchableOpacity>

        <Text style={[styles.listTitle, { color: theme.text }]}>Lista</Text>

        <ScrollView style={styles.eventsList}>
          {filteredEvents.map(event => (
            <View
              key={event.id}
              style={[styles.eventCard, { backgroundColor: theme.inputBackground, borderColor: theme.gray }]}>
              <View style={[styles.eventColorBar, { backgroundColor: event.color }]} />
              <View style={styles.eventDetailsContainer}>
                <Text style={[styles.eventTitleList, { color: theme.text }]}>{event.title}</Text>
                {/* Add other event details here if needed */}
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
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
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  weekDays: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    padding: 4,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  eventDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  eventDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 1,
  },
  moreEvents: {
    fontSize: 10,
    marginLeft: 2,
  },
  eventsSection: {
    flex: 1, // Removed flex: 1 to allow padding and specific height/maxHeight if needed
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    margin: 16,
    marginTop: -70,
  },
  searchContainer: {
    marginBottom: 12,
  },
  searchInput: {
    height: 50,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    fontSize: 16,
  },
  filterButton: {
    height: 50,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  filterButtonText: {
    fontSize: 16,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  eventsList: {
    flex: 1, // Keep flex 1 for the scrollable list
  },
  eventCard: {
    flexDirection: 'row',
    borderRadius: 8,
    marginBottom: 10,
    overflow: 'hidden',
    borderWidth: 1,
  },
  eventColorBar: {
    width: 10,
  },
  eventDetailsContainer: {
    padding: 10,
  },
  eventTitleList: {
    fontSize: 16,
    fontWeight: '600',
  },
  // ... Removed old event card styles
  // eventTime: {
  //   width: 80,
  //   padding: 12,
  //   alignItems: 'center',
  //   justifyContent: 'center',
  // },
  // eventTimeText: {
  //   color: '#fff',
  //   fontWeight: '600',
  // },
  // eventDetails: {
  //   flex: 1,
  //   padding: 12,
  // },
  // eventTitle: {
  //   fontSize: 16,
  //   fontWeight: '600',
  //   marginBottom: 4,
  // },
  // eventDescription: {
  //   fontSize: 14,
  // },
}); 