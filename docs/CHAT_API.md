# Chat API Documentation 💬

## Overview
The Chat system supports both **1:1 direct messages** and **project group conversations** with real-time WebSocket messaging and database persistence.

## Features ✨
- **Real-time messaging** with WebSocket
- **Direct messages** (1:1 chat) between users
- **Project conversations** (group chat) for project members
- **Typing indicators** and online presence
- **Message editing** and deletion
- **Read receipts** and message search
- **Message history** with pagination
- **Fallback REST API** for reliability

---

## 🔌 WebSocket Connection

### Connect to Chat
```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000/chat', {
  auth: {
    token: 'your-jwt-token'
  }
});

// Connection events
socket.on('connect', () => {
  console.log('Connected to chat!');
});

socket.on('disconnect', () => {
  console.log('Disconnected from chat');
});
```

### Join Project Room
```javascript
// Join project for real-time messages
socket.emit('joinProject', { projectId: 'project-uuid' });

socket.on('joinedProject', (data) => {
  console.log('Joined project:', data.projectId);
});
```

### Send Messages
```javascript
// Send direct message
socket.emit('sendMessage', {
  content: 'Hey! How are you?',
  recipientId: 'user-uuid'
});

// Send project message
socket.emit('sendMessage', {
  content: 'Meeting at 3pm today!',
  projectId: 'project-uuid'
});

// Listen for new messages
socket.on('newMessage', (message) => {
  console.log('New message:', message);
  /*
  {
    id: 'msg-uuid',
    content: 'Hey! How are you?',
    senderId: 'sender-uuid',
    senderName: 'John Doe',
    createdAt: '2024-01-10T10:00:00.000Z',
    type: 'direct', // or 'project'
    recipientId: 'user-uuid', // for direct messages
    projectId: 'project-uuid' // for project messages
  }
  */
});

// Confirmation when your message is sent
socket.on('messageSent', (message) => {
  console.log('Message sent successfully:', message);
});
```

### Typing Indicators
```javascript
// Show typing indicator
socket.emit('typing', {
  recipientId: 'user-uuid', // for direct message
  // OR projectId: 'project-uuid', // for project message
  typing: true
});

// Stop typing indicator
socket.emit('typing', {
  recipientId: 'user-uuid',
  typing: false
});

// Listen for typing events
socket.on('typing', (data) => {
  console.log('User typing:', data);
  /*
  {
    userId: 'user-uuid',
    typing: true,
    timestamp: '2024-01-10T10:00:00.000Z',
    type: 'direct' // or 'project'
  }
  */
});
```

### Online Presence
```javascript
// Get online users
socket.emit('getOnlineUsers');

socket.on('onlineUsers', (data) => {
  console.log('Online users:', data.users);
});

// Listen for user status changes
socket.on('userOnline', (data) => {
  console.log('User went online:', data.userId);
});

socket.on('userOffline', (data) => {
  console.log('User went offline:', data.userId);
});
```

---

## 🌐 REST API Endpoints

### Get All Conversations
```http
GET /chat/conversations
Authorization: Bearer <jwt-token>
```

**Response:**
```json
[
  {
    "type": "direct",
    "partner": {
      "id": "user-uuid",
      "nombre": "John",
      "apellidos": "Doe",
      "status": "online"
    },
    "lastMessage": {
      "id": "msg-uuid",
      "content": "See you tomorrow!",
      "senderId": "user-uuid",
      "createdAt": "2024-01-10T15:30:00.000Z",
      "isRead": true
    }
  },
  {
    "type": "project",
    "project": {
      "id": "project-uuid",
      "name": "Axon Backend",
      "description": "Main backend project"
    },
    "lastMessage": {
      "id": "msg-uuid",
      "content": "Great work everyone!",
      "senderId": "user-uuid",
      "senderName": "Victor Fonseca",
      "createdAt": "2024-01-10T14:20:00.000Z",
      "isRead": false
    }
  }
]
```

### Get Direct Message History
```http
GET /chat/direct/{userId}?page=1&limit=50
Authorization: Bearer <jwt-token>
```

### Get Project Message History
```http
GET /chat/project/{projectId}?page=1&limit=50
Authorization: Bearer <jwt-token>
```

**Response (both endpoints):**
```json
[
  {
    "id": "msg-uuid-1",
    "content": "Hello everyone!",
    "sender": {
      "id": "user-uuid",
      "nombre": "Victor",
      "apellidos": "Fonseca"
    },
    "recipient": null, // for project messages
    "project": {
      "id": "project-uuid",
      "name": "Axon Backend"
    },
    "isRead": false,
    "isEdited": false,
    "createdAt": "2024-01-10T10:00:00.000Z",
    "updatedAt": "2024-01-10T10:00:00.000Z"
  }
]
```

### Create Message (REST Fallback)
```http
POST /chat/messages
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "content": "Hello from REST API!",
  "recipientId": "user-uuid" // for direct message
  // OR "projectId": "project-uuid" // for project message
}
```

### Update Message
```http
PUT /chat/messages/{messageId}
Authorization: Bearer <jwt-token>

{
  "content": "Updated message content"
}
```

### Delete Message
```http
DELETE /chat/messages/{messageId}
Authorization: Bearer <jwt-token>
```

### Mark Message as Read
```http
PUT /chat/messages/{messageId}/read
Authorization: Bearer <jwt-token>
```

### Search Messages
```http
GET /chat/search?q=hello&projectId=project-uuid&page=1&limit=20
Authorization: Bearer <jwt-token>
```

---

## 💡 Usage Examples

### Complete Chat Integration
```javascript
class ChatManager {
  constructor(token) {
    this.socket = io('http://localhost:3000/chat', {
      auth: { token }
    });
    
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Connection
    this.socket.on('connect', () => {
      console.log('🟢 Connected to chat');
      this.getOnlineUsers();
    });

    // New messages
    this.socket.on('newMessage', (message) => {
      this.displayMessage(message);
      this.playNotificationSound();
    });

    // Typing indicators
    this.socket.on('typing', (data) => {
      this.showTypingIndicator(data);
    });

    // Presence updates
    this.socket.on('userOnline', (data) => {
      this.updateUserStatus(data.userId, 'online');
    });

    this.socket.on('userOffline', (data) => {
      this.updateUserStatus(data.userId, 'offline');
    });
  }

  // Send direct message
  sendDirectMessage(recipientId, content) {
    this.socket.emit('sendMessage', {
      content,
      recipientId
    });
  }

  // Send project message
  sendProjectMessage(projectId, content) {
    this.socket.emit('sendMessage', {
      content,
      projectId
    });
  }

  // Join project room
  joinProject(projectId) {
    this.socket.emit('joinProject', { projectId });
  }

  // Show typing
  startTyping(recipientId = null, projectId = null) {
    this.socket.emit('typing', {
      recipientId,
      projectId,
      typing: true
    });
  }

  // Stop typing
  stopTyping(recipientId = null, projectId = null) {
    this.socket.emit('typing', {
      recipientId,
      projectId,
      typing: false
    });
  }

  // Get online users
  getOnlineUsers() {
    this.socket.emit('getOnlineUsers');
    
    this.socket.on('onlineUsers', (data) => {
      this.updateOnlineUsersList(data.users);
    });
  }

  displayMessage(message) {
    // Add message to chat UI
    const messageElement = document.createElement('div');
    messageElement.innerHTML = `
      <div class="message ${message.senderId === currentUserId ? 'own' : ''}">
        <div class="sender">${message.senderName}</div>
        <div class="content">${message.content}</div>
        <div class="time">${new Date(message.createdAt).toLocaleTimeString()}</div>
      </div>
    `;
    document.getElementById('chat-messages').appendChild(messageElement);
  }
}

// Initialize chat
const chat = new ChatManager(localStorage.getItem('jwt-token'));
```

### Chat Input with Typing Indicators
```javascript
const chatInput = document.getElementById('chat-input');
const sendButton = document.getElementById('send-button');
let typingTimer;
let isTyping = false;

chatInput.addEventListener('input', () => {
  // Start typing indicator
  if (!isTyping) {
    chat.startTyping(currentRecipientId, currentProjectId);
    isTyping = true;
  }

  // Reset timer
  clearTimeout(typingTimer);
  typingTimer = setTimeout(() => {
    chat.stopTyping(currentRecipientId, currentProjectId);
    isTyping = false;
  }, 1000); // Stop typing after 1 second of inactivity
});

sendButton.addEventListener('click', () => {
  const content = chatInput.value.trim();
  if (!content) return;

  // Send message
  if (currentRecipientId) {
    chat.sendDirectMessage(currentRecipientId, content);
  } else if (currentProjectId) {
    chat.sendProjectMessage(currentProjectId, content);
  }

  // Clear input and stop typing
  chatInput.value = '';
  chat.stopTyping(currentRecipientId, currentProjectId);
  isTyping = false;
});
```

### Message History Loading
```javascript
async function loadMessageHistory(type, id, page = 1) {
  const token = localStorage.getItem('jwt-token');
  const endpoint = type === 'direct' 
    ? `/chat/direct/${id}?page=${page}&limit=50`
    : `/chat/project/${id}?page=${page}&limit=50`;

  try {
    const response = await fetch(endpoint, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const messages = await response.json();
    
    // Display messages in chronological order
    messages.forEach(message => {
      displayMessage(message);
    });

    return messages;
  } catch (error) {
    console.error('Failed to load message history:', error);
  }
}
```

---

## 🔒 Security & Permissions

1. **Authentication**: All endpoints require JWT token
2. **Direct Messages**: Only sender and recipient can access
3. **Project Messages**: Only project members can access
4. **Message Editing**: Only sender can edit their messages
5. **Message Deletion**: Only sender can delete their messages
6. **WebSocket Authentication**: Token verified on connection

---

## 🎯 Integration with Existing System

### User Assignment Flow
1. Get project members from `GET /projects/{projectId}` (existing endpoint)
2. Select users to start direct conversations
3. Use project rooms for team discussions
4. Integrate with task assignments for project communication

### Notification Integration
```javascript
// Listen for task assignments and send chat notifications
socket.on('taskAssigned', (data) => {
  chat.sendDirectMessage(data.assigneeId, 
    `You've been assigned to task: ${data.taskTitle}`
  );
});

// Notify project team about task updates
socket.on('taskStatusChanged', (data) => {
  chat.sendProjectMessage(data.projectId,
    `Task "${data.taskTitle}" status changed to ${data.newStatus}`
  );
});
```

---

## 🚀 Real-time Features

- ✅ **Instant messaging** - Messages appear immediately
- ✅ **Typing indicators** - See when someone is typing
- ✅ **Online presence** - Know who's online/offline
- ✅ **Message delivery** - Confirmation when messages are sent
- ✅ **Read receipts** - Track if messages are read
- ✅ **Project rooms** - Real-time team communication
- ✅ **Message search** - Find messages across conversations
- ✅ **Message editing** - Update sent messages
- ✅ **Fallback REST** - Works even without WebSocket

Perfect for team collaboration! 🎉 