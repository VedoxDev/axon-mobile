# Personal Calendar Data Management System 📅

## Overview
This document explains how the personal calendar fetches, processes, and displays meetings and tasks data. The personal calendar aggregates data from multiple sources to provide a unified view of the user's schedule across all projects and personal items.

---

## 🎯 Data Sources & Strategy

### Personal Calendar Data Sources
The personal calendar combines data from three main sources:

1. **Personal Meetings** - User's scheduled meetings (both personal and project meetings they're invited to)
2. **Personal Tasks** - User's individual tasks not tied to any project
3. **Project Tasks** - Tasks from all projects the user is a member of (filtered by due date)

---

## 🔄 Data Fetching Implementation

### 1. Load Projects First
Before fetching tasks, get all user's projects to know which project tasks to load:

```javascript
const loadProjects = async () => {
  try {
    const projectsData = await ProjectService.getMyProjects();
    setProjects(projectsData);
    return projectsData;
  } catch (error) {
    console.error('Failed to load projects:', error);
    throw new Error('No se pudieron cargar los proyectos');
  }
};
```

**Endpoint Used:**
- `GET /projects/my` - Get all user's projects

### 2. Load Personal Meetings
Fetch all meetings (personal and project) for the user:

```javascript
const loadMeetings = async () => {
  try {
    const monthString = currentMonth.toISOString().substring(0, 7); // YYYY-MM format
    
    // Use personal meetings endpoint (undefined projectId for personal view)
    console.log('🏠 Loading personal meetings for month:', monthString);
    const meetingsData = await meetingService.getMeetings(undefined, monthString);
    console.log('✅ Loaded', meetingsData.length, 'personal meetings');
    
    setMeetings(meetingsData);
    return meetingsData;
  } catch (error) {
    console.error('Failed to load meetings:', error);
    throw new Error('No se pudieron cargar las reuniones');
  }
};
```

**Endpoints Used:**
- `GET /calls/meetings/my` - Get upcoming meetings
- `GET /calls/history?page=1&limit=50` - Get meeting history (fallback)

**Key Points:**
- Pass `undefined` as projectId to get ALL user meetings (personal + project)
- Combines upcoming and historical meetings
- Deduplicates results automatically in the service

### 3. Load Tasks (Personal + All Projects)
The most complex part - aggregate tasks from personal and all project sources:

```javascript
const loadTasks = async () => {
  try {
    // 1. Load personal tasks
    const personalTasks = await TaskService.getPersonalTasks();
    console.log('📋 Personal tasks loaded:', personalTasks.length, 'tasks');
    
    // 2. Load tasks from ALL projects and annotate them with project info
    const projectTasksWithProjectInfo = [];
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
    
    // 3. Combine all tasks
    const allTasks = [...personalTasks, ...projectTasksWithProjectInfo];
    
    // 4. Filter tasks that have due dates (CRITICAL FOR CALENDAR)
    const tasksWithDueDates = allTasks.filter(task => task.dueDate);
    console.log('📋 Loaded', tasksWithDueDates.length, 'tasks with due dates out of', allTasks.length, 'total tasks');
    
    setTasks(tasksWithDueDates);
    return tasksWithDueDates;
  } catch (error) {
    console.error('Failed to load tasks:', error);
    throw new Error('No se pudieron cargar las tareas');
  }
};
```

**Endpoints Used:**
- `GET /tasks/personal` - Get user's personal tasks
- `GET /tasks/project/{projectId}` - Get tasks for each project (called multiple times)

**Key Logic:**
1. **Fetch personal tasks** first
2. **Loop through all projects** and fetch their tasks
3. **Annotate project tasks** with project information if missing
4. **Combine all tasks** into one array
5. **Filter by due date** - only tasks with due dates appear in calendar
6. **No due date = not shown** in calendar (but still appears in task lists)

---

## 📊 Data Processing & Conversion

### Convert Meetings to Calendar Events
```javascript
const convertMeetingsToEvents = (meetingsData) => {
  return meetingsData.map((meeting) => ({
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
    color: getMeetingColor(meeting.status), // Status-based colors
    type: 'meeting',
    projectName: meeting.project?.name || 'Reunión Personal',
    status: meeting.status === 'waiting' ? 'scheduled' : 
            meeting.status === 'ended' ? 'completed' : meeting.status || 'scheduled',
    isVideoCall: !meeting.audioOnly, // API uses audioOnly, we display isVideoCall
  }));
};

const getMeetingColor = (status) => {
  switch (status) {
    case 'active': return '#007AFF';    // Blue - currently active
    case 'ended': return '#6B7280';     // Gray - completed
    case 'cancelled': return '#6B7280'; // Gray - cancelled
    default: return '#FFA500';          // Orange - scheduled/waiting
  }
};
```

### Convert Tasks to Calendar Events
```javascript
const convertTasksToEvents = (tasksWithDueDates) => {
  return tasksWithDueDates.map((task) => {
    const dueDate = new Date(task.dueDate);
    
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
    
    const projectName = task.project?.name || 'Tarea Personal';
    
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
};
```

**Task Color Logic:**
- **Completed (done)**: Green `#10B981`
- **Critical Priority (4)**: Purple `#7C3AED`
- **High Priority (3)**: Red `#EF4444`
- **Low Priority (1)**: Green `#10B981`
- **Default/Medium (2)**: Orange `#F59E0B`

---

## 🔄 Complete Data Loading Flow

### Initial Data Load
```javascript
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
```

### Month Change Data Refresh
```javascript
useEffect(() => {
  if (projects.length > 0) {
    loadMeetings();
    loadTasks();
  }
}, [currentMonth, projects]);
```

**Key Points:**
- **Projects must load first** before tasks can be fetched
- **Meetings reload** when month changes (month-specific filtering)
- **Tasks reload** when month changes or projects change
- **Parallel loading** where possible for better performance

### Manual Refresh (Pull-to-Refresh)
```javascript
const handleRefresh = async () => {
  setRefreshing(true);
  await loadInitialData();
  setRefreshing(false);
};
```

---

## 📅 Calendar Event Management

### Combine All Events
```javascript
const updateEventsState = (meetingEvents, taskEvents) => {
  // Update events by preserving existing events and adding new ones
  setEvents(prevEvents => {
    // Combine all event types
    return [...meetingEvents, ...taskEvents];
  });
};
```

### Event Filtering for Display
```javascript
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
```

**Filter Options:**
- **"Todos los Eventos"** - Show all meetings and tasks
- **"Reuniones"** - Show only meetings
- **"Tareas"** - Show only tasks

---

## 🎯 Web Frontend Implementation

### 1. Data Fetching Service
```javascript
class PersonalCalendarService {
  async loadCalendarData(currentMonth) {
    try {
      // 1. Load user's projects first
      const projects = await fetch('/api/projects/my', {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(r => r.json());
      
      // 2. Load personal meetings
      const monthString = currentMonth.toISOString().substring(0, 7);
      const meetings = await this.loadPersonalMeetings(monthString);
      
      // 3. Load all tasks (personal + project)
      const tasks = await this.loadAllUserTasks(projects);
      
      return {
        projects,
        meetings,
        tasks: tasks.filter(task => task.dueDate) // Only tasks with due dates
      };
    } catch (error) {
      console.error('Failed to load calendar data:', error);
      throw error;
    }
  }
  
  async loadPersonalMeetings(monthString) {
    // Fetch upcoming meetings
    const upcoming = await fetch('/api/calls/meetings/my', {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(r => r.json());
    
    // Fetch history (optional, with error handling)
    let history = [];
    try {
      history = await fetch('/api/calls/history?page=1&limit=50', {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(r => r.json());
    } catch (e) {
      console.log('History endpoint not available');
    }
    
    // Combine and deduplicate
    const allMeetings = [...upcoming];
    history.forEach(historyMeeting => {
      if (!upcoming.some(m => m.id === historyMeeting.id)) {
        allMeetings.push(historyMeeting);
      }
    });
    
    return allMeetings;
  }
  
  async loadAllUserTasks(projects) {
    // Load personal tasks
    const personalTasks = await fetch('/api/tasks/personal', {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(r => r.json());
    
    // Load project tasks
    const projectTaskPromises = projects.map(project =>
      fetch(`/api/tasks/project/${project.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(r => r.json())
      .then(tasks => tasks.map(task => ({
        ...task,
        project: task.project || { id: project.id, name: project.name }
      })))
    );
    
    const projectTasksArrays = await Promise.all(projectTaskPromises);
    const projectTasks = projectTasksArrays.flat();
    
    return [...personalTasks, ...projectTasks];
  }
}
```

### 2. React Hook Example
```javascript
const usePersonalCalendar = (currentMonth) => {
  const [data, setData] = useState({ meetings: [], tasks: [], projects: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const calendarService = new PersonalCalendarService();
      const calendarData = await calendarService.loadCalendarData(currentMonth);
      
      setData(calendarData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [currentMonth]);
  
  useEffect(() => {
    loadData();
  }, [loadData]);
  
  const refreshData = () => loadData();
  
  return {
    meetings: data.meetings,
    tasks: data.tasks,
    projects: data.projects,
    loading,
    error,
    refreshData
  };
};
```

### 3. Event Conversion Utilities
```javascript
const convertToCalendarEvents = (meetings, tasks) => {
  const meetingEvents = meetings.map(meeting => ({
    id: meeting.id,
    type: 'meeting',
    title: meeting.title,
    start: new Date(meeting.scheduledAt),
    end: new Date(new Date(meeting.scheduledAt).getTime() + (meeting.duration * 60000)),
    color: getMeetingStatusColor(meeting.status),
    extendedProps: {
      meetingId: meeting.id,
      status: meeting.status,
      isVideoCall: !meeting.audioOnly,
      projectName: meeting.project?.name || 'Personal'
    }
  }));
  
  const taskEvents = tasks
    .filter(task => task.dueDate)
    .map(task => ({
      id: `task-${task.id}`,
      type: 'task',
      title: task.title,
      start: new Date(task.dueDate),
      allDay: true,
      color: getTaskPriorityColor(task.priority, task.status),
      extendedProps: {
        taskId: task.id,
        priority: task.priority,
        status: task.status,
        projectName: task.project?.name || 'Personal'
      }
    }));
  
  return [...meetingEvents, ...taskEvents];
};
```

---

## 🔧 Error Handling & Performance

### Error Handling Strategy
```javascript
const loadDataWithErrorHandling = async () => {
  const errors = [];
  
  try {
    const projects = await loadProjects();
  } catch (error) {
    errors.push({ type: 'projects', message: 'Failed to load projects' });
  }
  
  try {
    const meetings = await loadMeetings();
  } catch (error) {
    errors.push({ type: 'meetings', message: 'Failed to load meetings' });
  }
  
  try {
    const tasks = await loadTasks();
  } catch (error) {
    errors.push({ type: 'tasks', message: 'Failed to load tasks' });
  }
  
  // Show partial data even if some sources fail
  if (errors.length > 0) {
    console.warn('Some data sources failed:', errors);
    showPartialDataWarning(errors);
  }
};
```

### Performance Optimizations
```javascript
// 1. Parallel loading where possible
const loadDataOptimized = async () => {
  const projects = await loadProjects(); // Must load first
  
  // Then load meetings and tasks in parallel
  const [meetings, tasks] = await Promise.all([
    loadMeetings(),
    loadTasksForProjects(projects)
  ]);
  
  return { projects, meetings, tasks };
};

// 2. Debounced search
const debouncedSearch = useCallback(
  debounce((query) => {
    setSearchQuery(query);
  }, 300),
  []
);

// 3. Memoized event filtering
const filteredEvents = useMemo(() => {
  return events.filter(event => {
    // ... filtering logic
  });
}, [events, selectedDate, searchQuery, selectedFilter]);
```

---

## 🎯 Key Implementation Points

### 1. Data Dependencies
- **Projects must load first** - needed to fetch project tasks
- **Month changes trigger reloads** - for date-specific filtering
- **Due date filtering is critical** - only tasks with due dates appear in calendar

### 2. Endpoint Summary
```javascript
// Required endpoints for personal calendar:
const endpoints = {
  projects: 'GET /projects/my',
  personalMeetings: 'GET /calls/meetings/my',
  meetingHistory: 'GET /calls/history?page=1&limit=50', // Optional fallback
  personalTasks: 'GET /tasks/personal',
  projectTasks: 'GET /tasks/project/{projectId}' // Called for each project
};
```

### 3. Data Flow
1. **Load projects** → 2. **Load meetings** → 3. **Load personal tasks** → 4. **Load project tasks** → 5. **Filter by due date** → 6. **Convert to events** → 7. **Display in calendar**

### 4. Critical Filters
- **Tasks**: Only show if `task.dueDate` exists
- **Meetings**: Show all (personal and project meetings user is invited to)
- **Projects**: Must be member to see project tasks

The personal calendar provides a comprehensive view by aggregating data from multiple sources while maintaining performance through proper caching and parallel loading strategies. 