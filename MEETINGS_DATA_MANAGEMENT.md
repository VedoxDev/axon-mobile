# Meetings Data Management System 📅

## Overview
This document explains how the mobile app handles meetings data, status management, fetching content, and displaying past vs future meetings. This guide is specifically focused on data management for the web frontend implementation.

---

## 🎯 Core Data Structure

### Meeting Interface
```typescript
interface Meeting {
  id: string;
  title: string;
  description?: string;
  scheduledAt: string;        // ISO date string (when meeting is scheduled)
  duration: number;           // Duration in minutes
  audioOnly: boolean;         // true = audio only, false = video call
  meetingType: 'project_meeting' | 'personal_meeting';
  status?: 'waiting' | 'active' | 'ended' | 'cancelled';
  
  // Additional fields for completed meetings
  startedAt?: string;         // When first person actually joined
  endedAt?: string;           // When meeting actually ended
  
  initiator: {
    id: string;
    nombre: string;
    apellidos: string;
    email?: string;
  };
  
  project?: {                 // Only for project meetings
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
    joinedAt?: string;        // When participant joined
    leftAt?: string;          // When participant left
  }>;
  
  createdAt: string;
}
```

---

## 📊 Meeting Status System

### Status Values & Meanings
```typescript
type MeetingStatus = 'waiting' | 'active' | 'ended' | 'cancelled';
```

**Status Definitions:**
- **`waiting`**: Meeting is scheduled but hasn't started yet
- **`active`**: Meeting is currently in progress (someone has joined)
- **`ended`**: Meeting finished normally
- **`cancelled`**: Meeting was cancelled before it could start

### Status-Based UI Logic
```javascript
const getStatusInfo = (status) => {
  switch (status) {
    case 'active':
      return { 
        text: 'En curso', 
        color: '#007AFF',     // Primary blue
        icon: 'radio-button-on',
        canJoin: true 
      };
    case 'ended':
      return { 
        text: 'Finalizada', 
        color: '#6B7280',     // Gray
        icon: 'checkmark-circle',
        canJoin: false 
      };
    case 'cancelled':
      return { 
        text: 'Cancelada', 
        color: '#FF3B30',     // Red
        icon: 'close-circle',
        canJoin: false 
      };
    default: // 'waiting'
      return { 
        text: 'Programada', 
        color: '#FFA500',     // Orange
        icon: 'time',
        canJoin: true 
      };
  }
};
```

### Visual Status Indicators
```css
/* Status badges styling */
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

## 🔄 Data Fetching Strategy

### 1. Project Meetings
For project-specific meetings, use the dedicated project endpoint:

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
      throw new Error('Failed to fetch project meetings');
    }
    
    const meetings = await response.json();
    
    // Log status breakdown for debugging
    const statusCounts = meetings.reduce((acc, meeting) => {
      acc[meeting.status || 'unknown'] = (acc[meeting.status || 'unknown'] || 0) + 1;
      return acc;
    }, {});
    console.log('📊 Project meeting status breakdown:', statusCounts);
    
    return meetings;
  } catch (error) {
    console.error('Error fetching project meetings:', error);
    throw error;
  }
};
```

### 2. Personal Meetings
For personal/general view, combine upcoming and history:

```javascript
const fetchPersonalMeetings = async () => {
  try {
    // Fetch upcoming meetings
    const upcomingResponse = await fetch(`${API_BASE_URL}/calls/meetings/my`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!upcomingResponse.ok) {
      throw new Error('Failed to fetch upcoming meetings');
    }
    
    const upcomingMeetings = await upcomingResponse.json();
    
    // Fetch history (with pagination)
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
      console.log('History endpoint not available, using only upcoming meetings');
    }
    
    // Combine and deduplicate
    const allMeetings = [...upcomingMeetings];
    historyMeetings.forEach(historyMeeting => {
      const existsInUpcoming = upcomingMeetings.some(upcoming => upcoming.id === historyMeeting.id);
      if (!existsInUpcoming) {
        allMeetings.push(historyMeeting);
      }
    });
    
    return allMeetings;
  } catch (error) {
    console.error('Error fetching personal meetings:', error);
    throw error;
  }
};
```

---

## 📅 Past vs Future Meeting Classification

### Automatic Classification Logic
```javascript
const classifyMeetings = (meetings) => {
  const now = new Date();
  
  return meetings.reduce((acc, meeting) => {
    const scheduledDate = new Date(meeting.scheduledAt);
    const meetingEndTime = new Date(scheduledDate.getTime() + (meeting.duration * 60000));
    
    // Classification logic
    if (meeting.status === 'ended' || meeting.status === 'cancelled') {
      acc.past.push(meeting);
    } else if (meeting.status === 'active') {
      acc.current.push(meeting);
    } else if (scheduledDate <= now && meetingEndTime >= now) {
      // Meeting should be active but might not be started yet
      acc.current.push(meeting);
    } else if (scheduledDate > now) {
      acc.upcoming.push(meeting);
    } else {
      // Meeting time has passed but status is still 'waiting'
      acc.past.push(meeting);
    }
    
    return acc;
  }, { past: [], current: [], upcoming: [] });
};
```

### Time-based Status Checks
```javascript
const getMeetingTimeStatus = (meeting) => {
  const now = new Date();
  const scheduledDate = new Date(meeting.scheduledAt);
  const meetingEndTime = new Date(scheduledDate.getTime() + (meeting.duration * 60000));
  const fiveMinutesBefore = new Date(scheduledDate.getTime() - (5 * 60000));
  
  if (now < fiveMinutesBefore) {
    return 'not-ready';      // Too early to join
  } else if (now >= fiveMinutesBefore && now <= meetingEndTime) {
    return 'can-join';       // Can join the meeting
  } else {
    return 'time-passed';    // Meeting time has passed
  }
};
```

---

## 🎨 UI Display Logic

### Meeting Card Rendering
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
      {/* Header with status */}
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
      
      {/* Meeting details */}
      <h3 className="meeting-title">{meeting.title}</h3>
      {meeting.description && (
        <p className="meeting-description">{meeting.description}</p>
      )}
      
      {/* Date and time */}
      <div className="meeting-datetime">
        <div className="scheduled-time">
          <Icon name="calendar" />
          <span>{formatDate(scheduledDate)}</span>
          <span>{formatTime(scheduledDate)}</span>
          <span>({meeting.duration} min)</span>
        </div>
        
        {/* Actual times for ended meetings */}
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
      
      {/* Organizer */}
      <div className="meeting-organizer">
        <div className="organizer-avatar">
          {meeting.initiator.nombre.charAt(0)}{meeting.initiator.apellidos.charAt(0)}
        </div>
        <span>{meeting.initiator.nombre} {meeting.initiator.apellidos}</span>
      </div>
      
      {/* Action buttons */}
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

### List Filtering and Sorting
```javascript
const filterAndSortMeetings = (meetings, filters) => {
  return meetings
    .filter(meeting => {
      // Status filter
      if (filters.status && filters.status !== 'all') {
        if (filters.status !== meeting.status) return false;
      }
      
      // Time filter (past, today, upcoming)
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
      
      // Search filter
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
      // Sort by scheduled date (newest first for past, earliest first for upcoming)
      const dateA = new Date(a.scheduledAt);
      const dateB = new Date(b.scheduledAt);
      
      if (filters.timeRange === 'past') {
        return dateB.getTime() - dateA.getTime(); // Newest first
      } else {
        return dateA.getTime() - dateB.getTime(); // Earliest first
      }
    });
};
```

---

## 🚀 Meeting Actions

### 1. Creating Meetings
```javascript
const createMeeting = async (meetingData) => {
  try {
    const endpoint = meetingData.type === 'project' 
      ? `${API_BASE_URL}/calls/meetings/project`
      : `${API_BASE_URL}/calls/meetings/personal`;
    
    // Transform frontend data to API format
    const apiData = {
      title: meetingData.title,
      description: meetingData.description,
      scheduledAt: meetingData.scheduledFor, // API expects 'scheduledAt'
      duration: meetingData.duration,
      audioOnly: !meetingData.isVideoCall,  // API uses audioOnly
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
      throw new Error(errorData.message || 'Failed to create meeting');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error creating meeting:', error);
    throw error;
  }
};
```

### 2. Joining Meetings
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
      
      // Handle specific error cases
      if (errorData.message === 'call-has-ended') {
        throw new Error('Esta reunión ya ha terminado.');
      } else if (response.status === 404) {
        throw new Error('Reunión no encontrada o cancelada.');
      } else {
        throw new Error(errorData.message || 'No se pudo unir a la reunión');
      }
    }
    
    const { call, token: livekitToken } = await response.json();
    
    // Navigate to call interface or setup LiveKit connection
    return {
      callId: call.id,
      token: livekitToken,
      call: call
    };
  } catch (error) {
    console.error('Error joining meeting:', error);
    throw error;
  }
};
```

### 3. Cancelling Meetings
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
      throw new Error(errorData.message || 'Failed to cancel meeting');
    }
    
    // Meeting successfully cancelled - refresh the list
    return true;
  } catch (error) {
    console.error('Error cancelling meeting:', error);
    throw error;
  }
};
```

---

## 📊 Real-time Updates

### WebSocket Integration
```javascript
// Listen for meeting status updates via WebSocket
socket.on('meetingStatusUpdate', (data) => {
  const { meetingId, status, startedAt, endedAt } = data;
  
  // Update the meeting in your local state
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

// Listen for new meetings (when invited to others)
socket.on('newMeetingInvitation', (meeting) => {
  setMeetings(prevMeetings => [...prevMeetings, meeting]);
  
  // Show notification
  showNotification({
    title: 'Nueva reunión programada',
    message: `${meeting.initiator.nombre} te ha invitado a: ${meeting.title}`,
    type: 'info'
  });
});
```

---

## 🔧 Calendar Integration

### Calendar Event Conversion
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

### Date Navigation & Filtering
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

## 🎯 Key Implementation Points

### 1. Data Refresh Strategy
- **Auto-refresh**: Refresh meetings list when returning to the screen
- **Manual refresh**: Pull-to-refresh functionality
- **Real-time updates**: WebSocket listeners for status changes
- **Cache invalidation**: Clear cache when meetings are created/cancelled

### 2. Error Handling
- **Network errors**: Show appropriate error messages
- **API errors**: Handle specific error codes (404, 400, etc.)
- **Graceful degradation**: Show cached data when possible
- **User feedback**: Clear loading states and error notifications

### 3. Performance Optimization
- **Pagination**: Load meetings in batches for history
- **Lazy loading**: Load meeting details on demand
- **Memoization**: Cache computed status and display data
- **Debounced search**: Avoid excessive API calls during search

### 4. Status Management Best Practices
- **Client-side validation**: Check time ranges before showing join buttons
- **Status synchronization**: Keep local status in sync with server
- **Visual feedback**: Clear status indicators and loading states
- **Error recovery**: Handle temporary network issues gracefully

The system provides comprehensive meeting management with proper status handling, efficient data fetching, and clear separation between past and future meetings, making it ideal for web frontend implementation. 