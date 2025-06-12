# Sistema de Gestión de Datos del Calendario Personal 📅

## Resumen
Este documento explica cómo el calendario personal obtiene, procesa y muestra datos de reuniones y tareas. El calendario personal agrega datos de múltiples fuentes para proporcionar una vista unificada del horario del usuario a través de todos los proyectos y elementos personales.

---

## 🎯 Fuentes de Datos y Estrategia

### Fuentes de Datos del Calendario Personal
El calendario personal combina datos de tres fuentes principales:

1. **Reuniones Personales** - Reuniones programadas del usuario (tanto personales como reuniones de proyecto a las que está invitado)
2. **Tareas Personales** - Tareas individuales del usuario no vinculadas a ningún proyecto
3. **Tareas de Proyecto** - Tareas de todos los proyectos de los que el usuario es miembro (filtradas por fecha de vencimiento)

---

## 🔄 Implementación de Obtención de Datos

### 1. Cargar Proyectos Primero
Antes de obtener tareas, obtener todos los proyectos del usuario para saber qué tareas de proyecto cargar:

```javascript
const loadProjects = async () => {
  try {
    const projectsData = await ProjectService.getMyProjects();
    setProjects(projectsData);
    return projectsData;
  } catch (error) {
    console.error('Error al cargar proyectos:', error);
    throw new Error('No se pudieron cargar los proyectos');
  }
};
```

**Endpoint Utilizado:**
- `GET /projects/my` - Obtener todos los proyectos del usuario

### 2. Cargar Reuniones Personales
Obtener todas las reuniones (personales y de proyecto) para el usuario:

```javascript
const loadMeetings = async () => {
  try {
    const monthString = currentMonth.toISOString().substring(0, 7); // Formato YYYY-MM
    
    // Usar endpoint de reuniones personales (projectId indefinido para vista personal)
    console.log('🏠 Cargando reuniones personales para el mes:', monthString);
    const meetingsData = await meetingService.getMeetings(undefined, monthString);
    console.log('✅ Cargadas', meetingsData.length, 'reuniones personales');
    
    setMeetings(meetingsData);
    return meetingsData;
  } catch (error) {
    console.error('Error al cargar reuniones:', error);
    throw new Error('No se pudieron cargar las reuniones');
  }
};
```

**Endpoints Utilizados:**
- `GET /calls/meetings/my` - Obtener reuniones próximas
- `GET /calls/history?page=1&limit=50` - Obtener historial de reuniones (respaldo)

**Puntos Clave:**
- Pasar `undefined` como projectId para obtener TODAS las reuniones del usuario (personales + proyecto)
- Combina reuniones próximas e históricas
- Desduplicar resultados automáticamente en el servicio

### 3. Cargar Tareas (Personales + Todos los Proyectos)
La parte más compleja - agregar tareas de fuentes personales y de todos los proyectos:

```javascript
const loadTasks = async () => {
  try {
    // 1. Cargar tareas personales
    const personalTasks = await TaskService.getPersonalTasks();
    console.log('📋 Tareas personales cargadas:', personalTasks.length, 'tareas');
    
    // 2. Cargar tareas de TODOS los proyectos y anotarlas con información del proyecto
    const projectTasksWithProjectInfo = [];
    for (const project of projects) {
      const projectTasks = await TaskService.getProjectTasks(project.id);
      
      // Agregar información del proyecto a cada tarea si falta
      const annotatedTasks = projectTasks.map(task => ({
        ...task,
        project: task.project || { id: project.id, name: project.name }
      }));
      
      projectTasksWithProjectInfo.push(...annotatedTasks);
    }
    console.log('📁 Tareas de proyecto cargadas:', projectTasksWithProjectInfo.length, 'tareas');
    
    // 3. Combinar todas las tareas
    const allTasks = [...personalTasks, ...projectTasksWithProjectInfo];
    
    // 4. Filtrar tareas que tienen fechas de vencimiento (CRÍTICO PARA CALENDARIO)
    const tasksWithDueDates = allTasks.filter(task => task.dueDate);
    console.log('📋 Cargadas', tasksWithDueDates.length, 'tareas con fechas de vencimiento de', allTasks.length, 'tareas totales');
    
    setTasks(tasksWithDueDates);
    return tasksWithDueDates;
  } catch (error) {
    console.error('Error al cargar tareas:', error);
    throw new Error('No se pudieron cargar las tareas');
  }
};
```

**Endpoints Utilizados:**
- `GET /tasks/personal` - Obtener tareas personales del usuario
- `GET /tasks/project/{projectId}` - Obtener tareas para cada proyecto (llamado múltiples veces)

**Lógica Clave:**
1. **Obtener tareas personales** primero
2. **Recorrer todos los proyectos** y obtener sus tareas
3. **Anotar tareas de proyecto** con información del proyecto si falta
4. **Combinar todas las tareas** en un array
5. **Filtrar por fecha de vencimiento** - solo las tareas con fechas de vencimiento aparecen en el calendario
6. **Sin fecha de vencimiento = no se muestra** en el calendario (pero aún aparece en listas de tareas)

---

## 📊 Procesamiento y Conversión de Datos

### Convertir Reuniones a Eventos de Calendario
```javascript
const convertMeetingsToEvents = (meetingsData) => {
  return meetingsData.map((meeting) => ({
    id: meeting.id,
    meetingId: meeting.id,
    title: meeting.title,
    date: new Date(meeting.scheduledAt), // API usa scheduledAt
    time: new Date(meeting.scheduledAt).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }),
    description: meeting.description || '',
    color: getMeetingColor(meeting.status), // Colores basados en estado
    type: 'meeting',
    projectName: meeting.project?.name || 'Reunión Personal',
    status: meeting.status === 'waiting' ? 'scheduled' : 
            meeting.status === 'ended' ? 'completed' : meeting.status || 'scheduled',
    isVideoCall: !meeting.audioOnly, // API usa audioOnly, nosotros mostramos isVideoCall
  }));
};

const getMeetingColor = (status) => {
  switch (status) {
    case 'active': return '#007AFF';    // Azul - actualmente activa
    case 'ended': return '#6B7280';     // Gris - completada
    case 'cancelled': return '#6B7280'; // Gris - cancelada
    default: return '#FFA500';          // Naranja - programada/esperando
  }
};
```

### Convertir Tareas a Eventos de Calendario
```javascript
const convertTasksToEvents = (tasksWithDueDates) => {
  return tasksWithDueDates.map((task) => {
    const dueDate = new Date(task.dueDate);
    
    // Establecer colores basados en prioridad y estado
    let color = '#F59E0B'; // Naranja por defecto para prioridad media
    if (task.status === 'done') {
      color = '#10B981'; // Verde para completadas
    } else if (task.priority === 4) {
      color = '#7C3AED'; // Morado para críticas
    } else if (task.priority === 3) {
      color = '#EF4444'; // Rojo para altas
    } else if (task.priority === 1) {
      color = '#10B981'; // Verde para bajas
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

**Lógica de Colores de Tareas:**
- **Completadas (done)**: Verde `#10B981`
- **Prioridad Crítica (4)**: Morado `#7C3AED`
- **Prioridad Alta (3)**: Rojo `#EF4444`
- **Prioridad Baja (1)**: Verde `#10B981`
- **Por Defecto/Media (2)**: Naranja `#F59E0B`

---

## 🔄 Flujo Completo de Carga de Datos

### Carga Inicial de Datos
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
    console.error('Error al cargar datos iniciales:', error);
  } finally {
    setLoading(false);
  }
};
```

### Actualización de Datos al Cambiar Mes
```javascript
useEffect(() => {
  if (projects.length > 0) {
    loadMeetings();
    loadTasks();
  }
}, [currentMonth, projects]);
```

**Puntos Clave:**
- **Los proyectos deben cargarse primero** antes de que se puedan obtener las tareas
- **Las reuniones se recargan** cuando cambia el mes (filtrado específico por mes)
- **Las tareas se recargan** cuando cambia el mes o cambian los proyectos
- **Carga paralela** donde sea posible para mejor rendimiento

### Actualización Manual (Deslizar para Actualizar)
```javascript
const handleRefresh = async () => {
  setRefreshing(true);
  await loadInitialData();
  setRefreshing(false);
};
```

---

## 📅 Gestión de Eventos de Calendario

### Combinar Todos los Eventos
```javascript
const updateEventsState = (meetingEvents, taskEvents) => {
  // Actualizar eventos preservando eventos existentes y agregando nuevos
  setEvents(prevEvents => {
    // Combinar todos los tipos de eventos
    return [...meetingEvents, ...taskEvents];
  });
};
```

### Filtrado de Eventos para Visualización
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

**Opciones de Filtro:**
- **"Todos los Eventos"** - Mostrar todas las reuniones y tareas
- **"Reuniones"** - Mostrar solo reuniones
- **"Tareas"** - Mostrar solo tareas

---

## 🎯 Implementación del Frontend Web

### 1. Servicio de Obtención de Datos
```javascript
class PersonalCalendarService {
  async loadCalendarData(currentMonth) {
    try {
      // 1. Cargar proyectos del usuario primero
      const projects = await fetch('/api/projects/my', {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(r => r.json());
      
      // 2. Cargar reuniones personales
      const monthString = currentMonth.toISOString().substring(0, 7);
      const meetings = await this.loadPersonalMeetings(monthString);
      
      // 3. Cargar todas las tareas (personales + proyecto)
      const tasks = await this.loadAllUserTasks(projects);
      
      return {
        projects,
        meetings,
        tasks: tasks.filter(task => task.dueDate) // Solo tareas con fechas de vencimiento
      };
    } catch (error) {
      console.error('Error al cargar datos del calendario:', error);
      throw error;
    }
  }
  
  async loadPersonalMeetings(monthString) {
    // Obtener reuniones próximas
    const upcoming = await fetch('/api/calls/meetings/my', {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(r => r.json());
    
    // Obtener historial (opcional, con manejo de errores)
    let history = [];
    try {
      history = await fetch('/api/calls/history?page=1&limit=50', {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(r => r.json());
    } catch (e) {
      console.log('Endpoint de historial no disponible');
    }
    
    // Combinar y desduplicar
    const allMeetings = [...upcoming];
    history.forEach(historyMeeting => {
      if (!upcoming.some(m => m.id === historyMeeting.id)) {
        allMeetings.push(historyMeeting);
      }
    });
    
    return allMeetings;
  }
  
  async loadAllUserTasks(projects) {
    // Cargar tareas personales
    const personalTasks = await fetch('/api/tasks/personal', {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(r => r.json());
    
    // Cargar tareas de proyecto
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

### 2. Ejemplo de Hook de React
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

### 3. Utilidades de Conversión de Eventos
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

## 🔧 Manejo de Errores y Rendimiento

### Estrategia de Manejo de Errores
```javascript
const loadDataWithErrorHandling = async () => {
  const errors = [];
  
  try {
    const projects = await loadProjects();
  } catch (error) {
    errors.push({ type: 'projects', message: 'Error al cargar proyectos' });
  }
  
  try {
    const meetings = await loadMeetings();
  } catch (error) {
    errors.push({ type: 'meetings', message: 'Error al cargar reuniones' });
  }
  
  try {
    const tasks = await loadTasks();
  } catch (error) {
    errors.push({ type: 'tasks', message: 'Error al cargar tareas' });
  }
  
  // Mostrar datos parciales incluso si algunas fuentes fallan
  if (errors.length > 0) {
    console.warn('Algunas fuentes de datos fallaron:', errors);
    showPartialDataWarning(errors);
  }
};
```

### Optimizaciones de Rendimiento
```javascript
// 1. Carga paralela donde sea posible
const loadDataOptimized = async () => {
  const projects = await loadProjects(); // Debe cargarse primero
  
  // Luego cargar reuniones y tareas en paralelo
  const [meetings, tasks] = await Promise.all([
    loadMeetings(),
    loadTasksForProjects(projects)
  ]);
  
  return { projects, meetings, tasks };
};

// 2. Búsqueda con debounce
const debouncedSearch = useCallback(
  debounce((query) => {
    setSearchQuery(query);
  }, 300),
  []
);

// 3. Filtrado de eventos memoizado
const filteredEvents = useMemo(() => {
  return events.filter(event => {
    // ... lógica de filtrado
  });
}, [events, selectedDate, searchQuery, selectedFilter]);
```

---

## 🎯 Puntos Clave de Implementación

### 1. Dependencias de Datos
- **Los proyectos deben cargarse primero** - necesarios para obtener tareas de proyecto
- **Los cambios de mes activan recargas** - para filtrado específico por fecha
- **El filtrado por fecha de vencimiento es crítico** - solo las tareas con fechas de vencimiento aparecen en el calendario

### 2. Resumen de Endpoints
```javascript
// Endpoints requeridos para calendario personal:
const endpoints = {
  projects: 'GET /projects/my',
  personalMeetings: 'GET /calls/meetings/my',
  meetingHistory: 'GET /calls/history?page=1&limit=50', // Respaldo opcional
  personalTasks: 'GET /tasks/personal',
  projectTasks: 'GET /tasks/project/{projectId}' // Llamado para cada proyecto
};
```

### 3. Flujo de Datos
1. **Cargar proyectos** → 2. **Cargar reuniones** → 3. **Cargar tareas personales** → 4. **Cargar tareas de proyecto** → 5. **Filtrar por fecha de vencimiento** → 6. **Convertir a eventos** → 7. **Mostrar en calendario**

### 4. Filtros Críticos
- **Tareas**: Solo mostrar si existe `task.dueDate`
- **Reuniones**: Mostrar todas (reuniones personales y de proyecto a las que el usuario está invitado)
- **Proyectos**: Debe ser miembro para ver tareas del proyecto

El calendario personal proporciona una vista integral agregando datos de múltiples fuentes mientras mantiene el rendimiento a través de estrategias apropiadas de caché y carga paralela. 