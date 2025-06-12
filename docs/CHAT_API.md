# Documentación de API de Chat 💬

## Resumen
El sistema de Chat soporta tanto **mensajes directos 1:1** como **conversaciones grupales de proyecto** con mensajería WebSocket en tiempo real y persistencia en base de datos.

## Características ✨
- **Mensajería en tiempo real** con WebSocket
- **Mensajes directos** (chat 1:1) entre usuarios
- **Conversaciones de proyecto** (chat grupal) para miembros del proyecto
- **Indicadores de escritura** y presencia en línea
- **Edición de mensajes** y eliminación
- **Confirmaciones de lectura** y búsqueda de mensajes
- **Historial de mensajes** con paginación
- **API REST de respaldo** para confiabilidad

---

## 🔌 Conexión WebSocket

### Conectar al Chat
```javascript
import { io } from 'socket.io-client';

// Obtener token de AsyncStorage (React Native) o localStorage (web)
const token = await AsyncStorage.getItem('access_token'); // React Native
// const token = localStorage.getItem('access_token'); // Web

const socket = io('http://localhost:3000/chat', {
  auth: {
    token: token // Token JWT sin prefijo 'Bearer '
  }
});

// Eventos de conexión
socket.on('connect', () => {
  console.log('¡Conectado al chat!');
});

socket.on('disconnect', () => {
  console.log('Desconectado del chat');
});

// Manejo de errores
socket.on('connect_error', (error) => {
  console.error('Falló la conexión:', error.message);
  // El token podría ser inválido o expirado
});
```

### Unirse a Sala de Proyecto
```javascript
// Unirse al proyecto para mensajes en tiempo real
socket.emit('joinProject', { projectId: 'project-uuid' });

socket.on('joinedProject', (data) => {
  console.log('Se unió al proyecto:', data.projectId);
});
```

### Enviar Mensajes
```javascript
// Enviar mensaje directo
socket.emit('sendMessage', {
  content: '¡Hola! ¿Cómo estás?',
  recipientId: 'user-uuid'
});

// Enviar mensaje de proyecto
socket.emit('sendMessage', {
  content: '¡Reunión a las 3pm hoy!',
  projectId: 'project-uuid'
});

// Escuchar nuevos mensajes
socket.on('newMessage', (message) => {
  console.log('Nuevo mensaje:', message);
  /*
  {
    id: 'msg-uuid',
    content: '¡Hola! ¿Cómo estás?',
    senderId: 'sender-uuid',
    senderName: 'John Doe',
    createdAt: '2024-01-10T10:00:00.000Z',
    type: 'direct', // o 'project'
    recipientId: 'user-uuid', // para mensajes directos
    projectId: 'project-uuid' // para mensajes de proyecto
  }
  */
});

// Confirmación cuando tu mensaje es enviado
socket.on('messageSent', (message) => {
  console.log('Mensaje enviado exitosamente:', message);
});
```

### Indicadores de Escritura
```javascript
// Mostrar indicador de escritura
socket.emit('typing', {
  recipientId: 'user-uuid', // para mensaje directo
  // O projectId: 'project-uuid', // para mensaje de proyecto
  typing: true
});

// Detener indicador de escritura
socket.emit('typing', {
  recipientId: 'user-uuid',
  typing: false
});

// Escuchar eventos de escritura
socket.on('typing', (data) => {
  console.log('Usuario escribiendo:', data);
  /*
  {
    userId: 'user-uuid',
    typing: true,
    timestamp: '2024-01-10T10:00:00.000Z',
    type: 'direct' // o 'project'
  }
  */
});
```

### Presencia en Línea
```javascript
// Obtener usuarios en línea
socket.emit('getOnlineUsers');

socket.on('onlineUsers', (data) => {
  console.log('Usuarios en línea:', data.users);
});

// Escuchar cambios de estado de usuario
socket.on('userOnline', (data) => {
  console.log('Usuario se conectó:', data.userId);
});

socket.on('userOffline', (data) => {
  console.log('Usuario se desconectó:', data.userId);
});
```

---

## 🌐 Endpoints de API REST

### Obtener Todas las Conversaciones
```http
GET /chat/conversations
Authorization: Bearer <jwt-token>
```

**Respuesta:**
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
      "content": "¡Nos vemos mañana!",
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
      "description": "Proyecto principal del backend"
    },
    "lastMessage": {
      "id": "msg-uuid",
      "content": "¡Excelente trabajo todos!",
      "senderId": "user-uuid",
      "senderName": "Victor Fonseca",
      "createdAt": "2024-01-10T14:20:00.000Z",
      "isRead": false
    }
  }
]
```

### Obtener Historial de Mensajes Directos
```http
GET /chat/direct/{userId}?page=1&limit=50
Authorization: Bearer <jwt-token>
```

### Marcar Conversación Directa como Leída
```http
PUT /chat/direct/{userId}/read
Authorization: Bearer <jwt-token>
```

**Respuesta:**
```json
{
  "message": "messages-marked-as-read",
  "markedCount": 5
}
```

**Importante:** Solo marca como leídos los mensajes **enviados A ti** de ese usuario, NO tus mensajes salientes.

### Obtener Historial de Mensajes del Proyecto
```http
GET /chat/project/{projectId}?page=1&limit=50
Authorization: Bearer <jwt-token>
```

**Respuesta (ambos endpoints):**
```json
[
  {
    "id": "msg-uuid-1",
    "content": "¡Hola todos!",
    "sender": {
      "id": "user-uuid",
      "nombre": "Victor",
      "apellidos": "Fonseca"
    },
    "recipient": null, // para mensajes de proyecto
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

### Crear Mensaje (REST de Respaldo)
```http
POST /chat/messages
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "content": "Hola, ¿cómo va el proyecto?",
  "recipientId": "user-uuid" // para mensaje directo
  // O "projectId": "project-uuid" // para mensaje de proyecto
}
```

### Editar Mensaje
```http
PUT /chat/messages/{messageId}
Authorization: Bearer <jwt-token>

{
  "content": "Mensaje editado"
}
```

### Eliminar Mensaje
```http
DELETE /chat/messages/{messageId}
Authorization: Bearer <jwt-token>
```

---

## 📱 Implementación React Native

### 1. Hook de Chat
```javascript
import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useChat = () => {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Map());

  useEffect(() => {
    initializeSocket();
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  const initializeSocket = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) return;

      const newSocket = io('http://localhost:3000/chat', {
        auth: { token }
      });

      newSocket.on('connect', () => {
        console.log('Conectado al chat');
        setIsConnected(true);
      });

      newSocket.on('disconnect', () => {
        console.log('Desconectado del chat');
        setIsConnected(false);
      });

      newSocket.on('newMessage', (message) => {
        console.log('Nuevo mensaje recibido:', message);
        setMessages(prev => [message, ...prev]);
        updateConversationLastMessage(message);
      });

      newSocket.on('messageSent', (message) => {
        console.log('Mensaje enviado:', message);
        setMessages(prev => [message, ...prev]);
        updateConversationLastMessage(message);
      });

      newSocket.on('typing', (data) => {
        setTypingUsers(prev => {
          const updated = new Map(prev);
          if (data.typing) {
            updated.set(data.userId, Date.now());
          } else {
            updated.delete(data.userId);
          }
          return updated;
        });

        // Limpiar indicadores de escritura después de 3 segundos
        setTimeout(() => {
          setTypingUsers(prev => {
            const updated = new Map(prev);
            updated.delete(data.userId);
            return updated;
          });
        }, 3000);
      });

      newSocket.on('onlineUsers', (data) => {
        setOnlineUsers(data.users);
      });

      newSocket.on('userOnline', (data) => {
        setOnlineUsers(prev => [...prev, data.userId]);
      });

      newSocket.on('userOffline', (data) => {
        setOnlineUsers(prev => prev.filter(id => id !== data.userId));
      });

      setSocket(newSocket);
    } catch (error) {
      console.error('Error inicializando socket:', error);
    }
  };

  const updateConversationLastMessage = (message) => {
    setConversations(prev => prev.map(conv => {
      if (conv.type === 'direct' && 
          (conv.partner.id === message.senderId || conv.partner.id === message.recipientId)) {
        return { ...conv, lastMessage: message };
      }
      if (conv.type === 'project' && conv.project.id === message.projectId) {
        return { ...conv, lastMessage: message };
      }
      return conv;
    }));
  };

  const sendMessage = (content, recipientId = null, projectId = null) => {
    if (!socket || !isConnected) {
      console.error('Socket no conectado');
      return;
    }

    const messageData = { content };
    if (recipientId) messageData.recipientId = recipientId;
    if (projectId) messageData.projectId = projectId;

    socket.emit('sendMessage', messageData);
  };

  const sendTypingIndicator = (typing, recipientId = null, projectId = null) => {
    if (!socket || !isConnected) return;

    const data = { typing };
    if (recipientId) data.recipientId = recipientId;
    if (projectId) data.projectId = projectId;

    socket.emit('typing', data);
  };

  const joinProject = (projectId) => {
    if (!socket || !isConnected) return;
    socket.emit('joinProject', { projectId });
  };

  const loadConversations = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      const response = await fetch('http://localhost:3000/chat/conversations', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setConversations(data);
    } catch (error) {
      console.error('Error cargando conversaciones:', error);
    }
  };

  const loadMessages = async (type, id, page = 1) => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      const endpoint = type === 'direct' 
        ? `/chat/direct/${id}?page=${page}&limit=50`
        : `/chat/project/${id}?page=${page}&limit=50`;
      
      const response = await fetch(`http://localhost:3000${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (page === 1) {
        setMessages(data);
      } else {
        setMessages(prev => [...prev, ...data]);
      }
    } catch (error) {
      console.error('Error cargando mensajes:', error);
    }
  };

  const markAsRead = async (userId) => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      await fetch(`http://localhost:3000/chat/direct/${userId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (error) {
      console.error('Error marcando como leído:', error);
    }
  };

  return {
    socket,
    messages,
    conversations,
    onlineUsers,
    typingUsers,
    isConnected,
    sendMessage,
    sendTypingIndicator,
    joinProject,
    loadConversations,
    loadMessages,
    markAsRead
  };
};
```

### 2. Componente de Chat
```javascript
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useChat } from './hooks/useChat';

const ChatScreen = ({ route }) => {
  const { chatType, chatId, chatName } = route.params;
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  
  const {
    messages,
    isConnected,
    typingUsers,
    sendMessage,
    sendTypingIndicator,
    loadMessages,
    markAsRead,
    joinProject
  } = useChat();

  useEffect(() => {
    // Cargar mensajes al entrar
    loadMessages(chatType, chatId);
    
    // Unirse al proyecto si es chat de proyecto
    if (chatType === 'project') {
      joinProject(chatId);
    }
    
    // Marcar como leído si es chat directo
    if (chatType === 'direct') {
      markAsRead(chatId);
    }
  }, [chatType, chatId]);

  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    const recipientId = chatType === 'direct' ? chatId : null;
    const projectId = chatType === 'project' ? chatId : null;
    
    sendMessage(inputText.trim(), recipientId, projectId);
    setInputText('');
    
    // Detener indicador de escritura
    if (isTyping) {
      sendTypingIndicator(false, recipientId, projectId);
      setIsTyping(false);
    }
  };

  const handleTextChange = (text) => {
    setInputText(text);
    
    const recipientId = chatType === 'direct' ? chatId : null;
    const projectId = chatType === 'project' ? chatId : null;
    
    // Iniciar indicador de escritura
    if (!isTyping && text.length > 0) {
      sendTypingIndicator(true, recipientId, projectId);
      setIsTyping(true);
    }
    
    // Reiniciar timeout para detener escritura
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        sendTypingIndicator(false, recipientId, projectId);
        setIsTyping(false);
      }
    }, 1000);
  };

  const renderMessage = ({ item }) => {
    const isMyMessage = item.sender?.id === currentUserId; // Define currentUserId
    
    return (
      <View style={{
        alignSelf: isMyMessage ? 'flex-end' : 'flex-start',
        backgroundColor: isMyMessage ? '#007AFF' : '#E5E5EA',
        padding: 12,
        margin: 4,
        borderRadius: 18,
        maxWidth: '80%'
      }}>
        {!isMyMessage && chatType === 'project' && (
          <Text style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 4 }}>
            {item.sender?.nombre} {item.sender?.apellidos}
          </Text>
        )}
        <Text style={{ 
          color: isMyMessage ? 'white' : 'black',
          fontSize: 16 
        }}>
          {item.content}
        </Text>
        <Text style={{
          fontSize: 12,
          color: isMyMessage ? 'rgba(255,255,255,0.7)' : '#666',
          marginTop: 4,
          alignSelf: 'flex-end'
        }}>
          {new Date(item.createdAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </Text>
      </View>
    );
  };

  const renderTypingIndicator = () => {
    const typingUsersList = Array.from(typingUsers.keys());
    if (typingUsersList.length === 0) return null;

    return (
      <View style={{ padding: 10, alignItems: 'flex-start' }}>
        <View style={{
          backgroundColor: '#E5E5EA',
          padding: 12,
          borderRadius: 18,
          maxWidth: '80%'
        }}>
          <Text style={{ color: '#666', fontStyle: 'italic' }}>
            {typingUsersList.length === 1 
              ? 'Escribiendo...' 
              : `${typingUsersList.length} personas escribiendo...`}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: 'white' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={{ 
        padding: 15, 
        backgroundColor: '#F8F8F8',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0'
      }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold' }}>
          {chatName}
        </Text>
        <Text style={{ fontSize: 12, color: '#666' }}>
          {isConnected ? 'Conectado' : 'Desconectado'}
        </Text>
      </View>

      {/* Lista de mensajes */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        inverted
        style={{ flex: 1, padding: 10 }}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
      />

      {/* Indicador de escritura */}
      {renderTypingIndicator()}

      {/* Input de mensaje */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        backgroundColor: '#F8F8F8',
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0'
      }}>
        <TextInput
          style={{
            flex: 1,
            borderWidth: 1,
            borderColor: '#E0E0E0',
            borderRadius: 20,
            paddingHorizontal: 15,
            paddingVertical: 10,
            backgroundColor: 'white',
            maxHeight: 100
          }}
          value={inputText}
          onChangeText={handleTextChange}
          placeholder="Escribe un mensaje..."
          multiline
        />
        <TouchableOpacity
          onPress={handleSendMessage}
          disabled={!inputText.trim()}
          style={{
            marginLeft: 10,
            backgroundColor: inputText.trim() ? '#007AFF' : '#C0C0C0',
            borderRadius: 20,
            paddingHorizontal: 20,
            paddingVertical: 10
          }}
        >
          <Text style={{ color: 'white', fontWeight: 'bold' }}>
            Enviar
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

export default ChatScreen;
```

### 3. Lista de Conversaciones
```javascript
import React, { useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image
} from 'react-native';
import { useChat } from './hooks/useChat';
import { useNavigation } from '@react-navigation/native';

const ConversationsScreen = () => {
  const navigation = useNavigation();
  const { conversations, onlineUsers, loadConversations } = useChat();

  useEffect(() => {
    loadConversations();
  }, []);

  const renderConversation = ({ item }) => {
    const isOnline = item.type === 'direct' && 
      onlineUsers.includes(item.partner?.id);
    
    const lastMessageTime = item.lastMessage?.createdAt 
      ? new Date(item.lastMessage.createdAt).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        })
      : '';

    const conversationName = item.type === 'direct'
      ? `${item.partner?.nombre} ${item.partner?.apellidos}`
      : item.project?.name;

    const lastMessagePreview = item.lastMessage?.content
      ? item.lastMessage.content.substring(0, 50) + 
        (item.lastMessage.content.length > 50 ? '...' : '')
      : 'Sin mensajes';

    return (
      <TouchableOpacity
        style={{
          flexDirection: 'row',
          padding: 15,
          borderBottomWidth: 1,
          borderBottomColor: '#E0E0E0',
          backgroundColor: item.lastMessage?.isRead === false ? '#F0F8FF' : 'white'
        }}
        onPress={() => {
          navigation.navigate('Chat', {
            chatType: item.type,
            chatId: item.type === 'direct' ? item.partner?.id : item.project?.id,
            chatName: conversationName
          });
        }}
      >
        {/* Avatar placeholder */}
        <View style={{
          width: 50,
          height: 50,
          borderRadius: 25,
          backgroundColor: '#E0E0E0',
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: 15
        }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold' }}>
            {item.type === 'direct' 
              ? `${item.partner?.nombre?.[0]}${item.partner?.apellidos?.[0]}`
              : item.project?.name?.[0]
            }
          </Text>
          
          {/* Indicador de estado en línea */}
          {isOnline && (
            <View style={{
              position: 'absolute',
              bottom: 2,
              right: 2,
              width: 12,
              height: 12,
              borderRadius: 6,
              backgroundColor: '#4CAF50',
              borderWidth: 2,
              borderColor: 'white'
            }} />
          )}
        </View>

        <View style={{ flex: 1 }}>
          <View style={{ 
            flexDirection: 'row', 
            justifyContent: 'space-between',
            marginBottom: 5
          }}>
            <Text style={{ 
              fontSize: 16, 
              fontWeight: 'bold',
              flex: 1
            }}>
              {conversationName}
            </Text>
            <Text style={{ fontSize: 12, color: '#666' }}>
              {lastMessageTime}
            </Text>
          </View>
          
          <Text style={{ 
            fontSize: 14, 
            color: '#666',
            fontStyle: lastMessagePreview === 'Sin mensajes' ? 'italic' : 'normal'
          }}>
            {lastMessagePreview}
          </Text>

          {/* Indicador de mensaje no leído */}
          {item.lastMessage?.isRead === false && (
            <View style={{
              position: 'absolute',
              right: 0,
              top: 20,
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: '#007AFF'
            }} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <FlatList
        data={conversations}
        renderItem={renderConversation}
        keyExtractor={(item) => 
          item.type === 'direct' 
            ? `direct-${item.partner?.id}` 
            : `project-${item.project?.id}`
        }
        refreshing={false}
        onRefresh={loadConversations}
      />
    </View>
  );
};

export default ConversationsScreen;
```

---

## ❌ Respuestas de Error

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": ["content-required", "recipient-or-project-required"],
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
  "message": "conversation-not-found"
}
```

---

## 🎯 Casos de Uso Avanzados

### 1. Sistema de Notificaciones Push
```javascript
import messaging from '@react-native-firebase/messaging';

class ChatNotificationManager {
  constructor() {
    this.setupFirebaseMessaging();
  }

  async setupFirebaseMessaging() {
    // Solicitar permisos para notificaciones
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      console.log('Permisos de notificación otorgados');
    }

    // Obtener token FCM
    const fcmToken = await messaging().getToken();
    if (fcmToken) {
      console.log('Token FCM:', fcmToken);
      // Enviar token al servidor para asociarlo al usuario
      await this.registerFCMToken(fcmToken);
    }

    // Manejar mensajes cuando la app está en primer plano
    messaging().onMessage(async remoteMessage => {
      console.log('Mensaje recibido en primer plano:', remoteMessage);
      this.showInAppNotification(remoteMessage);
    });

    // Manejar mensajes cuando la app está en background/cerrada
    messaging().setBackgroundMessageHandler(async remoteMessage => {
      console.log('Mensaje recibido en background:', remoteMessage);
    });
  }

  async registerFCMToken(token) {
    try {
      const authToken = await AsyncStorage.getItem('access_token');
      await fetch('http://localhost:3000/auth/fcm-token', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fcmToken: token })
      });
    } catch (error) {
      console.error('Error registrando token FCM:', error);
    }
  }

  showInAppNotification(remoteMessage) {
    // Mostrar notificación local cuando la app está activa
    // Implementar usando react-native-notifications o similar
  }
}
```

### 2. Búsqueda de Mensajes
```javascript
class MessageSearchService {
  async searchMessages(query, chatType, chatId) {
    try {
      const token = await AsyncStorage.getItem('access_token');
      const endpoint = chatType === 'direct' 
        ? `/chat/direct/${chatId}/search`
        : `/chat/project/${chatId}/search`;
      
      const response = await fetch(
        `http://localhost:3000${endpoint}?q=${encodeURIComponent(query)}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      return await response.json();
    } catch (error) {
      console.error('Error buscando mensajes:', error);
      return [];
    }
  }

  async searchAllConversations(query) {
    try {
      const token = await AsyncStorage.getItem('access_token');
      const response = await fetch(
        `http://localhost:3000/chat/search?q=${encodeURIComponent(query)}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      return await response.json();
    } catch (error) {
      console.error('Error buscando en todas las conversaciones:', error);
      return [];
    }
  }
}
```

### 3. Filtros y Moderación
```javascript
class MessageModerationService {
  constructor() {
    this.bannedWords = ['spam', 'abuso']; // Configurar según necesidades
  }

  filterMessage(content) {
    let filtered = content;
    
    this.bannedWords.forEach(word => {
      const regex = new RegExp(word, 'gi');
      filtered = filtered.replace(regex, '*'.repeat(word.length));
    });

    return filtered;
  }

  validateMessage(content) {
    // Validaciones básicas
    if (!content || content.trim().length === 0) {
      throw new Error('El mensaje no puede estar vacío');
    }

    if (content.length > 1000) {
      throw new Error('El mensaje es demasiado largo');
    }

    // Detectar spam (mensajes repetidos muy seguidos)
    if (this.isSpam(content)) {
      throw new Error('Detectado posible spam');
    }

    return true;
  }

  isSpam(content) {
    // Implementar lógica de detección de spam
    // Por ejemplo, verificar si es idéntico a mensajes recientes
    return false;
  }
}
```

---

## 🔐 Consideraciones de Seguridad

### Autenticación WebSocket
- Los tokens JWT deben incluirse en la conexión WebSocket
- Tokens expirados resultan en desconexión automática
- Re-autenticación automática cuando sea posible

### Validación de Mensajes
```javascript
const validateMessageContent = (content) => {
  // Sanitizar HTML para prevenir XSS
  const sanitized = content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Validar longitud
  if (sanitized.length > 1000) {
    throw new Error('Mensaje demasiado largo');
  }
  
  // Filtrar contenido inapropiado
  return sanitized.trim();
};
```

### Control de Acceso
- Mensajes directos: Solo remitente y destinatario
- Mensajes de proyecto: Solo miembros del proyecto
- Historial limitado según permisos del usuario

---

## 📊 Métricas y Análisis

### Estadísticas de Chat
```javascript
class ChatAnalytics {
  async getChatStats() {
    try {
      const token = await AsyncStorage.getItem('access_token');
      const response = await fetch('http://localhost:3000/chat/analytics', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      return await response.json();
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      return null;
    }
  }

  trackMessageSent(type, length) {
    // Rastrear eventos para analytics
    console.log(`Mensaje ${type} enviado, longitud: ${length}`);
  }

  trackTypingEvent(duration) {
    // Rastrear tiempo de escritura para UX analytics
    console.log(`Usuario escribió por ${duration}ms`);
  }
}
```

---

## 🚀 Optimización de Rendimiento

### Paginación Eficiente
```javascript
const MESSAGES_PER_PAGE = 20;

const loadMoreMessages = async (chatType, chatId, page) => {
  try {
    const messages = await loadMessages(chatType, chatId, page);
    
    // Cargar solo si hay mensajes nuevos
    if (messages.length > 0) {
      setMessages(prev => [...prev, ...messages]);
      return true; // Hay más mensajes
    }
    
    return false; // No hay más mensajes
  } catch (error) {
    console.error('Error cargando más mensajes:', error);
    return false;
  }
};
```

### Caché Local
```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

class ChatCache {
  static async cacheConversations(conversations) {
    try {
      await AsyncStorage.setItem(
        'cached_conversations',
        JSON.stringify({
          data: conversations,
          timestamp: Date.now()
        })
      );
    } catch (error) {
      console.error('Error guardando conversaciones en caché:', error);
    }
  }

  static async getCachedConversations() {
    try {
      const cached = await AsyncStorage.getItem('cached_conversations');
      if (!cached) return null;

      const { data, timestamp } = JSON.parse(cached);
      
      // Caché válido por 5 minutos
      if (Date.now() - timestamp < 5 * 60 * 1000) {
        return data;
      }
      
      return null;
    } catch (error) {
      console.error('Error obteniendo conversaciones del caché:', error);
      return null;
    }
  }

  static async clearCache() {
    try {
      await AsyncStorage.multiRemove([
        'cached_conversations',
        'cached_messages'
      ]);
    } catch (error) {
      console.error('Error limpiando caché:', error);
    }
  }
}