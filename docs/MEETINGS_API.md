# Documentación de API de Reuniones 📅

Sistema completo de programación de reuniones con reuniones de proyecto y personales usando tu infraestructura de video LiveKit existente.

## **Resumen de Endpoints**

### **🎯 Endpoints de Reuniones**
| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| `POST` | `/calls/meetings/project` | Programar una reunión de proyecto | ✅ JWT |
| `POST` | `/calls/meetings/personal` | Programar una reunión personal | ✅ JWT |
| `GET` | `/calls/meetings/my` | Obtener próximas reuniones del usuario | ✅ JWT |
| `GET` | `/calls/meetings/project/:projectId` | Obtener reuniones del proyecto | ✅ JWT |
| `GET` | `/calls/meetings/project/:projectId/history` | Obtener historial completo de reuniones del proyecto | ✅ JWT |
| `GET` | `/calls/meetings/:meetingId` | Obtener detalles de la reunión | ✅ JWT |
| `DELETE` | `/calls/meetings/:meetingId` | Cancelar reunión | ✅ JWT |
| `POST` | `/calls/join/:meetingId` | Unirse a reunión programada | ✅ JWT |

---

## **🏢 POST `/calls/meetings/project`**

Programar una reunión para miembros del proyecto. Todos los miembros del proyecto pueden unirse.

### **Solicitud**
```http
POST /calls/meetings/project
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "title": "Standup Diario",
  "scheduledAt": "2024-12-21T10:00:00.000Z",
  "projectId": "550e8400-e29b-41d4-a716-446655440000",
  "description": "Revisar el progreso de ayer y planificar las tareas de hoy",
  "duration": 30,
  "audioOnly": false,
  "recordCall": false
}
```

### **Campos Requeridos**
```typescript
{
  title: string;        // Título de la reunión
  scheduledAt: string;  // Cadena de fecha ISO (debe ser futura)
  projectId: string;    // UUID del proyecto
}
```

### **Campos Opcionales**
```typescript
{
  description?: string;  // Agenda/descripción de la reunión
  duration?: number;     // Duración en minutos (15-480, por defecto: 60)
  audioOnly?: boolean;   // Reunión solo de audio (por defecto: false)
  recordCall?: boolean;  // Grabar la reunión (por defecto: false)
}
```

### **Respuesta**
```json
{
  "id": "meeting-uuid",
  "roomName": "meeting_proj123_1703155200000_abc123",
  "type": "project",
  "status": "waiting",
  "title": "Standup Diario",
  "scheduledAt": "2024-12-21T10:00:00.000Z",
  "isScheduledMeeting": true,
  "description": "Revisar el progreso de ayer y planificar las tareas de hoy",
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
    "name": "Desarrollo Axon Backend"
  },
  "createdAt": "2024-12-20T15:30:00.000Z"
}
```

### **Reglas de Validación**
- ✅ El usuario debe ser miembro del proyecto
- ✅ La hora programada debe ser en el futuro
- ✅ Duración: 15-480 minutos (15 min a 8 horas)
- ✅ El proyecto debe existir

---

## **👤 POST `/calls/meetings/personal`**

Programar una reunión personal invitando usuarios específicos por email.

### **Solicitud**
```http
POST /calls/meetings/personal
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "title": "Reunión de Revisión con Cliente",
  "scheduledAt": "2024-12-21T14:00:00.000Z",
  "participantEmails": ["cliente@empresa.com", "colega@ejemplo.com"],
  "description": "Presentar resultados del Q4 y discutir objetivos del próximo trimestre",
  "duration": 90,
  "audioOnly": false,
  "recordCall": true
}
```

### **Campos Requeridos**
```typescript
{
  title: string;              // Título de la reunión
  scheduledAt: string;        // Cadena de fecha ISO (debe ser futura)
  participantEmails: string[]; // Array de direcciones de email a invitar
}
```

### **Campos Opcionales**
```typescript
{
  description?: string;  // Agenda/descripción de la reunión
  duration?: number;     // Duración en minutos (15-480, por defecto: 60)
  audioOnly?: boolean;   // Reunión solo de audio (por defecto: false)
  recordCall?: boolean;  // Grabar la reunión (por defecto: false)
}
```

### **Respuesta**
```json
{
  "id": "meeting-uuid",
  "roomName": "personal_meeting_1703160000000_xyz789",
  "type": "direct",
  "status": "waiting",
  "title": "Reunión de Revisión con Cliente",
  "scheduledAt": "2024-12-21T14:00:00.000Z",
  "isScheduledMeeting": true,
  "description": "Presentar resultados del Q4 y discutir objetivos del próximo trimestre",
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
        "email": "cliente@empresa.com"
      },
      "isConnected": false
    }
  ],
  "createdAt": "2024-12-20T15:30:00.000Z"
}
```

### **Reglas de Validación**
- ✅ La hora programada debe ser en el futuro
- ✅ Se requiere al menos un email de participante válido
- ✅ Los emails de participantes deben existir en el sistema
- ✅ Duración: 15-480 minutos

---

## **📋 GET `/calls/meetings/my`**

Obtener todas las próximas reuniones para el usuario autenticado (tanto de proyecto como personales).

### **Solicitud**
```http
GET /calls/meetings/my
Authorization: Bearer <jwt_token>
```

### **Respuesta**
```json
[
  {
    "id": "meeting1-uuid",
    "title": "Standup Diario",
    "scheduledAt": "2024-12-21T10:00:00.000Z",
    "duration": 30,
    "meetingType": "project_meeting",
    "description": "Revisar progreso",
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
    "title": "Revisión con Cliente",
    "scheduledAt": "2024-12-21T14:00:00.000Z",
    "duration": 90,
    "meetingType": "personal_meeting",
    "description": "Presentar resultados",
    "participants": [
      {
        "user": {
          "id": "client-uuid",
          "nombre": "John",
          "apellidos": "Cliente"
        }
      }
    ]
  }
]
```

---

## **🏢 GET `/calls/meetings/project/:projectId`**

Obtener todas las próximas reuniones para un proyecto específico.

### **Solicitud**
```http
GET /calls/meetings/project/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <jwt_token>
```

### **Parámetros de Ruta**
- `projectId` (UUID) - El ID del proyecto

### **Respuesta**
Misma estructura que `/calls/meetings/my` pero filtrada para el proyecto específico.

### **Reglas de Validación**
- ✅ El usuario debe ser miembro del proyecto
- ✅ El proyecto debe existir

---

## **📚 GET `/calls/meetings/project/:projectId/history`**

Obtener historial completo de reuniones del proyecto (incluyendo reuniones pasadas).

### **Solicitud**
```http
GET /calls/meetings/project/550e8400-e29b-41d4-a716-446655440000/history
Authorization: Bearer <jwt_token>
```

### **Parámetros de Consulta**
- `page` (opcional) - Número de página (por defecto: 1)
- `limit` (opcional) - Elementos por página (por defecto: 20, máximo: 100)

### **Respuesta**
```json
{
  "meetings": [
    {
      "id": "meeting-uuid",
      "title": "Standup Diario",
      "scheduledAt": "2024-12-20T10:00:00.000Z",
      "duration": 30,
      "status": "ended",
      "actualDuration": 25,
      "participantCount": 5,
      "initiator": {
        "id": "user-uuid",
        "nombre": "Victor",
        "apellidos": "Fonseca"
      }
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "totalItems": 45,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

## **🔍 GET `/calls/meetings/:meetingId`**

Obtener detalles completos de una reunión específica.

### **Solicitud**
```http
GET /calls/meetings/meeting-uuid-here
Authorization: Bearer <jwt_token>
```

### **Respuesta**
```json
{
  "id": "meeting-uuid",
  "roomName": "meeting_proj123_1703155200000_abc123",
  "type": "project",
  "status": "waiting",
  "title": "Standup Diario",
  "scheduledAt": "2024-12-21T10:00:00.000Z",
  "isScheduledMeeting": true,
  "description": "Revisar el progreso de ayer y planificar las tareas de hoy",
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
    "name": "Desarrollo Axon Backend",
    "description": "Proyecto principal de backend"
  },
  "participants": [
    {
      "user": {
        "id": "participant-uuid",
        "nombre": "John",
        "apellidos": "Doe",
        "email": "john@example.com"
      },
      "isConnected": false,
      "joinedAt": null,
      "leftAt": null
    }
  ],
  "createdAt": "2024-12-20T15:30:00.000Z",
  "updatedAt": "2024-12-20T15:30:00.000Z"
}
```

### **Reglas de Validación**
- ✅ El usuario debe ser participante o iniciador
- ✅ Para reuniones de proyecto: el usuario debe ser miembro del proyecto

---

## **❌ DELETE `/calls/meetings/:meetingId`**

Cancelar una reunión programada. Solo el iniciador puede cancelar.

### **Solicitud**
```http
DELETE /calls/meetings/meeting-uuid-here
Authorization: Bearer <jwt_token>
```

### **Respuesta**
```json
{
  "message": "meeting-cancelled",
  "meetingId": "meeting-uuid"
}
```

### **Reglas de Validación**
- ✅ Solo el iniciador puede cancelar la reunión
- ✅ La reunión debe estar en estado "waiting"
- ✅ No se pueden cancelar reuniones que ya comenzaron

---

## **🚀 POST `/calls/join/:meetingId`**

Unirse a una reunión programada. Genera un token LiveKit para la reunión.

### **Solicitud**
```http
POST /calls/join/meeting-uuid-here
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "audioOnly": false
}
```

### **Campos Opcionales**
```typescript
{
  audioOnly?: boolean;   // Unirse solo con audio (por defecto: false)
}
```

### **Respuesta**
```json
{
  "call": {
    "id": "meeting-uuid",
    "roomName": "meeting_proj123_1703155200000_abc123",
    "type": "project",
    "status": "active",
    "title": "Standup Diario",
    "isScheduledMeeting": true,
    "project": {
      "id": "project-uuid",
      "name": "Desarrollo Axon Backend"
    }
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." // Token de acceso LiveKit
}
```

### **Reglas de Validación**
- ✅ El usuario debe ser participante autorizado
- ✅ La reunión debe existir y estar programada
- ✅ Para reuniones de proyecto: el usuario debe ser miembro del proyecto
- ✅ La reunión no puede estar cancelada

---

## **⚠️ Respuestas de Error**

### **400 Bad Request**
```json
{
  "statusCode": 400,
  "message": ["title-required", "scheduledAt-must-be-future"],
  "error": "Bad Request"
}
```

### **401 Unauthorized**
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### **403 Forbidden**
```json
{
  "statusCode": 403,
  "message": "insufficient-permissions"
}
```

### **404 Not Found**
```json
{
  "statusCode": 404,
  "message": "meeting-not-found"
}
```

### **409 Conflict**
```json
{
  "statusCode": 409,
  "message": "meeting-already-started"
}
```

---

## **📱 Implementación Frontend**

### **1. Servicio de Reuniones**

```javascript
class MeetingService {
  constructor() {
    this.baseURL = process.env.API_BASE_URL || 'http://localhost:3000';
  }

  async scheduleProjectMeeting(meetingData) {
    try {
      const response = await fetch(`${this.baseURL}/calls/meetings/project`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await this.getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(meetingData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al programar reunión');
      }

      return await response.json();
    } catch (error) {
      console.error('Error programando reunión de proyecto:', error);
      throw error;
    }
  }

  async schedulePersonalMeeting(meetingData) {
    try {
      const response = await fetch(`${this.baseURL}/calls/meetings/personal`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await this.getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(meetingData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al programar reunión');
      }

      return await response.json();
    } catch (error) {
      console.error('Error programando reunión personal:', error);
      throw error;
    }
  }

  async getMyMeetings() {
    try {
      const response = await fetch(`${this.baseURL}/calls/meetings/my`, {
        headers: {
          'Authorization': `Bearer ${await this.getToken()}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al obtener reuniones');
      }

      return await response.json();
    } catch (error) {
      console.error('Error obteniendo reuniones:', error);
      throw error;
    }
  }

  async getProjectMeetings(projectId) {
    try {
      const response = await fetch(`${this.baseURL}/calls/meetings/project/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${await this.getToken()}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al obtener reuniones del proyecto');
      }

      return await response.json();
    } catch (error) {
      console.error('Error obteniendo reuniones del proyecto:', error);
      throw error;
    }
  }

  async getMeetingDetails(meetingId) {
    try {
      const response = await fetch(`${this.baseURL}/calls/meetings/${meetingId}`, {
        headers: {
          'Authorization': `Bearer ${await this.getToken()}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al obtener detalles de la reunión');
      }

      return await response.json();
    } catch (error) {
      console.error('Error obteniendo detalles de la reunión:', error);
      throw error;
    }
  }

  async joinMeeting(meetingId, audioOnly = false) {
    try {
      const response = await fetch(`${this.baseURL}/calls/join/${meetingId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await this.getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ audioOnly })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al unirse a la reunión');
      }

      return await response.json();
    } catch (error) {
      console.error('Error uniéndose a la reunión:', error);
      throw error;
    }
  }

  async cancelMeeting(meetingId) {
    try {
      const response = await fetch(`${this.baseURL}/calls/meetings/${meetingId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${await this.getToken()}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al cancelar reunión');
      }

      return await response.json();
    } catch (error) {
      console.error('Error cancelando reunión:', error);
      throw error;
    }
  }

  async getToken() {
    // Implementar según tu método de almacenamiento de tokens
    return await AsyncStorage.getItem('access_token');
  }
}

export default new MeetingService();
```

### **2. Componente de Programación de Reunión**

```jsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import MeetingService from '../services/meetingService';

const ScheduleMeetingScreen = ({ navigation, route }) => {
  const { projectId, meetingType } = route.params;
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    scheduledAt: new Date(),
    duration: 60,
    audioOnly: false,
    recordCall: false,
    participantEmails: []
  });
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const handleScheduleMeeting = async () => {
    if (!formData.title.trim()) {
      Alert.alert('Error', 'El título es requerido');
      return;
    }

    setLoading(true);

    try {
      let result;
      if (meetingType === 'project') {
        result = await MeetingService.scheduleProjectMeeting({
          ...formData,
          projectId
        });
      } else {
        result = await MeetingService.schedulePersonalMeeting(formData);
      }

      Alert.alert(
        'Éxito',
        'Reunión programada exitosamente',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>
        {meetingType === 'project' ? 'Programar Reunión de Proyecto' : 'Programar Reunión Personal'}
      </Text>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Título *</Text>
        <TextInput
          style={styles.input}
          value={formData.title}
          onChangeText={(text) => updateFormData('title', text)}
          placeholder="Ingrese el título de la reunión"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Descripción</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={formData.description}
          onChangeText={(text) => updateFormData('description', text)}
          placeholder="Agenda o descripción de la reunión"
          multiline
          numberOfLines={4}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Fecha y Hora *</Text>
        <TouchableOpacity
          style={styles.input}
          onPress={() => setShowDatePicker(true)}
        >
          <Text>
            {formData.scheduledAt.toLocaleDateString()} {formData.scheduledAt.toLocaleTimeString()}
          </Text>
        </TouchableOpacity>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={formData.scheduledAt}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) {
              updateFormData('scheduledAt', selectedDate);
              setShowTimePicker(true);
            }
          }}
        />
      )}

      {showTimePicker && (
        <DateTimePicker
          value={formData.scheduledAt}
          mode="time"
          display="default"
          onChange={(event, selectedTime) => {
            setShowTimePicker(false);
            if (selectedTime) {
              updateFormData('scheduledAt', selectedTime);
            }
          }}
        />
      )}

      <View style={styles.formGroup}>
        <Text style={styles.label}>Duración (minutos)</Text>
        <TextInput
          style={styles.input}
          value={formData.duration.toString()}
          onChangeText={(text) => updateFormData('duration', parseInt(text) || 60)}
          keyboardType="numeric"
          placeholder="60"
        />
      </View>

      {meetingType === 'personal' && (
        <View style={styles.formGroup}>
          <Text style={styles.label}>Emails de Participantes *</Text>
          <TextInput
            style={styles.input}
            value={formData.participantEmails.join(', ')}
            onChangeText={(text) => updateFormData('participantEmails', text.split(',').map(email => email.trim()))}
            placeholder="email1@ejemplo.com, email2@ejemplo.com"
          />
        </View>
      )}

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleScheduleMeeting}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Programando...' : 'Programar Reunión'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center'
  },
  formGroup: {
    marginBottom: 20
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333'
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff'
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top'
  },
  button: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20
  },
  buttonDisabled: {
    backgroundColor: '#ccc'
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold'
  }
});

export default ScheduleMeetingScreen;
```

### **3. Lista de Reuniones**

```jsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert
} from 'react-native';
import MeetingService from '../services/meetingService';

const MeetingsListScreen = ({ navigation }) => {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadMeetings();
  }, []);

  const loadMeetings = async () => {
    try {
      const data = await MeetingService.getMyMeetings();
      setMeetings(data);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar las reuniones');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleJoinMeeting = async (meetingId) => {
    try {
      const { call, token } = await MeetingService.joinMeeting(meetingId);
      
      // Navegar a pantalla de videollamada
      navigation.navigate('VideoCall', {
        call,
        token
      });
    } catch (error) {
      Alert.alert('Error', 'No se pudo unir a la reunión');
    }
  };

  const handleCancelMeeting = (meetingId) => {
    Alert.alert(
      'Cancelar Reunión',
      '¿Estás seguro de que quieres cancelar esta reunión?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, Cancelar',
          style: 'destructive',
          onPress: async () => {
            try {
              await MeetingService.cancelMeeting(meetingId);
              loadMeetings(); // Recargar lista
              Alert.alert('Éxito', 'Reunión cancelada');
            } catch (error) {
              Alert.alert('Error', 'No se pudo cancelar la reunión');
            }
          }
        }
      ]
    );
  };

  const renderMeeting = ({ item }) => {
    const meetingDate = new Date(item.scheduledAt);
    const isUpcoming = meetingDate > new Date();
    const canJoin = isUpcoming && (meetingDate.getTime() - Date.now()) < 15 * 60 * 1000; // 15 min antes

    return (
      <View style={styles.meetingCard}>
        <View style={styles.meetingHeader}>
          <Text style={styles.meetingTitle}>{item.title}</Text>
          <Text style={styles.meetingType}>
            {item.meetingType === 'project_meeting' ? 'Proyecto' : 'Personal'}
          </Text>
        </View>

        <Text style={styles.meetingTime}>
          {meetingDate.toLocaleDateString()} a las {meetingDate.toLocaleTimeString()}
        </Text>

        <Text style={styles.meetingDuration}>
          Duración: {item.duration} minutos
        </Text>

        {item.description && (
          <Text style={styles.meetingDescription}>{item.description}</Text>
        )}

        {item.project && (
          <Text style={styles.projectName}>Proyecto: {item.project.name}</Text>
        )}

        <View style={styles.meetingActions}>
          {canJoin && (
            <TouchableOpacity
              style={[styles.actionButton, styles.joinButton]}
              onPress={() => handleJoinMeeting(item.id)}
            >
              <Text style={styles.actionButtonText}>Unirse</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.actionButton, styles.cancelButton]}
            onPress={() => handleCancelMeeting(item.id)}
          >
            <Text style={styles.actionButtonText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text>Cargando reuniones...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={meetings}
        renderItem={renderMeeting}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadMeetings();
            }}
          />
        }
        ListEmptyComponent={
          <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>No tienes reuniones programadas</Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('ScheduleMeeting')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  meetingCard: {
    backgroundColor: 'white',
    margin: 10,
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  meetingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  meetingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1
  },
  meetingType: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10
  },
  meetingTime: {
    fontSize: 16,
    color: '#007bff',
    marginBottom: 5
  },
  meetingDuration: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5
  },
  meetingDescription: {
    fontSize: 14,
    color: '#333',
    marginBottom: 10
  },
  projectName: {
    fontSize: 14,
    color: '#28a745',
    fontWeight: 'bold',
    marginBottom: 10
  },
  meetingActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10
  },
  actionButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5
  },
  joinButton: {
    backgroundColor: '#28a745'
  },
  cancelButton: {
    backgroundColor: '#dc3545'
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold'
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center'
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },
  fabText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold'
  }
});

export default MeetingsListScreen;
```

---

## **🔒 Consideraciones de Seguridad**

### **Validaciones del Backend**
- ✅ Solo miembros del proyecto pueden programar/ver reuniones de proyecto
- ✅ Solo participantes pueden unirse a reuniones personales
- ✅ Solo el iniciador puede cancelar reuniones
- ✅ Las reuniones solo se pueden programar en el futuro
- ✅ Duración limitada (15 min - 8 horas)

### **Tokens LiveKit**
- ✅ Los tokens se generan solo para participantes autorizados
- ✅ Los tokens tienen metadatos de usuario para mostrar nombres apropiados
- ✅ Los tokens expiran según la duración de la reunión

### **Notificaciones**
- ✅ Se envían automáticamente cuando se programan reuniones
- ✅ Recordatorios antes de que comience la reunión
- ✅ Notificaciones de cancelación

---

## **📊 Casos de Uso**

### **1. Reuniones Recurrentes**
```javascript
const scheduleRecurringMeeting = async (meetingData, recurrence) => {
  const meetings = [];
  const { pattern, interval, endDate } = recurrence;
  
  let currentDate = new Date(meetingData.scheduledAt);
  const end = new Date(endDate);
  
  while (currentDate <= end) {
    const meeting = await MeetingService.scheduleProjectMeeting({
      ...meetingData,
      scheduledAt: currentDate.toISOString(),
      title: `${meetingData.title} - ${currentDate.toLocaleDateString()}`
    });
    
    meetings.push(meeting);
    
    // Incrementar fecha según patrón
    if (pattern === 'daily') {
      currentDate.setDate(currentDate.getDate() + interval);
    } else if (pattern === 'weekly') {
      currentDate.setDate(currentDate.getDate() + (7 * interval));
    }
  }
  
  return meetings;
};
```

### **2. Integración con Calendario**
```javascript
const exportToCalendar = (meeting) => {
  const startDate = new Date(meeting.scheduledAt);
  const endDate = new Date(startDate.getTime() + (meeting.duration * 60000));
  
  const calendarEvent = {
    title: meeting.title,
    description: meeting.description,
    start: startDate.toISOString(),
    end: endDate.toISOString(),
    location: `Reunión Virtual - ${meeting.roomName}`
  };
  
  // Exportar a Google Calendar, Outlook, etc.
  return calendarEvent;
};
```

### **3. Estadísticas de Reuniones**
```javascript
const getMeetingAnalytics = async (projectId) => {
  const history = await MeetingService.getProjectMeetingHistory(projectId);
  
  return {
    totalMeetings: history.meetings.length,
    averageDuration: history.meetings.reduce((sum, m) => sum + (m.actualDuration || m.duration), 0) / history.meetings.length,
    participationRate: calculateParticipationRate(history.meetings),
    mostActiveDay: getMostActiveDay(history.meetings)
  };
};
```

---

¡Con esta implementación tienes un sistema completo de reuniones programadas integrado con tu infraestructura de videollamadas LiveKit! 📅✨
