# Documentación de API de Videollamadas 📹

## Resumen
El sistema de Videollamadas soporta tanto **llamadas directas 1:1** como **llamadas grupales de proyecto** con **integración de LiveKit** para comunicación de video/audio en tiempo real.

## Características ✨
- **Llamadas Directas 1:1** - Llamadas privadas de video/audio entre usuarios
- **Llamadas Grupales de Proyecto** - Llamadas de múltiples participantes para equipos de proyecto
- **Integración LiveKit** - Infraestructura profesional de videollamadas
- **Notificaciones en Tiempo Real** - Invitaciones de llamada vía sistema de chat
- **Gestión de Llamadas** - Iniciar, unirse, salir, finalizar llamadas
- **Estado del Participante** - Seguimiento de silenciar/activar audio/video
- **Historial de Llamadas** - Rastrear todas las llamadas y participantes
- **Modo Solo Audio** - Opción para llamadas solo de voz
- **Limpieza Automática de Salas** - Salas eliminadas cuando están vacías

---

## 🎯 Inicio Rápido

### 1. Iniciar una Llamada Directa (1:1)
```http
POST /calls/start
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "type": "direct",
  "recipientId": "user-uuid-here",
  "title": "Llamada de sincronización rápida",
  "audioOnly": false
}
```

**Respuesta:**
```json
{
  "call": {
    "id": "call-uuid",
    "roomName": "call_direct_1642680000000_abc123",
    "type": "direct",
    "status": "waiting",
    "title": "Llamada de sincronización rápida",
    "audioOnly": false,
    "initiator": { "id": "user-uuid", "nombre": "Victor", "apellidos": "Fonseca" },
    "recipient": { "id": "recipient-uuid", "nombre": "John", "apellidos": "Doe" },
    "createdAt": "2024-01-10T10:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." // Token de acceso LiveKit
}
```

### 2. Unirse a la Llamada
```http
POST /calls/join/{callId}
Authorization: Bearer <jwt-token>
```

**Respuesta:**
```json
{
  "call": { /* detalles de la llamada */ },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." // Token de acceso LiveKit
}
```

---

## 🎥 Endpoints de Gestión de Llamadas

### Iniciar Llamada de Proyecto (1:muchos)
```http
POST /calls/start
Authorization: Bearer <jwt-token>

{
  "type": "project",
  "projectId": "project-uuid",
  "title": "Reunión de planificación de sprint",
  "maxParticipants": 10,
  "audioOnly": false
}
```

### Unirse a Llamada Existente
```http
POST /calls/join/{callId}
Authorization: Bearer <jwt-token>

{
  "audioOnly": false
}
```

### Salir de la Llamada
```http
PUT /calls/leave/{callId}
Authorization: Bearer <jwt-token>
```

### Finalizar Llamada (Solo Iniciador)
```http
DELETE /calls/end/{callId}
Authorization: Bearer <jwt-token>
```

### Obtener Llamadas Activas
```http
GET /calls/active
Authorization: Bearer <jwt-token>
```

### Obtener Historial de Llamadas
```http
GET /calls/history?page=1&limit=20
Authorization: Bearer <jwt-token>
```

---

## 🎛️ Gestión de Participantes

### Actualizar Estado del Participante
```http
PUT /calls/participant/{callId}
Authorization: Bearer <jwt-token>

{
  "micMuted": true,
  "videoMuted": false
}
```

### Generar Nuevo Token (si expiró)
```http
POST /calls/token/{callId}
Authorization: Bearer <jwt-token>
```

---

## 📱 Integración React Native

### 1. Instalar Cliente LiveKit
```bash
npm install @livekit/react-native @livekit/react-native-webrtc
```

### 2. Nombres de Visualización de Participantes 👥
**NUEVO: ¡Nombres de Usuario Apropiados en Videollamadas!**

El backend ahora incluye metadatos de usuario en tokens LiveKit, permitiendo nombres de visualización apropiados:

```javascript
// Función auxiliar para obtener nombre de visualización del participante
const getParticipantDisplayName = (participant) => {
  // Verificar si el participante tiene metadatos con displayName
  if (participant.metadata) {
    try {
      const metadata = JSON.parse(participant.metadata);
      if (metadata.displayName) {
        return metadata.displayName; // Retorna "John Smith"
      }
    } catch (error) {
      console.log('Error al analizar metadatos del participante:', error);
    }
  }
  
  // Alternativa al nombre del participante si está disponible
  if (participant.name && participant.name !== participant.identity) {
    return participant.name; // Retorna "John Smith"
  }
  
  // Último recurso: Usar identidad (UUID) con prefijo "Usuario"
  return `Usuario ${participant.identity.substring(0, 8)}`;
};

// Uso en tu componente
participants.map(participant => {
  const displayName = getParticipantDisplayName(participant);
  return (
    <Text key={participant.identity}>
      {displayName} {/* Muestra "John Smith" en lugar de UUID */}
    </Text>
  );
});
```

### 3. Componente de Llamada Básico
```javascript
import React, { useEffect, useState } from 'react';
import { View, Text, Button, Alert } from 'react-native';
import { Room, connect, RoomEvent, RemoteParticipant } from '@livekit/react-native';

const VideoCallScreen = ({ route, navigation }) => {
  const { callId } = route.params;
  const [room, setRoom] = useState(null);
  const [participants, setParticipants] = useState([]);

  // Función auxiliar para obtener nombre de visualización (¡MEJORADA!)
  const getParticipantDisplayName = (participant) => {
    if (participant.metadata) {
      try {
        const metadata = JSON.parse(participant.metadata);
        if (metadata.displayName) {
          return metadata.displayName; // "John Smith"
        }
      } catch (error) {
        console.log('Error al analizar metadatos del participante:', error);
      }
    }
    
    if (participant.name && participant.name !== participant.identity) {
      return participant.name;
    }
    
    return `Usuario ${participant.identity.substring(0, 8)}`;
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
      // Unirse a llamada vía API
      const response = await fetch(`${API_BASE_URL}/calls/join/${callId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await getToken()}`,
          'Content-Type': 'application/json'
        }
      });

      const { call, token } = await response.json();
      
      // Conectar a sala LiveKit
      const newRoom = await connect(
        process.env.LIVEKIT_URL, // URL de tu servidor LiveKit
        token,
        {
          audio: true,
          video: true,
          adaptiveStream: true
        }
      );

      setRoom(newRoom);

      // Eventos de la sala
      newRoom.on(RoomEvent.ParticipantConnected, (participant) => {
        console.log('Participante conectado:', getParticipantDisplayName(participant));
        setParticipants(prev => [...prev, participant]);
      });

      newRoom.on(RoomEvent.ParticipantDisconnected, (participant) => {
        console.log('Participante desconectado:', getParticipantDisplayName(participant));
        setParticipants(prev => prev.filter(p => p.identity !== participant.identity));
      });

      // Obtener participantes existentes
      const existingParticipants = Array.from(newRoom.participants.values());
      setParticipants(existingParticipants);

    } catch (error) {
      console.error('Error al unirse a la llamada:', error);
      Alert.alert('Error', 'No se pudo unir a la llamada');
    }
  };

  const leaveCall = async () => {
    try {
      if (room) {
        room.disconnect();
        setRoom(null);
      }

      // Notificar al servidor
      await fetch(`${API_BASE_URL}/calls/leave/${callId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${await getToken()}`
        }
      });

      navigation.goBack();
    } catch (error) {
      console.error('Error al salir de la llamada:', error);
      navigation.goBack(); // Volver de todos modos
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <Text style={{ color: 'white', textAlign: 'center', padding: 20 }}>
        Llamada en Progreso
      </Text>
      
      {/* Lista de participantes */}
      <View style={{ flex: 1 }}>
        {participants.map(participant => (
          <Text key={participant.identity} style={{ color: 'white', padding: 10 }}>
            {getParticipantDisplayName(participant)}
          </Text>
        ))}
      </View>

      {/* Controles de llamada */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-around', padding: 20 }}>
        <Button
          title="Silenciar"
          onPress={() => {
            if (room?.localParticipant) {
              room.localParticipant.setMicrophoneEnabled(false);
            }
          }}
        />
        <Button
          title="Colgar"
          color="red"
          onPress={leaveCall}
        />
      </View>
    </View>
  );
};

export default VideoCallScreen;
```

### 4. Servicio de Llamadas
```javascript
class CallService {
  constructor() {
    this.baseURL = process.env.API_BASE_URL;
  }

  async startDirectCall(recipientId, title = 'Llamada Directa', audioOnly = false) {
    try {
      const response = await fetch(`${this.baseURL}/calls/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await this.getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'direct',
          recipientId,
          title,
          audioOnly
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al iniciar llamada');
      }

      return await response.json();
    } catch (error) {
      console.error('Error iniciando llamada directa:', error);
      throw error;
    }
  }

  async startProjectCall(projectId, title, maxParticipants = 10, audioOnly = false) {
    try {
      const response = await fetch(`${this.baseURL}/calls/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await this.getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'project',
          projectId,
          title,
          maxParticipants,
          audioOnly
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al iniciar llamada de proyecto');
      }

      return await response.json();
    } catch (error) {
      console.error('Error iniciando llamada de proyecto:', error);
      throw error;
    }
  }

  async joinCall(callId, audioOnly = false) {
    try {
      const response = await fetch(`${this.baseURL}/calls/join/${callId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await this.getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ audioOnly })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al unirse a la llamada');
      }

      return await response.json();
    } catch (error) {
      console.error('Error uniéndose a la llamada:', error);
      throw error;
    }
  }

  async leaveCall(callId) {
    try {
      const response = await fetch(`${this.baseURL}/calls/leave/${callId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${await this.getToken()}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al salir de la llamada');
      }

      return await response.json();
    } catch (error) {
      console.error('Error saliendo de la llamada:', error);
      throw error;
    }
  }

  async endCall(callId) {
    try {
      const response = await fetch(`${this.baseURL}/calls/end/${callId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${await this.getToken()}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al finalizar llamada');
      }

      return await response.json();
    } catch (error) {
      console.error('Error finalizando llamada:', error);
      throw error;
    }
  }

  async getActiveCalls() {
    try {
      const response = await fetch(`${this.baseURL}/calls/active`, {
        headers: {
          'Authorization': `Bearer ${await this.getToken()}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al obtener llamadas activas');
      }

      return await response.json();
    } catch (error) {
      console.error('Error obteniendo llamadas activas:', error);
      throw error;
    }
  }

  async getCallHistory(page = 1, limit = 20) {
    try {
      const response = await fetch(`${this.baseURL}/calls/history?page=${page}&limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${await this.getToken()}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al obtener historial de llamadas');
      }

      return await response.json();
    } catch (error) {
      console.error('Error obteniendo historial de llamadas:', error);
      throw error;
    }
  }

  async getToken() {
    // Implementar según tu método de almacenamiento de tokens
    return await AsyncStorage.getItem('access_token');
  }
}

export default new CallService();
```

---

## ❌ Respuestas de Error

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": ["type-required", "recipient-or-project-required"],
  "error": "Bad Request"
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "insufficient-permissions"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "call-not-found"
}
```

### 409 Conflict
```json
{
  "statusCode": 409,
  "message": "user-already-in-call"
}
```

---

## 🎯 Casos de Uso Comunes

### 1. Gestión de Invitaciones de Llamada
```javascript
class CallInvitationManager {
  constructor() {
    this.pendingInvitations = new Map();
  }

  async sendCallInvitation(recipientId, callData) {
    try {
      // Iniciar llamada
      const { call, token } = await CallService.startDirectCall(
        recipientId, 
        callData.title, 
        callData.audioOnly
      );

      // Almacenar invitación pendiente
      this.pendingInvitations.set(call.id, {
        ...call,
        token,
        timestamp: Date.now()
      });

      // Mostrar interfaz de llamada saliente
      this.showOutgoingCallUI(call);

      return call;
    } catch (error) {
      Alert.alert('Error', 'No se pudo iniciar la llamada');
      throw error;
    }
  }

  handleIncomingCall(callData) {
    // Mostrar interfaz de llamada entrante
    Alert.alert(
      'Llamada Entrante',
      `${callData.initiator.nombre} ${callData.initiator.apellidos} te está llamando`,
      [
        {
          text: 'Rechazar',
          style: 'cancel',
          onPress: () => this.rejectCall(callData.id)
        },
        {
          text: 'Aceptar',
          onPress: () => this.acceptCall(callData.id)
        }
      ]
    );
  }

  async acceptCall(callId) {
    try {
      const { call, token } = await CallService.joinCall(callId);
      
      // Navegar a pantalla de videollamada
      this.navigateToCallScreen(call, token);
    } catch (error) {
      Alert.alert('Error', 'No se pudo unir a la llamada');
    }
  }

  async rejectCall(callId) {
    try {
      await CallService.leaveCall(callId);
    } catch (error) {
      console.error('Error rechazando llamada:', error);
    }
  }

  showOutgoingCallUI(call) {
    // Implementar UI de llamada saliente
    // Mostrar avatar del destinatario, nombre, etc.
  }

  navigateToCallScreen(call, token) {
    // Navegar a la pantalla de videollamada
    // navigation.navigate('VideoCall', { call, token });
  }
}
```

### 2. Detector de Llamadas Entrantes
```javascript
import { useEffect } from 'react';
import messaging from '@react-native-firebase/messaging';

const CallNotificationHandler = () => {
  useEffect(() => {
    // Manejar notificaciones de llamada cuando la app está en primer plano
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      if (remoteMessage.data?.type === 'call_invitation') {
        const callData = JSON.parse(remoteMessage.data.callData);
        
        // Manejar llamada entrante
        CallInvitationManager.handleIncomingCall(callData);
      }
    });

    // Manejar notificación tocada (app en background)
    messaging().onNotificationOpenedApp(remoteMessage => {
      if (remoteMessage.data?.type === 'call_invitation') {
        const callData = JSON.parse(remoteMessage.data.callData);
        
        // Verificar si la llamada aún está activa
        CallService.joinCall(callData.id)
          .then(({ call, token }) => {
            // Navegar a pantalla de llamada
          })
          .catch(error => {
            Alert.alert('Llamada Terminada', 'Esta llamada ya no está disponible');
          });
      }
    });

    return unsubscribe;
  }, []);

  return null; // Componente sin UI
};

export default CallNotificationHandler;
```

### 3. Monitoreo de Estado de Llamada
```javascript
class CallStateManager {
  constructor() {
    this.currentCall = null;
    this.callState = 'idle'; // idle, outgoing, incoming, connected
    this.participants = [];
  }

  setCallState(state) {
    this.callState = state;
    this.notifyStateChange(state);
  }

  async startCall(type, target, options = {}) {
    this.setCallState('outgoing');
    
    try {
      let result;
      if (type === 'direct') {
        result = await CallService.startDirectCall(target, options.title, options.audioOnly);
      } else {
        result = await CallService.startProjectCall(target, options.title, options.maxParticipants, options.audioOnly);
      }
      
      this.currentCall = result.call;
      return result;
    } catch (error) {
      this.setCallState('idle');
      throw error;
    }
  }

  async answerCall(callId) {
    this.setCallState('connecting');
    
    try {
      const result = await CallService.joinCall(callId);
      this.currentCall = result.call;
      this.setCallState('connected');
      return result;
    } catch (error) {
      this.setCallState('idle');
      throw error;
    }
  }

  async endCall() {
    if (!this.currentCall) return;
    
    try {
      await CallService.endCall(this.currentCall.id);
    } catch (error) {
      console.error('Error terminando llamada:', error);
    } finally {
      this.currentCall = null;
      this.participants = [];
      this.setCallState('idle');
    }
  }

  notifyStateChange(state) {
    // Notificar cambios de estado a componentes suscritos
    // Implementar patrón observer o usar context/redux
    console.log('Estado de llamada cambió a:', state);
  }

  getCurrentCall() {
    return this.currentCall;
  }

  getCallState() {
    return this.callState;
  }
}

export default new CallStateManager();
```

---

## 🔐 Consideraciones de Seguridad

### Tokens LiveKit
- Los tokens tienen una validez limitada (por defecto 1 hora)
- Los tokens se generan con permisos específicos (audio, video, participante)
- Use el endpoint `/calls/token/{callId}` para renovar tokens expirados

### Validación de Permisos
- Solo miembros del proyecto pueden unirse a llamadas de proyecto
- Las llamadas directas requieren que ambos usuarios se conozcan
- Los iniciadores pueden finalizar sus propias llamadas

### Configuración LiveKit
```javascript
// Configuración recomendada para LiveKit
const roomOptions = {
  audio: true,
  video: true,
  adaptiveStream: true, // Adapta calidad según ancho de banda
  dynacast: true,       // Optimiza streams para múltiples participantes
  videoCaptureDefaults: {
    resolution: VideoPresets.h720.resolution,
    frameRate: 15
  },
  audioCaptureDefaults: {
    autoGainControl: true,
    echoCancellation: true,
    noiseSuppression: true
  }
};
```

---

## 📊 Métricas de Llamadas

### Estadísticas de Uso
```javascript
class CallAnalytics {
  async getCallStats() {
    try {
      const history = await CallService.getCallHistory(1, 100);
      
      return {
        totalCalls: history.length,
        directCalls: history.filter(call => call.type === 'direct').length,
        projectCalls: history.filter(call => call.type === 'project').length,
        averageDuration: this.calculateAverageDuration(history),
        mostActiveHours: this.getMostActiveHours(history)
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      return null;
    }
  }

  calculateAverageDuration(calls) {
    const completedCalls = calls.filter(call => call.endedAt);
    if (completedCalls.length === 0) return 0;
    
    const totalDuration = completedCalls.reduce((sum, call) => {
      const duration = new Date(call.endedAt) - new Date(call.createdAt);
      return sum + duration;
    }, 0);
    
    return totalDuration / completedCalls.length / 1000 / 60; // minutos
  }

  getMostActiveHours(calls) {
    const hourCounts = {};
    
    calls.forEach(call => {
      const hour = new Date(call.createdAt).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    
    return Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([hour, count]) => ({ hour: parseInt(hour), count }));
  }
}
``` 