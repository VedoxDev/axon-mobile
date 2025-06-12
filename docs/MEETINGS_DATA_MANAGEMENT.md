# Sistema de Gestión de Datos de Reuniones 📅

## Resumen
Este documento explica cómo la aplicación móvil maneja los datos de reuniones, gestión de estados, obtención de contenido y visualización de reuniones pasadas vs futuras. Esta guía está específicamente enfocada en la gestión de datos para la implementación del frontend web.

---

## 🎯 Estructura de Datos Principal

### Interfaz de Reunión
```typescript
interface Meeting {
  id: string;
  title: string;
  description?: string;
  scheduledAt: string;        // Cadena de fecha ISO (cuando está programada la reunión)
  duration: number;           // Duración en minutos
  audioOnly: boolean;         // true = solo audio, false = videollamada
  meetingType: 'project_meeting' | 'personal_meeting';
  status?: 'waiting' | 'active' | 'ended' | 'cancelled';
  
  // Campos adicionales para reuniones completadas
  startedAt?: string;         // Cuando la primera persona se unió realmente
  endedAt?: string;           // Cuando la reunión terminó realmente
  
  initiator: {
    id: string;
    nombre: string;
    apellidos: string;
    email?: string;
  };
  
  project?: {                 // Solo para reuniones de proyecto
    id: string;
    name: string;
  };
  
  participants?: Array<{
    user: {
      id: string;
      nombre: string;
      apellidos: string;
      email?: string;
    };
    isConnected?: boolean;
    joinedAt?: string;        // Cuando el participante se unió
    leftAt?: string;          // Cuando el participante se fue
  }>;
  
  createdAt: string;
}
```

---

## 📊 Sistema de Estados de Reunión

### Valores de Estado y Significados
```typescript
type MeetingStatus = 'waiting' | 'active' | 'ended' | 'cancelled';
```

**Definiciones de Estado:**
- **`waiting`**: La reunión está programada pero aún no ha comenzado
- **`active`**: La reunión está actualmente en progreso (alguien se ha unido)
- **`ended`**: La reunión terminó normalmente
- **`cancelled`**: La reunión fue cancelada antes de que pudiera comenzar

### Lógica de UI Basada en Estado
```javascript
const getStatusInfo = (status) => {
  switch (status) {
    case 'active':
      return { 
        text: 'En curso', 
        color: '#007AFF',     // Azul primario
        icon: 'radio-button-on',
        canJoin: true 
      };
    case 'ended':
      return { 
        text: 'Finalizada', 
        color: '#6B7280',     // Gris
        icon: 'checkmark-circle',
        canJoin: false 
      };
    case 'cancelled':
      return { 
        text: 'Cancelada', 
        color: '#FF3B30',     // Rojo
        icon: 'close-circle',
        canJoin: false 
      };
    default: // 'waiting'
      return { 
        text: 'Programada', 
        color: '#FFA500',     // Naranja
        icon: 'time',
        canJoin: true 
      };
  }
};
```

### Indicadores Visuales de Estado
```css
/* Estilos de insignias de estado */
.status-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.status-active {
  background-color: rgba(0, 122, 255, 0.15);
  color: #007AFF;
}

.status-ended {
  background-color: rgba(107, 114, 128, 0.15);
  color: #6B7280;
}

.status-cancelled {
  background-color: rgba(255, 59, 48, 0.15);
  color: #FF3B30;
}

.status-waiting {
  background-color: rgba(255, 165, 0, 0.15);
  color: #FFA500;
}
```

---

## 🔄 Estrategia de Obtención de Datos

### 1. Reuniones de Proyecto
Para reuniones específicas de proyecto, usar el endpoint dedicado del proyecto:

```javascript
const fetchProjectMeetings = async (projectId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/calls/meetings/project/${projectId}/history`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Error al obtener reuniones del proyecto');
    }
    
    const meetings = await response.json();
    
    // Registrar desglose de estados para depuración
    const statusCounts = meetings.reduce((acc, meeting) => {
      acc[meeting.status || 'unknown'] = (acc[meeting.status || 'unknown'] || 0) + 1;
      return acc;
    }, {});
    console.log('📊 Desglose de estados de reuniones del proyecto:', statusCounts);
    
    return meetings;
  } catch (error) {
    console.error('Error al obtener reuniones del proyecto:', error);
    throw error;
  }
};
```

### 2. Reuniones Personales
Para vista personal/general, combinar próximas e historial:

```javascript
const fetchPersonalMeetings = async () => {
  try {
    // Obtener reuniones próximas
    const upcomingResponse = await fetch(`${API_BASE_URL}/calls/meetings/my`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!upcomingResponse.ok) {
      throw new Error('Error al obtener reuniones próximas');
    }
    
    const upcomingMeetings = await upcomingResponse.json();
    
    // Obtener historial (con paginación)
    let historyMeetings = [];
    try {
      const historyParams = new URLSearchParams({
        page: '1',
        limit: '50'
      });
      
      const historyResponse = await fetch(`${API_BASE_URL}/calls/history?${historyParams}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (historyResponse.ok) {
        historyMeetings = await historyResponse.json();
      }
    } catch (historyError) {
      console.log('Endpoint de historial no disponible, usando solo reuniones próximas');
    }
    
    // Combinar y desduplicar
    const allMeetings = [...upcomingMeetings];
    historyMeetings.forEach(historyMeeting => {
      const existsInUpcoming = upcomingMeetings.some(upcoming => upcoming.id === historyMeeting.id);
      if (!existsInUpcoming) {
        allMeetings.push(historyMeeting);
      }
    });
    
    return allMeetings;
  } catch (error) {
    console.error('Error al obtener reuniones personales:', error);
    throw error;
  }
};
```

---

## 📅 Clasificación de Reuniones Pasadas vs Futuras

### Lógica de Clasificación Automática
```javascript
const classifyMeetings = (meetings) => {
  const now = new Date();
  
  return meetings.reduce((acc, meeting) => {
    const scheduledDate = new Date(meeting.scheduledAt);
    const meetingEndTime = new Date(scheduledDate.getTime() + (meeting.duration * 60000));
    
    // Lógica de clasificación
    if (meeting.status === 'ended' || meeting.status === 'cancelled') {
      acc.past.push(meeting);
    } else if (meeting.status === 'active') {
      acc.current.push(meeting);
    } else if (scheduledDate <= now && meetingEndTime >= now) {
      // La reunión debería estar activa pero podría no haber comenzado aún
      acc.current.push(meeting);
    } else if (scheduledDate > now) {
      acc.upcoming.push(meeting);
    } else {
      // El tiempo de la reunión ha pasado pero el estado sigue siendo 'waiting'
      acc.past.push(meeting);
    }
    
    return acc;
  }, { past: [], current: [], upcoming: [] });
};
```

### Verificaciones de Estado Basadas en Tiempo
```javascript
const getMeetingTimeStatus = (meeting) => {
  const now = new Date();
  const scheduledDate = new Date(meeting.scheduledAt);
  const meetingEndTime = new Date(scheduledDate.getTime() + (meeting.duration * 60000));
  const fiveMinutesBefore = new Date(scheduledDate.getTime() - (5 * 60000));
  
  if (now < fiveMinutesBefore) {
    return 'not-ready';      // Muy temprano para unirse
  } else if (now >= fiveMinutesBefore && now <= meetingEndTime) {
    return 'can-join';       // Puede unirse a la reunión
  } else {
    return 'time-passed';    // El tiempo de la reunión ha pasado
  }
};
```

---

## 🎨 Lógica de Visualización de UI

### Renderizado de Tarjeta de Reunión
```javascript
const renderMeetingCard = (meeting) => {
  const statusInfo = getStatusInfo(meeting.status);
  const timeStatus = getMeetingTimeStatus(meeting);
  const scheduledDate = new Date(meeting.scheduledAt);
  
  const canJoin = (meeting.status === 'waiting' || meeting.status === 'active') && 
                  timeStatus === 'can-join';
  
  const cardOpacity = (meeting.status === 'ended' || meeting.status === 'cancelled') ? 0.6 : 1.0;
  
  return (
    <div className="meeting-card" style={{ opacity: cardOpacity }}>
      {/* Encabezado con estado */}
      <div className="meeting-header">
        <div className={`status-badge status-${meeting.status}`}>
          <Icon name={statusInfo.icon} />
          <span>{statusInfo.text}</span>
        </div>
        <div className="meeting-type">
          <Icon name={meeting.audioOnly ? "call" : "videocam"} />
          <span>{meeting.meetingType === 'project_meeting' ? meeting.project?.name : 'Personal'}</span>
        </div>
      </div>
      
      {/* Detalles de la reunión */}
      <h3 className="meeting-title">{meeting.title}</h3>
      {meeting.description && (
        <p className="meeting-description">{meeting.description}</p>
      )}
      
      {/* Fecha y hora */}
      <div className="meeting-datetime">
        <div className="scheduled-time">
          <Icon name="calendar" />
          <span>{formatDate(scheduledDate)}</span>
          <span>{formatTime(scheduledDate)}</span>
          <span>({meeting.duration} min)</span>
        </div>
        
        {/* Tiempos reales para reuniones terminadas */}
        {meeting.status === 'ended' && meeting.startedAt && meeting.endedAt && (
          <div className="actual-times">
            <div className="actual-time">
              <Icon name="play-circle" />
              <span>Iniciada: {formatTime(new Date(meeting.startedAt))}</span>
            </div>
            <div className="actual-time">
              <Icon name="stop-circle" />
              <span>Finalizada: {formatTime(new Date(meeting.endedAt))}</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Organizador */}
      <div className="meeting-organizer">
        <div className="organizer-avatar">
          {meeting.initiator.nombre.charAt(0)}{meeting.initiator.apellidos.charAt(0)}
        </div>
        <span>{meeting.initiator.nombre} {meeting.initiator.apellidos}</span>
      </div>
      
      {/* Botones de acción */}
      <div className="meeting-actions">
        {canJoin && (
          <button 
            className="join-button"
            onClick={() => joinMeeting(meeting.id)}
          >
            <Icon name="videocam" />
            Unirse
          </button>
        )}
        <button 
          className="info-button"
          onClick={() => showMeetingInfo(meeting)}
        >
          <Icon name="information-circle" />
          Detalles
        </button>
      </div>
    </div>
  );
};
```

### Filtrado y Ordenamiento de Lista
```javascript
const filterAndSortMeetings = (meetings, filters) => {
  return meetings
    .filter(meeting => {
      // Filtro de estado
      if (filters.status && filters.status !== 'all') {
        if (filters.status !== meeting.status) return false;
      }
      
      // Filtro de tiempo (pasado, hoy, próximo)
      if (filters.timeRange) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const tomorrow = new Date(today.getTime() + 86400000);
        const scheduledDate = new Date(meeting.scheduledAt);
        
        switch (filters.timeRange) {
          case 'past':
            return meeting.status === 'ended' || meeting.status === 'cancelled';
          case 'today':
            return scheduledDate >= today && scheduledDate < tomorrow;
          case 'upcoming':
            return scheduledDate >= tomorrow && (meeting.status === 'waiting' || meeting.status === 'active');
          default:
            return true;
        }
      }
      
      // Filtro de búsqueda
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        return meeting.title.toLowerCase().includes(searchLower) ||
               meeting.description?.toLowerCase().includes(searchLower) ||
               meeting.initiator.nombre.toLowerCase().includes(searchLower) ||
               meeting.initiator.apellidos.toLowerCase().includes(searchLower);
      }
      
      return true;
    })
    .sort((a, b) => {
      // Ordenar por fecha programada (más reciente primero para pasadas, más temprano primero para próximas)
      const dateA = new Date(a.scheduledAt);
      const dateB = new Date(b.scheduledAt);
      
      if (filters.timeRange === 'past') {
        return dateB.getTime() - dateA.getTime(); // Más reciente primero
      } else {
        return dateA.getTime() - dateB.getTime(); // Más temprano primero
      }
    });
};
```

---

## 🚀 Acciones de Reunión

### 1. Crear Reuniones
```javascript
const createMeeting = async (meetingData) => {
  try {
    const endpoint = meetingData.type === 'project' 
      ? `${API_BASE_URL}/calls/meetings/project`
      : `${API_BASE_URL}/calls/meetings/personal`;
    
    // Transformar datos del frontend al formato de API
    const apiData = {
      title: meetingData.title,
      description: meetingData.description,
      scheduledAt: meetingData.scheduledFor, // API espera 'scheduledAt'
      duration: meetingData.duration,
      audioOnly: !meetingData.isVideoCall,  // API usa audioOnly
      ...(meetingData.type === 'project' 
        ? { projectId: meetingData.projectId }
        : { participantEmails: meetingData.participantEmails }
      )
    };
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(apiData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al crear reunión');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error al crear reunión:', error);
    throw error;
  }
};
```

### 2. Unirse a Reuniones
```javascript
const joinMeeting = async (meetingId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/calls/join/${meetingId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ audioOnly: false })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      
      // Manejar casos de error específicos
      if (errorData.message === 'call-has-ended') {
        throw new Error('Esta reunión ya ha terminado.');
      } else if (response.status === 404) {
        throw new Error('Reunión no encontrada o cancelada.');
      } else {
        throw new Error(errorData.message || 'No se pudo unir a la reunión');
      }
    }
    
    const { call, token: livekitToken } = await response.json();
    
    // Navegar a interfaz de llamada o configurar conexión LiveKit
    return {
      callId: call.id,
      token: livekitToken,
      call: call
    };
  } catch (error) {
    console.error('Error al unirse a la reunión:', error);
    throw error;
  }
};
```

### 3. Cancelar Reuniones
```javascript
const cancelMeeting = async (meetingId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/calls/meetings/${meetingId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al cancelar reunión');
    }
    
    // Reunión cancelada exitosamente - actualizar la lista
    return true;
  } catch (error) {
    console.error('Error al cancelar reunión:', error);
    throw error;
  }
};
```

---

## 📊 Actualizaciones en Tiempo Real

### Integración WebSocket
```javascript
// Escuchar actualizaciones de estado de reunión vía WebSocket
socket.on('meetingStatusUpdate', (data) => {
  const { meetingId, status, startedAt, endedAt } = data;
  
  // Actualizar la reunión en tu estado local
  setMeetings(prevMeetings => 
    prevMeetings.map(meeting => 
      meeting.id === meetingId 
        ? { 
            ...meeting, 
            status, 
            startedAt: startedAt || meeting.startedAt,
            endedAt: endedAt || meeting.endedAt
          }
        : meeting
    )
  );
});

// Escuchar nuevas reuniones (cuando se es invitado a otras)
socket.on('newMeetingInvitation', (meeting) => {
  setMeetings(prevMeetings => [...prevMeetings, meeting]);
  
  // Mostrar notificación
  showNotification({
    title: 'Nueva reunión programada',
    message: `${meeting.initiator.nombre} te ha invitado a: ${meeting.title}`,
    type: 'info'
  });
});
```

---

## 🔧 Integración de Calendario

### Conversión de Eventos de Calendario
```javascript
const convertMeetingsToCalendarEvents = (meetings) => {
  return meetings.map(meeting => ({
    id: meeting.id,
    title: meeting.title,
    start: new Date(meeting.scheduledAt),
    end: new Date(new Date(meeting.scheduledAt).getTime() + (meeting.duration * 60000)),
    description: meeting.description || '',
    color: getStatusInfo(meeting.status).color,
    type: 'meeting',
    extendedProps: {
      meetingId: meeting.id,
      status: meeting.status,
      isVideoCall: !meeting.audioOnly,
      projectName: meeting.project?.name || 'Personal',
      organizer: `${meeting.initiator.nombre} ${meeting.initiator.apellidos}`,
      canJoin: getMeetingTimeStatus(meeting) === 'can-join' && 
               (meeting.status === 'waiting' || meeting.status === 'active')
    }
  }));
};
```

### Navegación y Filtrado de Fechas
```javascript
const getMeetingsForDateRange = (meetings, startDate, endDate) => {
  return meetings.filter(meeting => {
    const meetingDate = new Date(meeting.scheduledAt);
    return meetingDate >= startDate && meetingDate <= endDate;
  });
};

const getMeetingsForMonth = (meetings, year, month) => {
  const startOfMonth = new Date(year, month, 1);
  const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59);
  return getMeetingsForDateRange(meetings, startOfMonth, endOfMonth);
};
```

---

## 🎯 Puntos Clave de Implementación

### 1. Estrategia de Actualización de Datos
- **Auto-actualización**: Actualizar lista de reuniones al regresar a la pantalla
- **Actualización manual**: Funcionalidad de deslizar para actualizar
- **Actualizaciones en tiempo real**: Listeners WebSocket para cambios de estado
- **Invalidación de caché**: Limpiar caché cuando se crean/cancelan reuniones

### 2. Manejo de Errores
- **Errores de red**: Mostrar mensajes de error apropiados
- **Errores de API**: Manejar códigos de error específicos (404, 400, etc.)
- **Degradación elegante**: Mostrar datos cacheados cuando sea posible
- **Retroalimentación del usuario**: Estados de carga claros y notificaciones de error

### 3. Optimización de Rendimiento
- **Paginación**: Cargar reuniones en lotes para historial
- **Carga perezosa**: Cargar detalles de reunión bajo demanda
- **Memoización**: Cachear datos de estado y visualización computados
- **Búsqueda con debounce**: Evitar llamadas excesivas a la API durante búsqueda

### 4. Mejores Prácticas de Gestión de Estado
- **Validación del lado del cliente**: Verificar rangos de tiempo antes de mostrar botones de unirse
- **Sincronización de estado**: Mantener estado local sincronizado con servidor
- **Retroalimentación visual**: Indicadores de estado claros y estados de carga
- **Recuperación de errores**: Manejar problemas temporales de red elegantemente

El sistema proporciona gestión integral de reuniones con manejo apropiado de estados, obtención eficiente de datos y separación clara entre reuniones pasadas y futuras, haciéndolo ideal para implementación de frontend web. 