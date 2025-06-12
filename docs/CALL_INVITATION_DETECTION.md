# Sistema de Detección de Invitaciones de Llamada 📞

## Resumen
Este documento explica cómo la aplicación móvil detecta, maneja y procesa invitaciones de llamada en el sistema de chat. El frontend web puede usar esto como referencia para implementar la misma funcionalidad.

---

## 🔍 Proceso de Detección

### 1. Recepción de Mensajes
Las invitaciones de llamada se detectan a través del sistema de chat WebSocket cuando llegan nuevos mensajes:

```javascript
// Escuchar mensajes entrantes vía WebSocket
socket.on('newMessage', (message) => {
  // Verificar si este mensaje es una invitación de llamada
  if (isCallInvitation(message.content) && message.senderId !== currentUserId) {
    // Procesar la invitación de llamada
    handleCallInvitation(message);
  }
});
```

### 2. Función de Detección de Invitación de Llamada
La lógica de detección principal usa un enfoque simple de coincidencia de patrones:

```javascript
const isCallInvitation = (messageContent: string): boolean => {
  return messageContent.includes('📞') || 
         messageContent.toLowerCase().includes('call') || 
         messageContent.toLowerCase().includes('meeting');
};
```

**Criterios de Detección:**
- Contiene el emoji 📞 (indicador principal)
- Contiene la palabra "call" (insensible a mayúsculas)
- Contiene la palabra "meeting" (insensible a mayúsculas)

---

## 📋 Estructura del Mensaje

### Formato del Mensaje de Invitación de Llamada
Cuando se inicia una llamada, el backend envía automáticamente un mensaje de chat con esta estructura:

```typescript
interface Message {
  id: string;
  content: string;          // El texto de invitación
  senderId: string;         // Usuario que inició la llamada
  senderName: string;       // Nombre para mostrar del llamador
  callId?: string;          // UUID de la llamada (clave para unirse)
  createdAt: string;
  type: 'direct' | 'project';
  recipientId?: string;     // Para llamadas directas
  projectId?: string;       // Para llamadas de proyecto
  isRead: boolean;
}
```

### Ejemplos de Contenido
El backend genera diferentes mensajes basados en el tipo de llamada:

**Llamada de Audio Directa:**
```
📞 Victor Fonseca ha iniciado una llamada
```

**Llamada de Video Directa:**
```
📞 Victor Fonseca ha iniciado una videollamada
```

**Llamada de Audio de Proyecto:**
```
📞 Victor Fonseca ha iniciado una llamada de audio
```

**Llamada de Video de Proyecto:**
```
📞 Victor Fonseca ha iniciado una videollamada
```

---

## 🎯 Endpoints del Backend Utilizados

### 1. Iniciar una Llamada
Cuando un usuario inicia una llamada, se llaman estos endpoints:

**Llamada Directa:**
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

**Llamada de Proyecto:**
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

**Respuesta:**
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

### 2. Verificación de Estado para Unirse a Llamada
Antes de unirse a una llamada, verificar si aún está activa:

```http
POST /calls/join/{callId}
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "audioOnly": false
}
```

**Respuesta Exitosa (200):**
```json
{
  "call": {
    "id": "call-uuid",
    "status": "active",
    "audioOnly": false,
    // ... otros detalles de la llamada
  },
  "token": "livekit-access-token"
}
```

**Respuestas de Error:**
- `404`: Llamada no encontrada o terminada
- `400`: Llamada cancelada o inválida

---

## 🔧 Extracción del ID de Llamada

### Método Principal: Metadatos del Mensaje
El método preferido es usar el campo `callId` en el mensaje:

```javascript
// Verificar si el mensaje tiene callId en metadatos
if (message.callId) {
  console.log('ID de llamada encontrado en metadatos:', message.callId);
  joinCall(message.callId);
}
```

### Método de Respaldo: Análisis de Texto
Si faltan los metadatos, extraer el ID de llamada del contenido del mensaje:

```javascript
const extractCallId = (messageContent: string): string | null => {
  // Múltiples patrones UUID para probar
  const patterns = [
    // Patrón UUID estándar
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
    // Patrón callId:
    /callId[:\s]*([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/gi,
    // Patrón call/ (de URLs)
    /call\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/gi,
    // Cualquier patrón similar a UUID
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

## 🎨 Manejo de UI

### 1. Alerta en Tiempo Real
Cuando se detecta una invitación de llamada, mostrar una alerta inmediata:

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

### 2. Renderizado de Mensajes de Chat
Los mensajes de invitación de llamada se renderizan con UI especial:

```javascript
const renderCallInvitation = (message) => {
  const callId = message.callId;
  const callStatus = checkCallStatus(callId); // 'active', 'ended', 'cancelled'
  const isCallActive = callStatus === 'active';
  
  return (
    <View style={styles.callInvitationCard}>
      {/* Encabezado de Llamada */}
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
      
      {/* Botón de Unirse */}
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

## 🚀 Proceso de Unirse a Llamada

### 1. Validar Estado de Llamada
Antes de unirse, siempre verificar si la llamada aún está activa:

```javascript
const joinCallFromInvitation = async (callId) => {
  try {
    // Verificar estado de llamada
    const response = await fetch(`${API_BASE_URL}/calls/join/${callId}`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify({ audioOnly: false })
    });
    
    if (response.ok) {
      const { call, token } = await response.json();
      
      if (call.status === 'active') {
        // Navegar a pantalla de llamada
        router.push(`/call/${callId}`);
      } else {
        // Llamada terminada o cancelada
        showAlert('Llamada No Disponible', 'Esta llamada ha terminado.');
      }
    } else {
      // Manejar códigos de estado de error
      if (response.status === 404 || response.status === 400) {
        showAlert('Llamada No Disponible', 'Esta llamada ha terminado o ya no está disponible.');
      }
    }
  } catch (error) {
    showAlert('Error de Conexión', 'No se pudo verificar el estado de la llamada.');
  }
};
```

### 2. Navegación a Pantalla de Llamada
Una vez validada, navegar a la interfaz de videollamada:

```javascript
// Navegar con ID de llamada
router.push(`/call/${callId}`);
```

---

## 🔄 Monitoreo de Estado de Llamada

### Caché de Estados
Para evitar llamadas repetidas a la API, cachear estados de llamada:

```javascript
const [callStatuses, setCallStatuses] = useState({});

const checkCallStatus = async (callId) => {
  // Devolver estado cacheado si está disponible
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

### Tipos de Estado
- `waiting`: Llamada creada, esperando participantes
- `active`: Llamada en progreso con participantes  
- `ended`: Llamada terminada normalmente
- `cancelled`: Llamada cancelada antes de que alguien se uniera

---

## 📱 Implementación del Frontend Web

### 1. Conexión WebSocket
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

### 2. Detección de Llamada
```javascript
const isCallInvitation = (messageContent) => {
  return messageContent.includes('📞') || 
         messageContent.toLowerCase().includes('call') || 
         messageContent.toLowerCase().includes('meeting');
};
```

### 3. Notificación del Navegador
```javascript
const handleCallInvitation = (message) => {
  // Mostrar notificación del navegador
  if (Notification.permission === 'granted') {
    new Notification('Llamada Entrante', {
      body: message.content,
      icon: '/call-icon.png',
      tag: 'call-invitation'
    });
  }
  
  // Mostrar modal en la aplicación
  showCallInvitationModal(message);
};
```

### 4. Unirse a Llamada
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
      
      // Usar LiveKit Web SDK para unirse a la sala
      const room = new Room();
      await room.connect('wss://your-livekit-url', livekitToken);
      
      // Navegar a interfaz de llamada
      window.location.href = `/call/${callId}`;
    }
  } catch (error) {
    console.error('Error al unirse a la llamada:', error);
  }
};
```

---

## 🎨 Estilos UI/UX

### Colores de Tarjeta de Invitación de Llamada
```css
.call-invitation-card {
  background-color: #f8f9fa;
  border: 2px solid #4CAF50; /* Verde para llamadas activas */
  border-radius: 16px;
  padding: 16px;
}

.call-invitation-card.ended {
  border-color: #9E9E9E; /* Gris para llamadas terminadas */
}

.call-icon-container {
  width: 40px;
  height: 40px;
  border-radius: 20px;
  background-color: #4CAF50; /* Verde para activas */
  display: flex;
  align-items: center;
  justify-content: center;
}

.call-icon-container.ended {
  background-color: #9E9E9E; /* Gris para terminadas */
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

## 🔧 Pruebas

### 1. Probar Detección de Invitación de Llamada
```javascript
// Ejemplos de mensajes de prueba
const testMessages = [
  { content: '📞 Victor Fonseca ha iniciado una llamada', callId: 'test-call-id' },
  { content: '📞 Victor Fonseca ha iniciado una videollamada', callId: 'test-call-id' },
  { content: 'Let\'s have a call', callId: null },
  { content: 'Meeting starting now', callId: null }
];

testMessages.forEach(msg => {
  console.log(`"${msg.content}" es invitación de llamada:`, isCallInvitation(msg.content));
});
```

### 2. Probar Extracción de ID de Llamada
```javascript
const testContent = 'Join call: https://app.com/call/123e4567-e89b-12d3-a456-426614174000';
const extractedId = extractCallId(testContent);
console.log('ID Extraído:', extractedId); // Debería ser: 123e4567-e89b-12d3-a456-426614174000
```

---

## 🎯 Puntos Clave para Frontend Web

1. **Escuchar mensajes WebSocket** con patrones de invitación de llamada
2. **Verificar message.callId primero**, usar extracción de texto como respaldo
3. **Siempre validar estado de llamada** antes de unirse
4. **Cachear estados de llamada** para evitar llamadas repetidas a la API
5. **Mostrar notificaciones inmediatas** para llamadas entrantes
6. **Usar manejo de errores apropiado** para problemas de red
7. **Implementar estados de UI apropiados** (activa, terminada, cargando)
8. **Soportar tipos de llamada de audio y video**
9. **Manejar contextos de llamada directa y de proyecto**
10. **Proporcionar retroalimentación clara al usuario** durante todo el proceso

El sistema prioriza la confiabilidad y experiencia del usuario usando múltiples métodos de detección, manejo apropiado de errores y retroalimentación visual clara. 