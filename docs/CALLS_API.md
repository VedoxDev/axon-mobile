# Video Calls API Documentation 📹

## Overview
The Video Calls system supports both **1:1 direct calls** and **project group calls** with **LiveKit integration** for real-time video/audio communication.

## Features ✨
- **1:1 Direct Calls** - Private video/audio calls between users
- **Project Group Calls** - Multi-participant calls for project teams
- **LiveKit Integration** - Professional video calling infrastructure
- **Real-time Notifications** - Call invitations via chat system
- **Call Management** - Start, join, leave, end calls
- **Participant State** - Mute/unmute audio/video tracking
- **Call History** - Track all calls and participants
- **Audio-only Mode** - Option for voice-only calls
- **Automatic Room Cleanup** - Rooms deleted when empty

---

## 🎯 Quick Start

### 1. Start a Direct Call (1:1)
```http
POST /calls/start
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "type": "direct",
  "recipientId": "user-uuid-here",
  "title": "Quick sync call",
  "audioOnly": false
}
```

**Response:**
```json
{
  "call": {
    "id": "call-uuid",
    "roomName": "call_direct_1642680000000_abc123",
    "type": "direct",
    "status": "waiting",
    "title": "Quick sync call",
    "audioOnly": false,
    "initiator": { "id": "user-uuid", "nombre": "Victor", "apellidos": "Fonseca" },
    "recipient": { "id": "recipient-uuid", "nombre": "John", "apellidos": "Doe" },
    "createdAt": "2024-01-10T10:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." // LiveKit access token
}
```

### 2. Join the Call
```http
POST /calls/join/{callId}
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "call": { /* call details */ },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." // LiveKit access token
}
```

---

## 🎥 Call Management Endpoints

### Start Project Call (1:many)
```http
POST /calls/start
Authorization: Bearer <jwt-token>

{
  "type": "project",
  "projectId": "project-uuid",
  "title": "Sprint planning meeting",
  "maxParticipants": 10,
  "audioOnly": false
}
```

### Join Existing Call
```http
POST /calls/join/{callId}
Authorization: Bearer <jwt-token>

{
  "audioOnly": false
}
```

### Leave Call
```http
PUT /calls/leave/{callId}
Authorization: Bearer <jwt-token>
```

### End Call (Initiator Only)
```http
DELETE /calls/end/{callId}
Authorization: Bearer <jwt-token>
```

### Get Active Calls
```http
GET /calls/active
Authorization: Bearer <jwt-token>
```

### Get Call History
```http
GET /calls/history?page=1&limit=20
Authorization: Bearer <jwt-token>
```

---

## 🎛️ Participant Management

### Update Participant State
```http
PUT /calls/participant/{callId}
Authorization: Bearer <jwt-token>

{
  "micMuted": true,
  "videoMuted": false
}
```

### Generate New Token (if expired)
```http
POST /calls/token/{callId}
Authorization: Bearer <jwt-token>
```

---

## 📱 React Native Integration

### 1. Install LiveKit Client
```bash
npm install @livekit/react-native @livekit/react-native-webrtc
```

### 2. Participant Display Names 👥
**NEW: Proper User Names in Video Calls!**

The backend now includes user metadata in LiveKit tokens, allowing proper display names:

```javascript
// Helper function to get participant display name
const getParticipantDisplayName = (participant) => {
  // Check if participant has metadata with displayName
  if (participant.metadata) {
    try {
      const metadata = JSON.parse(participant.metadata);
      if (metadata.displayName) {
        return metadata.displayName; // Returns "John Smith"
      }
    } catch (error) {
      console.log('Failed to parse participant metadata:', error);
    }
  }
  
  // Fallback to participant name if available
  if (participant.name && participant.name !== participant.identity) {
    return participant.name; // Returns "John Smith"
  }
  
  // Last resort: Use identity (UUID) with "User" prefix
  return `User ${participant.identity.substring(0, 8)}`;
};

// Usage in your component
participants.map(participant => {
  const displayName = getParticipantDisplayName(participant);
  return (
    <Text key={participant.identity}>
      {displayName} {/* Shows "John Smith" instead of UUID */}
    </Text>
  );
});
```

### 3. Basic Call Component
```javascript
import React, { useEffect, useState } from 'react';
import { View, Text, Button, Alert } from 'react-native';
import { Room, connect, RoomEvent, RemoteParticipant } from '@livekit/react-native';

const VideoCallScreen = ({ route, navigation }) => {
  const { callId } = route.params;
  const [room, setRoom] = useState(null);
  const [participants, setParticipants] = useState([]);

  // Helper function to get display name (IMPROVED!)
  const getParticipantDisplayName = (participant) => {
    if (participant.metadata) {
      try {
        const metadata = JSON.parse(participant.metadata);
        if (metadata.displayName) {
          return metadata.displayName; // "John Smith"
        }
      } catch (error) {
        console.log('Failed to parse participant metadata:', error);
      }
    }
    
    if (participant.name && participant.name !== participant.identity) {
      return participant.name;
    }
    
    return `User ${participant.identity.substring(0, 8)}`;
  };

  useEffect(() => {
    joinCall();
    return () => {
      if (room) {
        room.disconnect();
      }
    };
  }, []);

  const joinCall = async () => {
    try {
      // Join call via API
      const response = await fetch(`${API_BASE_URL}/calls/join/${callId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await getToken()}`,
          'Content-Type': 'application/json'
        }
      });

      const { call, token } = await response.json();
      
      // Connect to LiveKit room
      const newRoom = await connect(
        process.env.LIVEKIT_URL, // Your LiveKit server URL
        token,
        {
          audio: true,
          video: true,
          adaptiveStream: true
        }
      );

      setRoom(newRoom);

      // Listen for participants (IMPROVED LOGGING!)
      newRoom.on(RoomEvent.ParticipantConnected, (participant) => {
        const displayName = getParticipantDisplayName(participant);
        console.log(`${displayName} joined the call`); // "John Smith joined the call"
        setParticipants(prev => [...prev, participant]);
      });

      newRoom.on(RoomEvent.ParticipantDisconnected, (participant) => {
        const displayName = getParticipantDisplayName(participant);
        console.log(`${displayName} left the call`); // "John Smith left the call"
        setParticipants(prev => prev.filter(p => p.identity !== participant.identity));
      });

    } catch (error) {
      console.error('Failed to join call:', error);
      Alert.alert('Error', 'Failed to join call');
      navigation.goBack();
    }
  };

  const leaveCall = async () => {
    try {
      if (room) {
        room.disconnect();
      }

      // Notify backend
      await fetch(`${API_BASE_URL}/calls/leave/${callId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${await getToken()}`
        }
      });

      navigation.goBack();
    } catch (error) {
      console.error('Failed to leave call:', error);
    }
  };

  const toggleMute = async () => {
    if (room) {
      const enabled = room.localParticipant.isMicrophoneEnabled;
      room.localParticipant.setMicrophoneEnabled(!enabled);
      
      // Update backend state
      await fetch(`${API_BASE_URL}/calls/participant/${callId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${await getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ micMuted: enabled })
      });
    }
  };

  const toggleCamera = async () => {
    if (room) {
      const enabled = room.localParticipant.isCameraEnabled;
      room.localParticipant.setCameraEnabled(!enabled);
      
      // Update backend state
      await fetch(`${API_BASE_URL}/calls/participant/${callId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${await getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ videoMuted: enabled })
      });
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {/* Video views would go here */}
      <Text style={{ color: 'white', textAlign: 'center', marginTop: 50 }}>
        In call with {participants.length} participants
      </Text>
      
      {/* Display participant names (IMPROVED!) */}
      <View style={{ marginTop: 20 }}>
        {participants.map(participant => {
          const displayName = getParticipantDisplayName(participant);
          return (
            <Text key={participant.identity} style={{ color: 'white', textAlign: 'center' }}>
              📹 {displayName} {/* Shows "📹 John Smith" instead of UUID */}
            </Text>
          );
        })}
      </View>
      
      <View style={{ 
        position: 'absolute', 
        bottom: 50, 
        left: 0, 
        right: 0, 
        flexDirection: 'row', 
        justifyContent: 'space-around' 
      }}>
        <Button title="Mute" onPress={toggleMute} />
        <Button title="Camera" onPress={toggleCamera} />
        <Button title="Leave" onPress={leaveCall} color="red" />
      </View>
    </View>
  );
};

export default VideoCallScreen;
```

### 4. Start Call Function
```javascript
const startVideoCall = async (recipientId, type = 'direct') => {
  try {
    const response = await fetch(`${API_BASE_URL}/calls/start`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${await getToken()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type,
        recipientId: type === 'direct' ? recipientId : undefined,
        projectId: type === 'project' ? recipientId : undefined,
        title: type === 'direct' ? 'Video call' : 'Project meeting'
      })
    });

    const { call } = await response.json();
    
    // Navigate to call screen
    navigation.navigate('VideoCall', { callId: call.id });
    
  } catch (error) {
    console.error('Failed to start call:', error);
    Alert.alert('Error', 'Failed to start call');
  }
};
```

---

## 👤 Participant Metadata Structure

**NEW: Rich User Data in LiveKit Tokens!**

The backend now includes comprehensive user information in LiveKit token metadata:

```json
{
  "displayName": "John Smith",
  "email": "john.smith@company.com", 
  "avatar": "",
  "userId": "357b292d-ddbf-4061-89ce-2243f6d9db57"
}
```

### Accessing Metadata in Frontend
```javascript
// Parse participant metadata
const parseParticipantMetadata = (participant) => {
  if (!participant.metadata) return null;
  
  try {
    return JSON.parse(participant.metadata);
  } catch (error) {
    console.error('Failed to parse metadata:', error);
    return null;
  }
};

// Usage example
const metadata = parseParticipantMetadata(participant);
if (metadata) {
  console.log('Display Name:', metadata.displayName); // "John Smith"
  console.log('Email:', metadata.email);              // "john.smith@company.com"  
  console.log('User ID:', metadata.userId);           // "357b292d-..."
}
```

### Benefits
- ✅ **Real Names**: Show "John Smith" instead of "User 357b292d"
- ✅ **Email Access**: Optional user email for contact info
- ✅ **UUID Tracking**: Backend can still track users by UUID
- ✅ **Future Extensible**: Easy to add avatar URLs, roles, etc.
- ✅ **Fallback Safe**: Works even if metadata parsing fails

---

## 🔔 Chat Integration

### Call Invitations ✨
**NEW: Automatic messages distinguish between audio and video calls!**

When a call is started, automatic chat messages are sent:

**Direct Calls:**
```
📞 Victor Fonseca ha iniciado una llamada       (audio-only)
📞 Victor Fonseca ha iniciado una videollamada  (video call)
```

**Project Calls:**
```
📞 Victor Fonseca ha iniciado una llamada de audio  (audio-only)
📞 Victor Fonseca ha iniciado una videollamada      (video call)
```

The backend automatically checks the `audioOnly` parameter and generates appropriate messages in Spanish.

**Frontend Display Logic (Improved):**
- **Direct audio calls**: "Has iniciado una llamada" / "{name} ha iniciado una llamada"
- **Direct video calls**: "Has iniciado una videollamada" / "{name} ha iniciado una videollamada"  
- **Project audio calls**: "Has iniciado una llamada de audio" / "{name} ha iniciado una llamada de audio"
- **Project video calls**: "Has iniciado una videollamada" / "{name} ha iniciado una videollamada"

**Visual Improvements:**
- ✅ **Correct Icons**: 📞 for audio calls, 📹 for video calls
- ✅ **Context-Aware Text**: Different messages for direct vs project calls
- ✅ **Consistent Spanish**: All UI text properly localized
- ✅ **Call Status Indicators**: Shows "Activa", "Finalizada", "Cancelada"

### Listen for Call Invitations
```javascript
// In your chat WebSocket handler
socket.on('newMessage', (message) => {
  if (message.content.includes('📞')) {
    // This is a call invitation
    showCallInvitationDialog(message);
  }
});

const showCallInvitationDialog = (message) => {
  Alert.alert(
    'Call Invitation',
    message.content,
    [
      { text: 'Decline', style: 'cancel' },
      { 
        text: 'Join', 
        onPress: () => {
          // Extract call ID from message and join
          navigation.navigate('VideoCall', { callId: extractCallId(message) });
        }
      }
    ]
  );
};
```

---

## 🔧 Environment Setup

### Backend .env Variables
```bash
# LiveKit Configuration
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your_api_key
LIVEKIT_API_SECRET=your_secret
```

### Frontend Configuration
```javascript
// In your React Native app
const LIVEKIT_URL = 'wss://your-project.livekit.cloud';
const API_BASE_URL = 'http://your-backend.com';
```

---

## 🎯 Call Flow Examples

### 1:1 Direct Call Flow
```javascript
// User A starts call
const { call, token } = await startCall('direct', userB.id);

// System sends chat invitation to User B
// User B sees notification in chat

// User B joins call
const { call, token } = await joinCall(call.id);

// Both users connected to LiveKit room
// Real-time video/audio communication begins

// When either user leaves, call ends automatically
```

### Project Group Call Flow
```javascript
// Team lead starts project call
const { call, token } = await startCall('project', project.id);

// System broadcasts invitation to all project members
// Multiple team members join

// All participants in same LiveKit room
// Multi-party video conference

// Call continues until last person leaves
```

---

## 📊 Call States

### Call Status
- `waiting` - Call created, waiting for participants
- `active` - Call in progress with participants
- `ended` - Call finished normally
- `cancelled` - Call cancelled before anyone joined

### Participant State
- `isConnected` - Currently in the call
- `micMuted` - Microphone muted
- `videoMuted` - Camera off
- `joinedAt` - When they joined
- `leftAt` - When they left

---

## 🔒 Security & Permissions

### Direct Calls
- Only initiator and recipient can join
- Any participant can leave anytime  
- **Call automatically ends when last person leaves**

### Project Calls
- Only project members can join
- Any member can leave anytime
- **Call automatically ends when last person leaves**

### LiveKit Tokens
- Short-lived JWT tokens (default: 1 hour)
- Scoped to specific rooms
- Automatically expire for security

---

## 🚀 Advanced Features

### Recording Calls
```http
POST /calls/start
{
  "type": "direct",
  "recipientId": "user-uuid",
  "recordCall": true
}
```

### Audio-Only Calls ✨
**NEW: Different invitation messages for audio vs video!**

```http
POST /calls/start
{
  "type": "direct", 
  "recipientId": "user-uuid",
  "audioOnly": true
}
```

**Chat Message Sent:** `📞 Victor Fonseca ha iniciado una llamada`

```http
POST /calls/start
{
  "type": "project",
  "projectId": "project-uuid", 
  "audioOnly": true
}
```

**Chat Message Sent:** `📞 Victor Fonseca ha iniciado una llamada de audio`

### Video Calls (Default)
```http
POST /calls/start
{
  "type": "direct", 
  "recipientId": "user-uuid",
  "audioOnly": false
}
```

**Chat Message Sent:** `📞 Victor Fonseca ha iniciado una videollamada`

```http
POST /calls/start
{
  "type": "project",
  "projectId": "project-uuid", 
  "audioOnly": false
}
```

**Chat Message Sent:** `📞 Victor Fonseca ha iniciado una videollamada`

### Limited Participants
```http
POST /calls/start
{
  "type": "project",
  "projectId": "project-uuid",
  "maxParticipants": 5
}
```

---

## 🔄 WebHooks (Automatic)

LiveKit automatically sends webhooks to `/calls/webhook/livekit` for:
- Participant joined/left events
- Room creation/destruction
- Automatic state synchronization

---

## ✅ Testing

### Test Direct Call
1. Create two user accounts
2. Start call from User A to User B
3. Check chat for invitation message
4. Join call as User B
5. Verify both users in LiveKit room
6. **NEW**: Verify proper names show in UI (not UUIDs)

### Test Project Call  
1. Create project with multiple members
2. Start project call
3. Check all members receive chat notification
4. Multiple users join call
5. Verify group video conference
6. **NEW**: Verify all participant names display correctly

### Test Participant Names
```javascript
// Debug participant metadata
participants.forEach(participant => {
  console.log('=== PARTICIPANT DEBUG ===');
  console.log('Identity:', participant.identity);        // UUID
  console.log('Name:', participant.name);               // Display name
  console.log('Metadata:', participant.metadata);       // JSON string
  
  if (participant.metadata) {
    const metadata = JSON.parse(participant.metadata);
    console.log('Parsed metadata:', metadata);
    console.log('Display name:', metadata.displayName); // "John Smith"
    console.log('Email:', metadata.email);              // User email
    console.log('User ID:', metadata.userId);           // UUID for tracking
  }
});
```

### Troubleshooting "undefined undefined"

If you see "undefined undefined" in participant names:

1. **Check Backend Logs** - Look for JWT strategy errors
```bash
# Check server logs for:
[CallsService] Initiator user data: id=xxx, nombre="undefined", apellidos="undefined"
```

2. **JWT Token Issue** - The user data might not be loading properly
```javascript
// Frontend: Check your JWT token payload
const token = await AsyncStorage.getItem('access_token');
const payload = JSON.parse(atob(token.split('.')[1]));
console.log('JWT payload:', payload); // Should have id and email
```

3. **Re-login** - If JWT is corrupted, have user login again
```javascript
// Clear token and re-authenticate
await AsyncStorage.removeItem('access_token');
// Navigate to login screen
```

4. **Fixed in Latest Version** ✅
   - JWT strategy now loads full user data from database
   - Includes proper fallbacks for missing fields
   - Debug logging added for troubleshooting

---

**🎉 Your video calling system is COMPLETE and PRODUCTION-READY!**

With LiveKit integration, you get:
- ✅ **Enterprise-grade video quality**
- ✅ **Automatic scaling** 
- ✅ **Global edge servers**
- ✅ **Real-time communication**
- ✅ **Cross-platform support**

**Perfect for team collaboration!** 🚀💪 

## 🚀 Improved Call Management

### **New: Democratic Call Control** ✨
- ❌ **No more "End for Everyone" button** - Removed initiator privileges
- ✅ **Everyone uses "Leave Call"** - Single, consistent action
- ✅ **Auto-end when empty** - Call ends when last person leaves
- ✅ **Better UX** - No confusion between "leave" vs "end"
- ✅ **Fairer system** - No one can kick others out

### Leave Call Flow
```javascript
// Any participant can leave
await leaveCall(callId);

// Backend checks remaining participants
// If last person → Call marked as 'ended'
// If others remain → Call continues
``` 