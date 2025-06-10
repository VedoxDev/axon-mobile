import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, RefreshControl } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState, useMemo, useEffect } from 'react';
import { meetingService, Meeting } from '@/services/meetingService';
import { TaskService, Task } from '@/services/taskService';
import { ProjectService, ProjectResponse } from '@/services/projectService';
import CreateMeetingModal from '@/components/CreateMeetingModal';
import { MeetingInfoModal } from '@/components/MeetingInfoModal';
import { TaskInfoModal } from '@/components/TaskInfoModal';
import { CustomAlert } from '@/components/CustomAlert';

// Types for our calendar
type Event = {
  id: string;
  title: string;
  date: Date;
  time: string;
  description: string;
  color: string;
  type: 'meeting' | 'task' | 'event';
  meetingId?: string;
  taskId?: string;
  projectName?: string;
  status?: 'scheduled' | 'active' | 'completed' | 'cancelled' | 'todo' | 'in_progress' | 'done';
  isVideoCall?: boolean;
  priority?: 1 | 2 | 3 | 4;
  dueDate?: string;
};

type Day = {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: Event[];
};

// Sample events data (will be replaced with real meetings and tasks)
const SAMPLE_EVENTS: Event[] = [];

const eventFilters = ['Todos los Eventos', 'Reuniones', 'Tareas']; // Event filters

export default function CalendarScreen() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState(eventFilters[0]);
  const [nameFocused, setNameFocused] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  
  // Meeting and task state
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Modal states
  const [showMeetingInfo, setShowMeetingInfo] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [showTaskInfo, setShowTaskInfo] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title?: string;
    message: string;
    type?: 'error' | 'success' | 'warning' | 'info';
    buttons?: Array<{ text: string; onPress?: () => void; style?: 'default' | 'cancel' | 'destructive' }>;
  }>({
    visible: false,
    message: '',
  });

  // Load data on component mount
  useEffect(() => {
    loadInitialData();
  }, []);

  // Load meetings and tasks when month changes
  useEffect(() => {
    if (projects.length > 0) {
      loadMeetings();
      loadTasks();
    }
  }, [currentMonth, projects]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadProjects(),
        loadMeetings(),
        loadTasks()
      ]);
    } catch (error) {
      console.error('Failed to load initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProjects = async () => {
    try {
      const projectsData = await ProjectService.getMyProjects();
      setProjects(projectsData);
    } catch (error) {
      console.error('Failed to load projects:', error);
      setAlertConfig({
        visible: true,
        title: 'Error',
        message: 'No se pudieron cargar los proyectos',
        type: 'error',
        buttons: [{ text: 'OK' }]
      });
    }
  };

  const loadMeetings = async () => {
    try {
      const monthString = currentMonth.toISOString().substring(0, 7); // YYYY-MM format
      // Use personal meetings endpoint (undefined projectId for personal view)
      console.log('🏠 Loading personal meetings for month:', monthString);
      const meetingsData = await meetingService.getMeetings(undefined, monthString);
      console.log('✅ Loaded', meetingsData.length, 'personal meetings');
      setMeetings(meetingsData);
      
      // Convert meetings to events for calendar display
      const meetingEvents: Event[] = meetingsData.map((meeting) => ({
        id: meeting.id,
        meetingId: meeting.id,
        title: meeting.title,
        date: new Date(meeting.scheduledAt), // API uses scheduledAt
        time: new Date(meeting.scheduledAt).toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }),
        description: meeting.description || '',
        color: meeting.status === 'active' ? Colors.light.primary : 
               meeting.status === 'ended' ? '#6B7280' : 
               meeting.status === 'cancelled' ? Colors.light.gray : Colors.light.orange,
        type: 'meeting',
        projectName: meeting.project?.name || 'Reunión Personal',
        status: meeting.status === 'waiting' ? 'scheduled' : 
                meeting.status === 'ended' ? 'completed' : meeting.status || 'scheduled',
        isVideoCall: !meeting.audioOnly, // API uses audioOnly, we display isVideoCall
      }));
      
      // Update events by preserving tasks and updating meetings
      setEvents(prevEvents => {
        // Keep only task events and add new meeting events
        const taskEvents = prevEvents.filter(event => event.type === 'task');
        return [...SAMPLE_EVENTS, ...meetingEvents, ...taskEvents];
      });
    } catch (error) {
      console.error('Failed to load meetings:', error);
      setAlertConfig({
        visible: true,
        title: 'Error',
        message: 'No se pudieron cargar las reuniones',
        type: 'error',
        buttons: [{ text: 'OK' }]
      });
    }
  };

  const loadTasks = async () => {
    try {
      // Load personal tasks
      const personalTasks = await TaskService.getPersonalTasks();
      console.log('📋 Personal tasks loaded:', personalTasks.length, 'tasks');
      
      // Load tasks from all projects and annotate them with project info
      const projectTasksWithProjectInfo: Task[] = [];
      for (const project of projects) {
        const projectTasks = await TaskService.getProjectTasks(project.id);
        // Add project info to each task if it's missing
        const annotatedTasks = projectTasks.map(task => ({
          ...task,
          project: task.project || { id: project.id, name: project.name }
        }));
        projectTasksWithProjectInfo.push(...annotatedTasks);
      }
      console.log('📁 Project tasks loaded:', projectTasksWithProjectInfo.length, 'tasks');
      
      const allTasks = [...personalTasks, ...projectTasksWithProjectInfo];
      
      // Filter tasks that have due dates
      const tasksWithDueDates = allTasks.filter(task => task.dueDate);
      console.log('📋 Loaded', tasksWithDueDates.length, 'tasks with due dates out of', allTasks.length, 'total tasks');
      setTasks(tasksWithDueDates);
      
      // Convert tasks to events for calendar display
      const taskEvents: Event[] = tasksWithDueDates.map((task) => {
        const dueDate = new Date(task.dueDate!);
        
        // Set colors based on priority and status
        let color = '#F59E0B'; // Default orange for medium priority
        if (task.status === 'done') {
          color = '#10B981'; // Green for completed
        } else if (task.priority === 4) {
          color = '#7C3AED'; // Purple for critical
        } else if (task.priority === 3) {
          color = '#EF4444'; // Red for high
        } else if (task.priority === 1) {
          color = '#10B981'; // Green for low
        }
        
        // Now all tasks should have proper project info
        const projectName = task.project?.name || 'Tarea Personal';
        console.log(`📋 Task "${task.title}" -> Project: "${projectName}"`);
        
        return {
          id: `task-${task.id}`,
          taskId: task.id,
          title: task.title,
          date: dueDate,
          time: dueDate.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          }),
          description: task.description || '',
          color: color,
          type: 'task',
          projectName: projectName,
          status: task.status,
          priority: task.priority,
          dueDate: task.dueDate,
        };
      });
      
      // Update events by preserving meetings and updating tasks
      setEvents(prevEvents => {
        // Keep only meeting events and add new task events
        const meetingEvents = prevEvents.filter(event => event.type === 'meeting');
        return [...SAMPLE_EVENTS, ...meetingEvents, ...taskEvents];
      });
      
    } catch (error) {
      console.error('Failed to load tasks:', error);
      setAlertConfig({
        visible: true,
        title: 'Error',
        message: 'No se pudieron cargar las tareas',
        type: 'error',
        buttons: [{ text: 'OK' }]
      });
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  };

  const handleMeetingCreated = () => {
    loadMeetings(); // Reload meetings after creating a new one
  };

  const handleJoinMeeting = async (meetingId: string) => {
    try {
      const { callId } = await meetingService.joinMeeting(meetingId);
      router.push(`/call/${callId}`);
    } catch (error: any) {
      console.error('Failed to join meeting:', error);
      
      // Handle specific "call-has-ended" error
      if (error.message === 'call-has-ended') {
        setAlertConfig({
          visible: true,
          title: 'Reunión Finalizada',
          message: 'Esta reunión ya ha terminado. Por favor revisa el horario y únete en la próxima sesión programada.',
          type: 'warning',
          buttons: [{ 
            text: 'Entendido', 
            onPress: () => loadMeetings() // Refresh meetings to update the status
          }]
        });
      } else {
        setAlertConfig({
          visible: true,
          title: 'Error',
          message: error.message || 'No se pudo unir a la reunión',
          type: 'error',
          buttons: [{ text: 'OK' }]
        });
      }
    }
  };

  const handleStartMeeting = async (meetingId: string) => {
    // According to the API, both start and join use the same endpoint
    await handleJoinMeeting(meetingId);
  };

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
        events: events.filter(event => 
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
        events: events.filter(event => 
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
        events: events.filter(event => 
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
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonthIndex = today.getMonth();
    
    // Calculate the limits
    const minDate = new Date(currentYear, currentMonthIndex - 2, 1); // 2 months before
    const maxDate = new Date(currentYear, currentMonthIndex + 3, 1); // 3 months ahead
    
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + increment);
    
    // Check if the new month is within the allowed range
    if (newMonth >= minDate && newMonth < maxDate) {
      setCurrentMonth(newMonth);
    }
    // If outside the range, the calendar refuses to change (no action taken)
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
    return events.filter(event =>
      event.date.toDateString() === selectedDate.toDateString() &&
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (selectedFilter === 'Todos los Eventos' || 
       (selectedFilter === 'Reuniones' && event.type === 'meeting') ||
       (selectedFilter === 'Tareas' && event.type === 'task') ||
       event.title.toLowerCase().includes(selectedFilter.toLowerCase()))
    );
  }, [selectedDate, searchQuery, selectedFilter, events]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: 20 }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Calendario Personal</Text>
        <TouchableOpacity 
          onPress={() => setShowCreateModal(true)}
          style={[styles.addButton, { backgroundColor: theme.orange }]}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
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
        {days.map((day, index) => {
          const isSelected = day.date.toDateString() === selectedDate.toDateString();
          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.dayCell,
                {
                  backgroundColor: day.isToday ? theme.inputBackground : 'transparent',
                  opacity: day.isCurrentMonth ? 1 : 0.5,
                  borderColor: isSelected ? '#42A5F5' : 'transparent',
                  borderWidth: isSelected ? 2 : 1,
                },
              ]}
              onPress={() => setSelectedDate(day.date)}
            >
              <Text
                style={[
                  styles.dayNumber,
                  {
                    color: day.isToday ? Colors.light.primary : theme.text,
                  },
                ]}
              >
                {day.date.getDate()}
              </Text>
              {renderEventDot(day.events)}
            </TouchableOpacity>
          );
        })}
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
        <View style={styles.filterContainer}>
          <TouchableOpacity 
            style={[styles.filterButton, { borderColor: theme.gray }]}
            onPress={() => setShowFilterDropdown(!showFilterDropdown)}
          >
            <Text style={[styles.filterButtonText, { color: theme.text }]}>{selectedFilter}</Text>
            <Ionicons 
              name={showFilterDropdown ? "chevron-up" : "chevron-down"} 
              size={20} 
              color={theme.text} 
            />
          </TouchableOpacity>
          
          {showFilterDropdown && (
            <View style={[styles.dropdown, { backgroundColor: theme.card, borderColor: theme.gray }]}>
              {eventFilters.map((filter, index) => (
                <TouchableOpacity
                  key={filter}
                  style={[
                    styles.dropdownItem,
                    index !== eventFilters.length - 1 && [styles.dropdownItemBorder, { borderColor: theme.gray }],
                    selectedFilter === filter && { backgroundColor: theme.inputBackground }
                  ]}
                  onPress={() => {
                    setSelectedFilter(filter);
                    setShowFilterDropdown(false);
                  }}
                >
                  <Text style={[
                    styles.dropdownItemText, 
                    { color: theme.text },
                    selectedFilter === filter && { fontWeight: '600' }
                  ]}>
                    {filter}
                  </Text>
                  {selectedFilter === filter && (
                    <Ionicons name="checkmark" size={20} color={theme.orange} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <Text style={[styles.listTitle, { color: theme.text }]}>Lista</Text>

        <ScrollView 
          style={styles.eventsList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[theme.orange]}
              tintColor={theme.orange}
            />
          }
        >
          {filteredEvents.map(event => (
            <TouchableOpacity
              key={event.id}
              style={[styles.eventCard, { backgroundColor: theme.inputBackground, borderColor: theme.gray }]}
              onPress={() => {
                if (event.type === 'meeting' && event.meetingId) {
                  // Find the original meeting to show in the modal
                  const originalMeeting = meetings.find(m => m.id === event.meetingId);
                  if (originalMeeting) {
                    setSelectedMeeting(originalMeeting);
                    setShowMeetingInfo(true);
                  }
                } else if (event.type === 'task' && event.taskId) {
                  // Find the original task to show in the modal
                  const originalTask = tasks.find(t => t.id === event.taskId);
                  if (originalTask) {
                    setSelectedTask(originalTask);
                    setShowTaskInfo(true);
                  }
                }
              }}
            >
              <View style={[styles.eventColorBar, { backgroundColor: event.color }]} />
              <View style={styles.eventDetailsContainer}>
                <View style={styles.eventHeader}>
                  <View style={styles.eventTitleContainer}>
                    <Text style={[styles.eventTitleList, { color: theme.text }]} numberOfLines={1} ellipsizeMode="tail">
                      {event.title}
                    </Text>
                  </View>
                  <View style={styles.eventIconsContainer}>
                    {event.type === 'meeting' && (
                      <View style={styles.eventIcons}>
                        <Ionicons 
                          name={event.isVideoCall ? "videocam" : "call"} 
                          size={18} 
                          color={theme.text} 
                        />
                        {event.status === 'active' && (
                          <View style={[styles.statusDot, { backgroundColor: Colors.light.primary }]} />
                        )}
                        {event.status === 'completed' && (
                          <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                        )}
                      </View>
                    )}
                    {event.type === 'task' && (
                      <View style={styles.eventIcons}>
                        <Ionicons 
                          name="clipboard-outline" 
                          size={18} 
                          color={theme.text} 
                        />
                        {event.priority && event.priority >= 3 && (
                          <Ionicons 
                            name={event.priority === 4 ? "flame" : "arrow-up"} 
                            size={16} 
                            color={event.priority === 4 ? "#7C3AED" : "#EF4444"} 
                          />
                        )}
                        {event.status === 'done' && (
                          <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                        )}
                        {event.status === 'in_progress' && (
                          <View style={[styles.statusDot, { backgroundColor: Colors.light.primary }]} />
                        )}
                      </View>
                    )}
                  </View>
                </View>
                <Text style={[styles.eventTime, { color: theme.gray }]}>{event.time}</Text>
                {(event.type === 'meeting' || event.type === 'task') && event.projectName && (
                  <Text style={[styles.eventProject, { color: theme.gray }]}>
                    {event.type === 'meeting' ? '📁' : '📋'} {event.projectName}
                  </Text>
                )}
                {event.type === 'task' && event.priority && (
                  <Text style={[styles.eventProject, { color: theme.gray }]}>
                    🎯 Prioridad {event.priority === 1 ? 'Baja' : event.priority === 2 ? 'Media' : event.priority === 3 ? 'Alta' : 'Crítica'}
                  </Text>
                )}
                {event.description && (
                  <Text style={[styles.eventDescription, { color: theme.gray }]} numberOfLines={2}>
                    {event.description}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
          
          {filteredEvents.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color={theme.gray} />
              <Text style={[styles.emptyStateText, { color: theme.gray }]}>
                No hay eventos para esta fecha
              </Text>
              <Text style={[styles.emptyStateSubText, { color: theme.gray }]}>
                Toca el botón + para crear una reunión
              </Text>
            </View>
          )}
        </ScrollView>
      </View>

      {/* Dropdown overlay */}
      {showFilterDropdown && (
        <TouchableOpacity
          style={styles.dropdownOverlay}
          activeOpacity={1}
          onPress={() => setShowFilterDropdown(false)}
        />
      )}

      {/* Create Meeting Modal */}
      <CreateMeetingModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onMeetingCreated={handleMeetingCreated}
        selectedDate={selectedDate}
        projects={projects.map(project => ({
          id: project.id,
          nombre: project.name,
          descripcion: project.description
        }))}
        defaultProjectId={undefined} // Personal calendar, no default project
      />

      {/* Meeting Info Modal */}
      <MeetingInfoModal
        visible={showMeetingInfo}
        meeting={selectedMeeting}
        onClose={() => {
          setShowMeetingInfo(false);
          setSelectedMeeting(null);
        }}
        onJoinMeeting={handleJoinMeeting}
      />

      {/* Task Info Modal */}
      <TaskInfoModal
        visible={showTaskInfo}
        task={selectedTask}
        onClose={() => {
          setShowTaskInfo(false);
          setSelectedTask(null);
        }}
      />

      {/* Custom Alert */}
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        buttons={alertConfig.buttons}
        onDismiss={() => setAlertConfig({ ...alertConfig, visible: false })}
      />
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
    justifyContent: 'space-between',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
  },
  addButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 20,
    padding: 6,
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
    flex: 1,
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
  filterContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  filterButton: {
    height: 50,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filterButtonText: {
    fontSize: 16,
  },
  dropdown: {
    position: 'absolute',
    top: 52,
    left: 0,
    right: 0,
    borderRadius: 8,
    borderWidth: 1,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  dropdownItem: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownItemBorder: {
    borderBottomWidth: 1,
  },
  dropdownItemText: {
    fontSize: 16,
  },
  dropdownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  eventsList: {
    flex: 1,
  },
  eventCard: {
    flexDirection: 'row',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  eventColorBar: {
    width: 4,
  },
  eventDetailsContainer: {
    flex: 1,
    padding: 14,
  },
  eventTitleContainer: {
    flex: 1,
    marginRight: 10,
  },
  eventTitleList: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 20,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  eventIconsContainer: {
    flexShrink: 0,
    minWidth: 40,
    alignItems: 'flex-end',
  },
  eventIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  eventTime: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 6,
    opacity: 0.8,
  },
  eventProject: {
    fontSize: 12,
    marginBottom: 4,
    opacity: 0.7,
    fontWeight: '500',
  },
  eventDescription: {
    fontSize: 12,
    fontStyle: 'italic',
    opacity: 0.7,
    lineHeight: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyStateSubText: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
});
