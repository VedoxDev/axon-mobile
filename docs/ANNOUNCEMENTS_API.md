# Documentación de API de Anuncios

## Resumen

La API de Anuncios permite a los administradores y propietarios de proyectos crear anuncios para sus proyectos, y proporciona a los usuarios un área personal para ver todos los anuncios de sus proyectos con capacidades de seguimiento de lectura.

## Características

- ✅ **Anuncios basados en proyecto** con diferentes tipos (info, warning, success, urgent)
- ✅ **Control de permisos** (solo admins/propietarios pueden crear anuncios)
- ✅ **Seguimiento de lectura** por usuario en todos los anuncios
- ✅ **Anuncios fijados** para mensajes importantes
- ✅ **Panel personal** mostrando todos los anuncios de los proyectos del usuario
- ✅ **Contadores de no leídos** y estadísticas para mejor experiencia de usuario

## Endpoints

### 1. Crear Anuncio de Proyecto

**URL:** `POST /projects/:projectId/announcements`

**Autenticación:** Requerida (JWT Bearer Token)

**Autorización:** Permiso `MANAGE_ANNOUNCEMENTS` (solo admin/propietario)

**Content-Type:** `application/json`

#### Cuerpo de Solicitud

```json
{
  "title": "string",
  "content": "string",
  "type": "info" | "warning" | "success" | "urgent",
  "pinned": boolean
}
```

#### Requisitos de Campos

| Campo | Tipo | Requerido | Descripción |
|-------|------|----------|-------------|
| `title` | string | Sí | Título del anuncio (3-200 caracteres) |
| `content` | string | Sí | Contenido del anuncio (10-2000 caracteres) |
| `type` | enum | No | Tipo de anuncio (por defecto: "info") |
| `pinned` | boolean | No | Fijar anuncio arriba (por defecto: false) |

#### Tipos de Anuncio

- **`info`** - Información general (estilo azul/por defecto)
- **`warning`** - Advertencias importantes (estilo amarillo/naranja)
- **`success`** - Notificaciones de éxito (estilo verde)
- **`urgent`** - Mensajes críticos urgentes (estilo rojo)

### 2. Obtener Anuncios del Proyecto

**URL:** `GET /projects/:projectId/announcements`

**Autenticación:** Requerida (JWT Bearer Token)

**Autorización:** Permiso `VIEW_PROJECT` (todos los miembros del proyecto)

### 3. Obtener Anuncios del Usuario (Área Personal)

**URL:** `GET /auth/me/announcements`

**Autenticación:** Requerida (JWT Bearer Token)

**Autorización:** Ninguna (datos propios del usuario)

### 4. Marcar Anuncio como Leído

**URL:** `PUT /announcements/:announcementId/read`

**Autenticación:** Requerida (JWT Bearer Token)

**Autorización:** El usuario debe ser miembro del proyecto que contiene el anuncio

## Formatos de Respuesta

### Crear Anuncio - Respuesta de Éxito

**Código de Estado:** `201 Created`

```json
{
  "message": "announcement-created-successfully",
  "announcement": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Lanzamiento de Nueva Característica",
    "content": "¡Hemos lanzado una nueva función de chat! Échale un vistazo en la barra lateral.",
    "type": "success",
    "pinned": true,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### Obtener Anuncios del Proyecto - Respuesta de Éxito

**Código de Estado:** `200 OK`

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Lanzamiento de Nueva Característica",
    "content": "¡Hemos lanzado una nueva función de chat! Échale un vistazo en la barra lateral.",
    "type": "success",
    "pinned": true,
    "createdBy": {
      "id": "user-123",
      "nombre": "John",
      "apellidos": "Doe",
      "fullName": "John Doe"
    },
    "isRead": false,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  },
  {
    "id": "announcement-456",
    "title": "Actualización de Proyecto",
    "content": "Por favor actualiza el estado de tus tareas antes del fin de semana.",
    "type": "info",
    "pinned": false,
    "createdBy": {
      "id": "user-789",
      "nombre": "Jane",
      "apellidos": "Smith",
      "fullName": "Jane Smith"
    },
    "isRead": true,
    "createdAt": "2024-01-14T15:20:00.000Z",
    "updatedAt": "2024-01-14T15:20:00.000Z"
  }
]
```

### Obtener Anuncios del Usuario - Respuesta de Éxito

**Código de Estado:** `200 OK`

```json
{
  "announcements": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Lanzamiento de Nueva Característica",
      "content": "¡Hemos lanzado una nueva función de chat! Échale un vistazo en la barra lateral.",
      "type": "success",
      "pinned": true,
      "project": {
        "id": "project-123",
        "name": "Mi Proyecto"
      },
      "createdBy": {
        "id": "user-123",
        "nombre": "John",
        "apellidos": "Doe",
        "fullName": "John Doe"
      },
      "isRead": false,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "unreadCount": 3,
  "stats": {
    "total": 10,
    "unread": 3,
    "urgent": 1, 
    "pinned": 2
  }
}
```

### Marcar como Leído - Respuesta de Éxito

**Código de Estado:** `200 OK`

```json
{
  "message": "announcement-marked-as-read"
}
```

```json
{
  "message": "announcement-already-read"
}
```

## Respuestas de Error

### Errores de Autenticación

**Código de Estado:** `401 Unauthorized`

```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### Errores de Autorización

**Código de Estado:** `403 Forbidden`

```json
{
  "statusCode": 403,
  "message": "insufficient-permissions"
}
```

### Errores de Validación

**Código de Estado:** `400 Bad Request`

```json
{
  "statusCode": 400,
  "message": [
    "title must be longer than or equal to 3 characters",
    "content must be longer than or equal to 10 characters"
  ],
  "error": "Bad Request"
}
```

### Proyecto No Encontrado

**Código de Estado:** `404 Not Found`

```json
{
  "statusCode": 404,
  "message": "project-not-found"
}
```

### Anuncio No Encontrado

**Código de Estado:** `404 Not Found`

```json
{
  "statusCode": 404,
  "message": "announcement-not-found"
}
```

---

## Ejemplo de Implementación Frontend

### React Native Hook

```typescript
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'success' | 'urgent';
  pinned: boolean;
  isRead: boolean;
  project?: {
    id: string;
    name: string;
  };
  createdBy: {
    id: string;
    nombre: string;
    apellidos: string;
    fullName: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface AnnouncementsResponse {
  announcements: Announcement[];
  unreadCount: number;
  stats: {
    total: number;
    unread: number;
    urgent: number;
    pinned: number;
  };
}

export const useAnnouncements = () => {
  const [announcements, setAnnouncements] = useState<AnnouncementsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getToken = async () => {
    return await AsyncStorage.getItem('access_token');
  };

  const fetchUserAnnouncements = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      
      const response = await fetch('http://localhost:3000/auth/me/announcements', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al cargar anuncios');
      }

      const data = await response.json();
      setAnnouncements(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (announcementId: string) => {
    try {
      const token = await getToken();
      
      const response = await fetch(`http://localhost:3000/announcements/${announcementId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Actualizar el estado local
        setAnnouncements(prev => {
          if (!prev) return prev;
          
          return {
            ...prev,
            announcements: prev.announcements.map(ann => 
              ann.id === announcementId ? { ...ann, isRead: true } : ann
            ),
            unreadCount: Math.max(0, prev.unreadCount - 1),
            stats: {
              ...prev.stats,
              unread: Math.max(0, prev.stats.unread - 1)
            }
          };
        });
      }
    } catch (err) {
      console.error('Error marcando anuncio como leído:', err);
    }
  };

  const createProjectAnnouncement = async (
    projectId: string, 
    announcementData: {
      title: string;
      content: string;
      type?: 'info' | 'warning' | 'success' | 'urgent';
      pinned?: boolean;
    }
  ) => {
    try {
      const token = await getToken();
      
      const response = await fetch(`http://localhost:3000/projects/${projectId}/announcements`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(announcementData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al crear anuncio');
      }

      const result = await response.json();
      
      // Recargar anuncios después de crear uno nuevo
      await fetchUserAnnouncements();
      
      return result;
    } catch (err) {
      throw err;
    }
  };

  useEffect(() => {
    fetchUserAnnouncements();
  }, []);

  return {
    announcements,
    loading,
    error,
    refetch: fetchUserAnnouncements,
    markAsRead,
    createProjectAnnouncement,
  };
};
```

### Componente de Lista de Anuncios

```tsx
import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useAnnouncements } from '../hooks/useAnnouncements';

const AnnouncementsScreen = () => {
  const { announcements, loading, error, refetch, markAsRead } = useAnnouncements();

  const getAnnouncementColor = (type: string) => {
    switch (type) {
      case 'urgent': return '#dc3545';
      case 'warning': return '#ffc107';
      case 'success': return '#28a745';
      default: return '#007bff';
    }
  };

  const getAnnouncementIcon = (type: string) => {
    switch (type) {
      case 'urgent': return '🚨';
      case 'warning': return '⚠️';
      case 'success': return '✅';
      default: return 'ℹ️';
    }
  };

  const renderAnnouncement = ({ item }: { item: any }) => {
    const handlePress = () => {
      if (!item.isRead) {
        markAsRead(item.id);
      }
    };

    return (
      <TouchableOpacity
        style={[
          styles.announcementCard,
          !item.isRead && styles.unreadCard,
          item.pinned && styles.pinnedCard
        ]}
        onPress={handlePress}
      >
        <View style={styles.announcementHeader}>
          <View style={styles.typeIndicator}>
            <Text style={styles.typeIcon}>{getAnnouncementIcon(item.type)}</Text>
            <Text style={[styles.typeText, { color: getAnnouncementColor(item.type) }]}>
              {item.type.toUpperCase()}
            </Text>
          </View>
          
          {item.pinned && <Text style={styles.pinnedBadge}>📌 FIJADO</Text>}
          {!item.isRead && <View style={styles.unreadDot} />}
        </View>

        <Text style={styles.announcementTitle}>{item.title}</Text>
        <Text style={styles.announcementContent} numberOfLines={3}>
          {item.content}
        </Text>

        <View style={styles.announcementFooter}>
          <Text style={styles.projectName}>{item.project?.name}</Text>
          <Text style={styles.createdBy}>
            Por {item.createdBy.fullName}
          </Text>
          <Text style={styles.createdAt}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text>Cargando anuncios...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={refetch}>
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {announcements && (
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Anuncios</Text>
          <View style={styles.statsContainer}>
            <Text style={styles.statsText}>
              Total: {announcements.stats.total} | 
              No leídos: {announcements.stats.unread} | 
              Urgentes: {announcements.stats.urgent}
            </Text>
          </View>
        </View>
      )}

      <FlatList
        data={announcements?.announcements || []}
        renderItem={renderAnnouncement}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refetch} />
        }
        ListEmptyComponent={
          <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>No hay anuncios disponibles</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  statsContainer: {
    marginTop: 8,
  },
  statsText: {
    fontSize: 14,
    color: '#666',
  },
  announcementCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#007bff',
  },
  pinnedCard: {
    borderTopWidth: 3,
    borderTopColor: '#ffc107',
  },
  announcementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  typeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  pinnedBadge: {
    fontSize: 10,
    color: '#856404',
    backgroundColor: '#fff3cd',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007bff',
  },
  announcementTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  announcementContent: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  announcementFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  projectName: {
    fontSize: 12,
    color: '#28a745',
    fontWeight: 'bold',
  },
  createdBy: {
    fontSize: 12,
    color: '#666',
  },
  createdAt: {
    fontSize: 12,
    color: '#999',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default AnnouncementsScreen;
```

### Formulario de Crear Anuncio

```tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Switch,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useAnnouncements } from '../hooks/useAnnouncements';

interface CreateAnnouncementFormProps {
  projectId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const CreateAnnouncementForm: React.FC<CreateAnnouncementFormProps> = ({
  projectId,
  onSuccess,
  onCancel,
}) => {
  const { createProjectAnnouncement } = useAnnouncements();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'info' as 'info' | 'warning' | 'success' | 'urgent',
    pinned: false,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      Alert.alert('Error', 'Título y contenido son requeridos');
      return;
    }

    setLoading(true);
    try {
      await createProjectAnnouncement(projectId, formData);
      Alert.alert('Éxito', 'Anuncio creado exitosamente');
      onSuccess?.();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Error al crear anuncio');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Crear Nuevo Anuncio</Text>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Título *</Text>
        <TextInput
          style={styles.input}
          value={formData.title}
          onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
          placeholder="Ingrese el título del anuncio"
          maxLength={200}
        />
        <Text style={styles.characterCount}>{formData.title.length}/200</Text>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Contenido *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={formData.content}
          onChangeText={(text) => setFormData(prev => ({ ...prev, content: text }))}
          placeholder="Escriba el contenido del anuncio"
          multiline
          numberOfLines={6}
          maxLength={2000}
        />
        <Text style={styles.characterCount}>{formData.content.length}/2000</Text>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Tipo de Anuncio</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={formData.type}
            onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
          >
            <Picker.Item label="ℹ️ Información" value="info" />
            <Picker.Item label="⚠️ Advertencia" value="warning" />
            <Picker.Item label="✅ Éxito" value="success" />
            <Picker.Item label="🚨 Urgente" value="urgent" />
          </Picker>
        </View>
      </View>

      <View style={styles.formGroup}>
        <View style={styles.switchContainer}>
          <Text style={styles.label}>Fijar anuncio</Text>
          <Switch
            value={formData.pinned}
            onValueChange={(value) => setFormData(prev => ({ ...prev, pinned: value }))}
          />
        </View>
        <Text style={styles.helpText}>
          Los anuncios fijados aparecen al principio de la lista
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={onCancel}
        >
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.submitButton, loading && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'Creando...' : 'Crear Anuncio'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: 'white',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 4,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  helpText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 32,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: '#6c757d',
  },
  submitButton: {
    backgroundColor: '#007bff',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CreateAnnouncementForm;
```

---

## Validaciones y Permisos

### Validaciones del Backend
- ✅ Título: 3-200 caracteres
- ✅ Contenido: 10-2000 caracteres
- ✅ Tipo: Solo valores permitidos (info, warning, success, urgent)
- ✅ Solo administradores/propietarios pueden crear anuncios

### Control de Acceso
- ✅ Solo miembros del proyecto pueden ver anuncios del proyecto
- ✅ Solo administradores/propietarios pueden crear anuncios
- ✅ Cualquier miembro puede marcar anuncios como leídos

### Seguridad
- ✅ Sanitización de contenido HTML
- ✅ Rate limiting en creación de anuncios
- ✅ Validación de permisos en cada endpoint

---

## Consideraciones de Rendimiento

### Optimizaciones
- ✅ Paginación en endpoints de listado
- ✅ Índices en base de datos para consultas eficientes
- ✅ Cache de estadísticas de anuncios
- ✅ Lazy loading en frontend

### Límites
- **Máximo 50 anuncios** por solicitud en listados
- **Rate limit:** 10 anuncios por hora por usuario
- **Retención:** Anuncios se conservan por 1 año

---

¡Con esta implementación tienes un sistema completo de anuncios para mantener a los equipos informados! 📢✨ 