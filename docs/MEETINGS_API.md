# Meetings API Documentation 📅

Complete meeting scheduling system with project and personal meetings using your existing LiveKit video infrastructure.

## **Endpoints Overview**

### **🎯 Meeting Endpoints**
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/calls/meetings/project` | Schedule a project meeting | ✅ JWT |
| `POST` | `/calls/meetings/personal` | Schedule a personal meeting | ✅ JWT |
| `GET` | `/calls/meetings/my` | Get user's upcoming meetings | ✅ JWT |
| `GET` | `/calls/meetings/project/:projectId` | Get project meetings | ✅ JWT |
| `GET` | `/calls/meetings/project/:projectId/history` | Get complete project meeting history | ✅ JWT |
| `GET` | `/calls/meetings/:meetingId` | Get meeting details | ✅ JWT |
| `DELETE` | `/calls/meetings/:meetingId` | Cancel meeting | ✅ JWT |
| `POST` | `/calls/join/:meetingId` | Join scheduled meeting | ✅ JWT |

---

## **🏢 POST `/calls/meetings/project`**

Schedule a meeting for project members. All project members can join.

### **Request**
```http
POST /calls/meetings/project
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "title": "Daily Standup",
  "scheduledAt": "2024-12-21T10:00:00.000Z",
  "projectId": "550e8400-e29b-41d4-a716-446655440000",
  "description": "Review yesterday's progress and plan today's tasks",
  "duration": 30,
  "audioOnly": false,
  "recordCall": false
}
```

### **Required Fields**
```typescript
{
  title: string;        // Meeting title
  scheduledAt: string;  // ISO date string (must be future)
  projectId: string;    // UUID of the project
}
```

### **Optional Fields**
```typescript
{
  description?: string;  // Meeting agenda/description
  duration?: number;     // Duration in minutes (15-480, default: 60)
  audioOnly?: boolean;   // Audio-only meeting (default: false)
  recordCall?: boolean;  // Record the meeting (default: false)
}
```

### **Response**
```json
{
  "id": "meeting-uuid",
  "roomName": "meeting_proj123_1703155200000_abc123",
  "type": "project",
  "status": "waiting",
  "title": "Daily Standup",
  "scheduledAt": "2024-12-21T10:00:00.000Z",
  "isScheduledMeeting": true,
  "description": "Review yesterday's progress and plan today's tasks",
  "duration": 30,
  "audioOnly": false,
  "recordCall": false,
  "meetingType": "project_meeting",
  "initiator": {
    "id": "user-uuid",
    "nombre": "Victor",
    "apellidos": "Fonseca",
    "email": "victor@example.com"
  },
  "project": {
    "id": "project-uuid",
    "name": "Axon Backend Development"
  },
  "createdAt": "2024-12-20T15:30:00.000Z"
}
```

### **Validation Rules**
- ✅ User must be a project member
- ✅ Scheduled time must be in the future
- ✅ Duration: 15-480 minutes (15 min to 8 hours)
- ✅ Project must exist

---

## **👤 POST `/calls/meetings/personal`**

Schedule a personal meeting by inviting specific users by email.

### **Request**
```http
POST /calls/meetings/personal
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "title": "Client Review Meeting",
  "scheduledAt": "2024-12-21T14:00:00.000Z",
  "participantEmails": ["client@company.com", "colleague@example.com"],
  "description": "Present Q4 results and discuss next quarter goals",
  "duration": 90,
  "audioOnly": false,
  "recordCall": true
}
```

### **Required Fields**
```typescript
{
  title: string;              // Meeting title
  scheduledAt: string;        // ISO date string (must be future)
  participantEmails: string[]; // Array of email addresses to invite
}
```

### **Optional Fields**
```typescript
{
  description?: string;  // Meeting agenda/description
  duration?: number;     // Duration in minutes (15-480, default: 60)
  audioOnly?: boolean;   // Audio-only meeting (default: false)
  recordCall?: boolean;  // Record the meeting (default: false)
}
```

### **Response**
```json
{
  "id": "meeting-uuid",
  "roomName": "personal_meeting_1703160000000_xyz789",
  "type": "direct",
  "status": "waiting",
  "title": "Client Review Meeting",
  "scheduledAt": "2024-12-21T14:00:00.000Z",
  "isScheduledMeeting": true,
  "description": "Present Q4 results and discuss next quarter goals",
  "duration": 90,
  "audioOnly": false,
  "recordCall": true,
  "meetingType": "personal_meeting",
  "initiator": {
    "id": "user-uuid",
    "nombre": "Victor",
    "apellidos": "Fonseca",
    "email": "victor@example.com"
  },
  "participants": [
    {
      "user": {
        "id": "participant1-uuid",
        "nombre": "John",
        "apellidos": "Doe",
        "email": "client@company.com"
      },
      "isConnected": false
    }
  ],
  "createdAt": "2024-12-20T15:30:00.000Z"
}
```

### **Validation Rules**
- ✅ Scheduled time must be in the future
- ✅ At least one valid participant email required
- ✅ Participant emails must exist in the system
- ✅ Duration: 15-480 minutes

---

## **📋 GET `/calls/meetings/my`**

Get all upcoming meetings for the authenticated user (both project and personal).

### **Request**
```http
GET /calls/meetings/my
Authorization: Bearer <jwt_token>
```

### **Response**
```json
[
  {
    "id": "meeting1-uuid",
    "title": "Daily Standup",
    "scheduledAt": "2024-12-21T10:00:00.000Z",
    "duration": 30,
    "meetingType": "project_meeting",
    "description": "Review progress",
    "project": {
      "id": "project-uuid",
      "name": "Axon Backend"
    },
    "initiator": {
      "id": "user-uuid",
      "nombre": "Victor",
      "apellidos": "Fonseca"
    }
  },
  {
    "id": "meeting2-uuid",
    "title": "Client Review",
    "scheduledAt": "2024-12-21T14:00:00.000Z",
    "duration": 90,
    "meetingType": "personal_meeting",
    "description": "Present results",
    "participants": [
      {
        "user": {
          "id": "client-uuid",
          "nombre": "John",
          "apellidos": "Client"
        }
      }
    ]
  }
]
```

---

## **🏢 GET `/calls/meetings/project/:projectId`**

Get all upcoming meetings for a specific project.

### **Request**
```http
GET /calls/meetings/project/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <jwt_token>
```

### **Path Parameters**
- `projectId` (UUID) - The ID of the project

### **Response**
Same structure as `/calls/meetings/my` but filtered for the specific project.

### **Validation Rules**
- ✅ User must be a project member
- ✅ Project must exist

---

## **📚 GET `/calls/meetings/project/:projectId/history`**

Get complete meeting history for a specific project (both past and future meetings).

### **Request**
```http
GET /calls/meetings/project/550e8400-e29b-41d4-a716-446655440000/history
Authorization: Bearer <jwt_token>
```

### **Path Parameters**
- `projectId` (UUID) - The ID of the project

### **Response**
```json
[
  {
    "id": "meeting1-uuid",
    "title": "Sprint Planning Q4",
    "scheduledAt": "2024-12-15T09:00:00.000Z",
    "duration": 90,
    "status": "ended",
    "meetingType": "project_meeting",
    "description": "Plan sprint for Q4 deliverables",
    "project": {
      "id": "project-uuid",
      "name": "Axon Backend"
    },
    "initiator": {
      "id": "user-uuid",
      "nombre": "Victor",
      "apellidos": "Fonseca"
    },
    "startedAt": "2024-12-15T09:02:00.000Z",
    "endedAt": "2024-12-15T10:35:00.000Z"
  },
  {
    "id": "meeting2-uuid", 
    "title": "Daily Standup",
    "scheduledAt": "2024-12-21T10:00:00.000Z",
    "duration": 30,
    "status": "waiting",
    "meetingType": "project_meeting",
    "description": "Review yesterday's progress",
    "project": {
      "id": "project-uuid",
      "name": "Axon Backend"
    },
    "initiator": {
      "id": "user-uuid",
      "nombre": "Victor", 
      "apellidos": "Fonseca"
    }
  }
]
```

### **Key Differences from `/meetings/project/:projectId`**
- ✅ **Complete History**: Returns ALL meetings (past, present, future)
- ✅ **Chronological Order**: Most recent meetings first (DESC)
- ✅ **Meeting Status**: Shows actual meeting status (waiting, active, ended)
- ✅ **Runtime Data**: Includes startedAt/endedAt for completed meetings
- ✅ **Frontend Solution**: Solves the issue of mixed project meetings

### **Validation Rules**
- ✅ User must be a project member
- ✅ Project must exist
- ✅ Excludes cancelled meetings only

### **Frontend Usage**
```typescript
// ✅ Use THIS endpoint for project meeting calendar/history
const { data: projectMeetings } = await api.get(`/calls/meetings/project/${projectId}/history`);

// 🚫 Instead of mixing general history with project filter
// const { data: allMeetings } = await api.get('/calls/history'); 
// const projectMeetings = allMeetings.filter(meeting => meeting.projectId === projectId);
```

---

## **📄 GET `/calls/meetings/:meetingId`**

Get detailed information about a specific meeting.

### **Request**
```http
GET /calls/meetings/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <jwt_token>
```

### **Response**
Complete meeting details with all participants and project information.

### **Access Rules**
- ✅ Meeting organizer can access
- ✅ Project members can access project meetings
- ✅ Invited participants can access personal meetings

---

## **❌ DELETE `/calls/meetings/:meetingId`**

Cancel a scheduled meeting. Only the organizer can cancel.

### **Request**
```http
DELETE /calls/meetings/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <jwt_token>
```

### **Response**
```json
{
  "message": "meeting-cancelled-successfully"
}
```

### **Validation Rules**
- ✅ Only meeting organizer can cancel
- ✅ Cannot cancel active or ended meetings
- ✅ Cannot cancel already cancelled meetings

---

## **🎥 POST `/calls/join/:meetingId`**

Join a scheduled meeting (uses existing join call endpoint).

### **Request**
```http
POST /calls/join/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "audioOnly": false
}
```

### **Response**
```json
{
  "call": {
    "id": "meeting-uuid",
    "roomName": "meeting_proj123_1703155200000_abc123",
    "status": "active",
    "title": "Daily Standup",
    "scheduledAt": "2024-12-21T10:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." // LiveKit access token
}
```

### **Join Rules**
- ✅ **Project meetings**: All project members can join
- ✅ **Personal meetings**: Only invited participants can join
- ✅ **Time window**: Can join 5 minutes before scheduled time
- ✅ **Same video system**: Uses your existing LiveKit interface

---

## **📅 Calendar Integration**

### **Frontend Calendar Usage**
```typescript
// Fetch user's meetings for calendar
const { data: meetings } = await api.get('/calls/meetings/my');

// Transform for calendar component
const calendarEvents = meetings.map(meeting => ({
  id: meeting.id,
  title: meeting.title,
  start: new Date(meeting.scheduledAt),
  end: new Date(new Date(meeting.scheduledAt).getTime() + meeting.duration * 60000),
  resource: meeting
}));

// Handle calendar event click
const handleEventClick = async (meeting) => {
  const now = new Date();
  const meetingTime = new Date(meeting.scheduledAt);
  const canJoin = now >= new Date(meetingTime.getTime() - 5*60*1000); // 5 min before
  
  if (canJoin) {
    // Join meeting using existing flow
    const response = await api.post(`/calls/join/${meeting.id}`);
    // Navigate to existing video call screen
    navigation.navigate('VideoCall', { 
      callId: meeting.id, 
      token: response.data.token 
    });
  } else {
    // Show meeting details
    showMeetingDetails(meeting);
  }
};
```

---

## **🚨 Error Responses**

### **Meeting Not Found (404)**
```json
{
  "statusCode": 404,
  "message": "meeting-not-found",
  "error": "Not Found"
}
```

### **Invalid Project (404)**
```json
{
  "statusCode": 404,
  "message": "project-not-found",
  "error": "Not Found"
}
```

### **Permission Denied (403)**
```json
{
  "statusCode": 403,
  "message": "not-project-member",
  "error": "Forbidden"
}
```

### **Invalid Time (400)**
```json
{
  "statusCode": 400,
  "message": "meeting-time-must-be-future",
  "error": "Bad Request"
}
```

### **Validation Error (400)**
```json
{
  "statusCode": 400,
  "message": [
    "title should not be empty",
    "scheduledAt must be a valid ISO 8601 date string",
    "duration must not be less than 15"
  ],
  "error": "Bad Request"
}
```

---

## **📝 Form Examples**

### **Project Meeting Form**
```html
<form onSubmit={scheduleProjectMeeting}>
  <!-- Project Selection -->
  <select name="projectId" required>
    <option value="">Select Project</option>
    <option value="proj-123">Axon Backend</option>
    <option value="proj-456">Mobile App</option>
  </select>
  
  <!-- Meeting Details -->
  <input 
    name="title" 
    placeholder="Meeting Title" 
    required 
  />
  
  <input 
    name="scheduledAt" 
    type="datetime-local" 
    required 
  />
  
  <select name="duration">
    <option value={30}>30 minutes</option>
    <option value={60}>1 hour</option>
    <option value={90}>1.5 hours</option>
    <option value={120}>2 hours</option>
  </select>
  
  <textarea 
    name="description" 
    placeholder="Meeting agenda (optional)"
  ></textarea>
  
  <label>
    <input name="audioOnly" type="checkbox" />
    Audio only (no video)
  </label>
  
  <button type="submit">📅 Schedule Project Meeting</button>
  <p>ℹ️ All project members will be able to join</p>
</form>
```

### **Personal Meeting Form**
```html
<form onSubmit={schedulePersonalMeeting}>
  <input 
    name="title" 
    placeholder="Meeting Title" 
    required 
  />
  
  <input 
    name="scheduledAt" 
    type="datetime-local" 
    required 
  />
  
  <input 
    name="participantEmails" 
    placeholder="Invite emails (comma separated)" 
    required 
  />
  
  <select name="duration">
    <option value={30}>30 minutes</option>
    <option value={60}>1 hour</option>
    <option value={90}>1.5 hours</option>
    <option value={120}>2 hours</option>
  </select>
  
  <textarea 
    name="description" 
    placeholder="Meeting agenda (optional)"
  ></textarea>
  
  <button type="submit">📅 Schedule Personal Meeting</button>
  <p>ℹ️ Only invited people will be able to join</p>
</form>
```

---

## **⚡ Key Features**

### **✅ Seamless Integration**
- Uses your existing LiveKit video system
- Same video call interface and controls
- Unified call history and management

### **✅ Two Meeting Types**
- **Project meetings**: Auto-invite all project members
- **Personal meetings**: Invite specific users by email

### **✅ Smart Permissions**
- Project membership determines access
- Only organizers can cancel meetings
- Join window opens 5 minutes early

### **✅ Calendar Ready**
- Returns ISO dates for easy calendar integration
- Duration field for proper time blocking
- Future enhancement: External guest invitations

---

## **🔮 Future Enhancements**

- **Email notifications** for meeting invitations
- **Reminder system** (15 min, 5 min before)
- **Recurring meetings** (daily, weekly, monthly)
- **External guest invitations** (join with code, no account needed)
- **Meeting templates** for common meeting types
- **Integration with external calendars** (Google, Outlook)

---

*This system provides comprehensive meeting scheduling while leveraging your existing video infrastructure!* 🎥✨
