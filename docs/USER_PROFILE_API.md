# User Profile API Documentation 👤

Complete user profile system with comprehensive statistics and activity tracking.

## **Endpoints Overview**

### **🔍 Profile Endpoints**
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/auth/me/profile` | Get current user's comprehensive profile | ✅ JWT |
| `GET` | `/users/:userId/profile` | Get any user's comprehensive profile | ✅ JWT |

---

## **📊 GET `/auth/me/profile`**

Get the comprehensive profile of the authenticated user.

### **Request**
```http
GET /auth/me/profile
Authorization: Bearer <jwt_token>
```

### **Response Structure**
```typescript
{
  // Basic User Information
  id: string;
  email: string;
  nombre: string;
  apellidos: string;
  fullName: string;
  status: 'online' | 'offline' | 'away' | 'busy';
  memberSince: Date;
  lastActive: Date;
  
  // Comprehensive Statistics
  stats: {
    // Project Involvement
    totalProjects: number;
    ownerProjects: number;
    adminProjects: number;
    memberProjects: number;
    
    // Task Performance
    tasksCreated: number;
    tasksAssigned: number;
    tasksCompleted: number;
    tasksPending: number;
    tasksInProgress: number;
    completionRate: number; // percentage (0-100)
    
    // Communication Activity
    messagesSent: number;
    directConversations: number;
    
    // Call Engagement
    callsParticipated: number;
    callsInitiated: number;
    
    // Networking
    invitationsSent: number;
    invitationsReceived: number;
    invitationsAccepted: number;
    invitationsPending: number;
    invitationAcceptanceRate: number; // percentage (0-100)
  };
  
  // Recent Activity Timeline (last 15 activities)
  recentActivity: Array<{
    type: 'task' | 'message' | 'call';
    action: string; // 'created', 'assigned', 'sent', 'initiated', 'joined'
    title: string;
    project?: string;
    recipient?: string; // for messages
    timestamp: Date;
    status?: string; // for tasks
  }>;
  
  // Most Active Projects (top 5)
  projects: Array<{
    id: string;
    name: string;
    role: 'owner' | 'admin' | 'member';
    taskCount: number;
    messageCount: number;
  }>;
  
  // AI-Generated Insights
  insights: {
    mostActiveProject: string | null;
    averageTasksPerProject: number;
    peakActivityType: 'communication' | 'task_management';
    collaborationScore: number; // 0-100
    leadershipScore: number; // calculated score
  };
}
```

### **Example Response**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "victor@example.com",
  "nombre": "Victor",
  "apellidos": "Fonseca",
  "fullName": "Victor Fonseca",
  "status": "online",
  "memberSince": "2024-01-15T10:30:00Z",
  "lastActive": "2024-12-20T14:25:00Z",
  
  "stats": {
    "totalProjects": 5,
    "ownerProjects": 2,
    "adminProjects": 1,
    "memberProjects": 2,
    
    "tasksCreated": 23,
    "tasksAssigned": 45,
    "tasksCompleted": 38,
    "tasksPending": 5,
    "tasksInProgress": 2,
    "completionRate": 84,
    
    "messagesSent": 127,
    "directConversations": 8,
    
    "callsParticipated": 12,
    "callsInitiated": 5,
    
    "invitationsSent": 7,
    "invitationsReceived": 3,
    "invitationsAccepted": 3,
    "invitationsPending": 0,
    "invitationAcceptanceRate": 100
  },
  
  "recentActivity": [
    {
      "type": "task",
      "action": "created",
      "title": "Implement user authentication",
      "project": "Axon Backend",
      "timestamp": "2024-12-20T13:45:00Z",
      "status": "in_progress"
    },
    {
      "type": "message",
      "action": "sent",
      "title": "Hey, can you review the profile endpoint?",
      "project": "Axon Backend",
      "recipient": "Ana García",
      "timestamp": "2024-12-20T12:30:00Z"
    },
    {
      "type": "call",
      "action": "initiated",
      "title": "Daily standup",
      "project": "Axon Backend",
      "timestamp": "2024-12-20T09:00:00Z"
    }
  ],
  
  "projects": [
    {
      "id": "proj-123",
      "name": "Axon Backend",
      "role": "owner",
      "taskCount": 15,
      "messageCount": 45
    },
    {
      "id": "proj-456",
      "name": "Mobile App",
      "role": "admin",
      "taskCount": 8,
      "messageCount": 25
    }
  ],
  
  "insights": {
    "mostActiveProject": "Axon Backend",
    "averageTasksPerProject": 5,
    "peakActivityType": "communication",
    "collaborationScore": 85,
    "leadershipScore": 72
  }
}
```

---

## **👥 GET `/users/:userId/profile`**

Get the comprehensive profile of any user (same structure as `/auth/me/profile`).

### **Request**
```http
GET /users/550e8400-e29b-41d4-a716-446655440000/profile
Authorization: Bearer <jwt_token>
```

### **Path Parameters**
- `userId` (UUID) - The ID of the user whose profile to retrieve

### **Response**
Same structure as `/auth/me/profile` but for the specified user.

---

## **📈 Data Insights Explained**

### **Completion Rate**
```
completionRate = (tasksCompleted / tasksAssigned) * 100
```

### **Collaboration Score**
```
collaborationScore = min(100, directConversations * 5 + callsParticipated * 10)
```

### **Leadership Score**
```
leadershipScore = ownerProjects * 20 + adminProjects * 10 + invitationsSent * 2
```

### **Peak Activity Type**
- `communication` - if messagesSent > tasksCreated
- `task_management` - if tasksCreated >= messagesSent

---

## **🔄 Real-time Data**

All statistics are calculated in real-time from the database:
- **Project data** from `ProjectMember` relationships
- **Task statistics** from `Task` entities with user associations
- **Message counts** from `Message` entities
- **Call participation** from `CallParticipant` entities
- **Invitation data** from `ProjectInvitation` entities

---

## **⚡ Performance**

- Uses **parallel queries** with `Promise.all()` for optimal performance
- **Indexes recommended** on frequently queried fields:
  - `tasks.createdBy`
  - `tasks.assignees`
  - `messages.sender`
  - `call_participants.user`
  - `project_invitations.invitedUser`

---

## **🚨 Error Responses**

### **User Not Found (404)**
```json
{
  "statusCode": 404,
  "message": "user-not-found",
  "error": "Not Found"
}
```

### **Invalid User ID (400)**
```json
{
  "statusCode": 400,
  "message": "invalid-user-id",
  "error": "Bad Request"
}
```

### **Unauthorized (401)**
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

---

## **💡 Usage Examples**

### **Frontend Profile Dashboard**
```typescript
const { data: profile } = await api.get('/auth/me/profile');

// Display quick stats
console.log(`${profile.stats.completionRate}% task completion rate`);
console.log(`Active in ${profile.stats.totalProjects} projects`);
console.log(`${profile.stats.messagesSent} messages sent`);

// Show recent activity
profile.recentActivity.forEach(activity => {
  console.log(`${activity.action} ${activity.type}: ${activity.title}`);
});
```

### **Team Member Lookup**
```typescript
const { data: memberProfile } = await api.get(`/users/${memberId}/profile`);

// Compare performance
if (memberProfile.stats.completionRate > 90) {
  console.log('High performer! 🌟');
}
```

---

## **🔮 Future Enhancements**

- **Time-based filtering** (last 30 days, quarter, etc.)
- **Project-specific statistics** (`/users/:id/profile/projects/:projectId`)
- **Team comparisons** and rankings
- **Activity heatmaps** and trends
- **Custom date ranges** for statistics

---

*This endpoint provides rich, actionable data for user profiles, team management, and performance analytics.* 📊✨ 