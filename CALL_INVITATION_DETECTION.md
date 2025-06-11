# Call Invitation Detection System 📞

## Overview
This document explains how the mobile app detects, handles, and processes call invitations in the chat system. The web frontend can use this as a reference to implement the same functionality.

---

## 🔍 Detection Process

### 1. Message Reception
Call invitations are detected through the WebSocket chat system when new messages arrive:

```javascript
// Listen for incoming messages via WebSocket
socket.on('newMessage', (message) => {
  // Check if this message is a call invitation
  if (isCallInvitation(message.content) && message.senderId !== currentUserId) {
    // Process the call invitation
    handleCallInvitation(message);
  }
});
```

### 2. Call Invitation Detection Function
The core detection logic uses a simple pattern matching approach:

```javascript
const isCallInvitation = (messageContent: string): boolean => {
  return messageContent.includes('📞') || 
         messageContent.toLowerCase().includes('call') || 
         messageContent.toLowerCase().includes('meeting');
};
```

**Detection Criteria:**
- Contains the 📞 emoji (primary indicator)
- Contains the word "call" (case-insensitive)
- Contains the word "meeting" (case-insensitive)

---

## 📋 Message Structure

### Call Invitation Message Format
When a call is started, the backend automatically sends a chat message with this structure:

```typescript
interface Message {
  id: string;
  content: string;          // The invitation text
  senderId: string;         // User who started the call
  senderName: string;       // Display name of caller
  callId?: string;          // UUID of the call (key for joining)
  createdAt: string;
  type: 'direct' | 'project';
  recipientId?: string;     // For direct calls
  projectId?: string;       // For project calls
  isRead: boolean;
}
```

### Content Examples
The backend generates different messages based on call type:

**Direct Audio Call:**
```
📞 Victor Fonseca ha iniciado una llamada
```

**Direct Video Call:**
```
📞 Victor Fonseca ha iniciado una videollamada
```

**Project Audio Call:**
```
📞 Victor Fonseca ha iniciado una llamada de audio
```

**Project Video Call:**
```
📞 Victor Fonseca ha iniciado una videollamada
```

---

## 🎯 Backend Endpoints Used

### 1. Starting a Call
When a user starts a call, these endpoints are called:

**Direct Call:**
```http
POST /calls/start
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "type": "direct",
  "recipientId": "user-uuid",
  "title": "Video call",
  "audioOnly": false
}
```

**Project Call:**
```http
POST /calls/start
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "type": "project", 
  "projectId": "project-uuid",
  "title": "Project meeting",
  "maxParticipants": 10,
  "audioOnly": false
}
```

**Response:**
```json
{
  "call": {
    "id": "call-uuid-here",
    "roomName": "call_direct_1642680000000_abc123",
    "type": "direct",
    "status": "waiting",
    "title": "Video call",
    "audioOnly": false,
    "initiator": {
      "id": "user-uuid",
      "nombre": "Victor",
      "apellidos": "Fonseca"
    },
    "recipient": {
      "id": "recipient-uuid", 
      "nombre": "John",
      "apellidos": "Doe"
    },
    "createdAt": "2024-01-10T10:00:00.000Z"
  },
  "token": "livekit-access-token-here"
}
```

### 2. Join Call Status Check
Before joining a call, check if it's still active:

```http
POST /calls/join/{callId}
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "audioOnly": false
}
```

**Success Response (200):**
```json
{
  "call": {
    "id": "call-uuid",
    "status": "active",
    "audioOnly": false,
    // ... other call details
  },
  "token": "livekit-access-token"
}
```

**Error Responses:**
- `404`: Call not found or ended
- `400`: Call cancelled or invalid

---

## 🔧 Call ID Extraction

### Primary Method: Message Metadata
The preferred method is using the `callId` field in the message:

```javascript
// Check if message has callId in metadata
if (message.callId) {
  console.log('Found call ID in metadata:', message.callId);
  joinCall(message.callId);
}
```

### Fallback Method: Text Parsing
If metadata is missing, extract the call ID from the message content:

```javascript
const extractCallId = (messageContent: string): string | null => {
  // Multiple UUID patterns to try
  const patterns = [
    // Standard UUID pattern
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
    // callId: pattern
    /callId[:\s]*([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/gi,
    // call/ pattern (from URLs)
    /call\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/gi,
    // Any UUID-like pattern
    /([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/gi
  ];
  
  for (const pattern of patterns) {
    const matches = messageContent.match(pattern);
    if (matches && matches.length > 0) {
      return matches[0].includes('-') ? matches[0] : matches[1];
    }
  }
  
  return null;
};
```

---

## 🎨 UI Handling

### 1. Real-time Alert
When a call invitation is detected, show an immediate alert:

```javascript
if (isCallInvitation(message.content) && message.senderId !== currentUserId) {
  const callId = message.callId || extractCallId(message.content);
  
  if (callId) {
    Alert.alert(
      'Invitación de llamada',
      message.content,
      [
        { text: 'Rechazar', style: 'cancel' },
        { 
          text: 'Unirse', 
          onPress: () => joinCallFromInvitation(callId)
        }
      ]
    );
  }
}
```

### 2. Chat Message Rendering
Call invitation messages are rendered with special UI:

```javascript
const renderCallInvitation = (message) => {
  const callId = message.callId;
  const callStatus = checkCallStatus(callId); // 'active', 'ended', 'cancelled'
  const isCallActive = callStatus === 'active';
  
  return (
    <View style={styles.callInvitationCard}>
      {/* Call Header */}
      <View style={styles.callInvitationHeader}>
        <View style={[styles.callIconContainer, { 
          backgroundColor: isCallActive ? '#4CAF50' : '#9E9E9E' 
        }]}>
          <Icon name="videocam" size={20} color="#fff" />
        </View>
        <View style={styles.callInvitationInfo}>
          <Text style={styles.callInvitationTitle}>
            {message.content}
          </Text>
          <Text style={styles.callInvitationSubtitle}>
            {callStatus === 'active' ? 'Activa' : 'Finalizada'}
          </Text>
        </View>
      </View>
      
      {/* Join Button */}
      {isCallActive && (
        <TouchableOpacity 
          style={styles.joinCallButton}
          onPress={() => joinCallFromInvitation(callId)}
        >
          <Text>Unirse</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};
```

---

## 🚀 Joining Call Process

### 1. Validate Call Status
Before joining, always check if the call is still active:

```javascript
const joinCallFromInvitation = async (callId) => {
  try {
    // Check call status
    const response = await fetch(`${API_BASE_URL}/calls/join/${callId}`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify({ audioOnly: false })
    });
    
    if (response.ok) {
      const { call, token } = await response.json();
      
      if (call.status === 'active') {
        // Navigate to call screen
        router.push(`/call/${callId}`);
      } else {
        // Call ended or cancelled
        showAlert('Call Unavailable', 'This call has ended.');
      }
    } else {
      // Handle error status codes
      if (response.status === 404 || response.status === 400) {
        showAlert('Call Unavailable', 'This call has ended or is no longer available.');
      }
    }
  } catch (error) {
    showAlert('Connection Error', 'Unable to check call status.');
  }
};
```

### 2. Navigation to Call Screen
Once validated, navigate to the video call interface:

```javascript
// Navigate with call ID
router.push(`/call/${callId}`);
```

---

## 🔄 Call Status Monitoring

### Status Caching
To avoid repeated API calls, cache call statuses:

```javascript
const [callStatuses, setCallStatuses] = useState({});

const checkCallStatus = async (callId) => {
  // Return cached status if available
  if (callStatuses[callId]) {
    return callStatuses[callId];
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/calls/join/${callId}`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify({ audioOnly: false })
    });
    
    if (response.ok) {
      const { call } = await response.json();
      setCallStatuses(prev => ({...prev, [callId]: call.status}));
      return call.status;
    } else {
      setCallStatuses(prev => ({...prev, [callId]: 'ended'}));
      return 'ended';
    }
  } catch (error) {
    setCallStatuses(prev => ({...prev, [callId]: 'unknown'}));
    return 'unknown';
  }
};
```

### Status Types
- `waiting`: Call created, waiting for participants
- `active`: Call in progress with participants  
- `ended`: Call finished normally
- `cancelled`: Call cancelled before anyone joined

---

## 📱 Web Frontend Implementation

### 1. WebSocket Connection
```javascript
import io from 'socket.io-client';

const socket = io('your-backend-url', {
  auth: {
    token: 'your-jwt-token'
  }
});

socket.on('newMessage', (message) => {
  if (isCallInvitation(message.content) && message.senderId !== currentUserId) {
    handleCallInvitation(message);
  }
});
```

### 2. Call Detection
```javascript
const isCallInvitation = (messageContent) => {
  return messageContent.includes('📞') || 
         messageContent.toLowerCase().includes('call') || 
         messageContent.toLowerCase().includes('meeting');
};
```

### 3. Browser Notification
```javascript
const handleCallInvitation = (message) => {
  // Show browser notification
  if (Notification.permission === 'granted') {
    new Notification('Incoming Call', {
      body: message.content,
      icon: '/call-icon.png',
      tag: 'call-invitation'
    });
  }
  
  // Show in-app modal
  showCallInvitationModal(message);
};
```

### 4. Call Joining
```javascript
const joinCall = async (callId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/calls/join/${callId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ audioOnly: false })
    });
    
    if (response.ok) {
      const { call, token: livekitToken } = await response.json();
      
      // Use LiveKit Web SDK to join the room
      const room = new Room();
      await room.connect('wss://your-livekit-url', livekitToken);
      
      // Navigate to call interface
      window.location.href = `/call/${callId}`;
    }
  } catch (error) {
    console.error('Failed to join call:', error);
  }
};
```

---

## 🎨 UI/UX Styling

### Call Invitation Card Colors
```css
.call-invitation-card {
  background-color: #f8f9fa;
  border: 2px solid #4CAF50; /* Green for active calls */
  border-radius: 16px;
  padding: 16px;
}

.call-invitation-card.ended {
  border-color: #9E9E9E; /* Gray for ended calls */
}

.call-icon-container {
  width: 40px;
  height: 40px;
  border-radius: 20px;
  background-color: #4CAF50; /* Green for active */
  display: flex;
  align-items: center;
  justify-content: center;
}

.call-icon-container.ended {
  background-color: #9E9E9E; /* Gray for ended */
}

.join-call-button {
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 8px 12px;
  margin-top: 12px;
  cursor: pointer;
}

.join-call-button:disabled {
  background-color: #9E9E9E;
  cursor: not-allowed;
}
```

---

## 🔧 Testing

### 1. Test Call Invitation Detection
```javascript
// Test message examples
const testMessages = [
  { content: '📞 Victor Fonseca ha iniciado una llamada', callId: 'test-call-id' },
  { content: '📞 Victor Fonseca ha iniciado una videollamada', callId: 'test-call-id' },
  { content: 'Let\'s have a call', callId: null },
  { content: 'Meeting starting now', callId: null }
];

testMessages.forEach(msg => {
  console.log(`"${msg.content}" is call invitation:`, isCallInvitation(msg.content));
});
```

### 2. Test Call ID Extraction
```javascript
const testContent = 'Join call: https://app.com/call/123e4567-e89b-12d3-a456-426614174000';
const extractedId = extractCallId(testContent);
console.log('Extracted ID:', extractedId); // Should be: 123e4567-e89b-12d3-a456-426614174000
```

---

## 🎯 Key Points for Web Frontend

1. **Listen for WebSocket messages** with call invitation patterns
2. **Check message.callId first**, fallback to text extraction
3. **Always validate call status** before joining
4. **Cache call statuses** to avoid repeated API calls
5. **Show immediate notifications** for incoming calls
6. **Use proper error handling** for network issues
7. **Implement proper UI states** (active, ended, loading)
8. **Support both audio and video** call types
9. **Handle direct and project** call contexts
10. **Provide clear user feedback** throughout the process

The system prioritizes reliability and user experience by using multiple detection methods, proper error handling, and clear visual feedback. 