# Documentación de API de Perfil de Usuario 👤

Sistema completo de perfil de usuario con estadísticas integrales y seguimiento de actividad.

## **Resumen de Endpoints**

### **🔍 Endpoints de Perfil**
| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| `GET` | `/auth/me/profile` | Obtener perfil integral del usuario actual | ✅ JWT |
| `GET` | `/users/:userId/profile` | Obtener perfil integral de cualquier usuario | ✅ JWT |

---

## **📊 GET `/auth/me/profile`**

Obtener el perfil integral del usuario autenticado.

### **Solicitud**
```http
GET /auth/me/profile
Authorization: Bearer <jwt_token>
```

### **Estructura de Respuesta**
```typescript
{
  // Información Básica del Usuario
  id: string;
  email: string;
  nombre: string;
  apellidos: string;
  fullName: string;
  status: 'online' | 'offline' | 'away' | 'busy';
  memberSince: Date;
  lastActive: Date;
  
  // Estadísticas Integrales
  stats: {
    // Participación en Proyectos
    totalProjects: number;
    ownerProjects: number;
    adminProjects: number;
    memberProjects: number;
    
    // Rendimiento en Tareas
    tasksCreated: number;
    tasksAssigned: number;
    tasksCompleted: number;
    tasksPending: number;
    tasksInProgress: number;
    completionRate: number; // porcentaje (0-100)
    
    // Actividad de Comunicación
    messagesSent: number;
    directConversations: number;
    
    // Participación en Llamadas
    callsParticipated: number;
    callsInitiated: number;
    
    // Networking
    invitationsSent: number;
    invitationsReceived: number;
    invitationsAccepted: number;
    invitationsPending: number;
    invitationAcceptanceRate: number; // porcentaje (0-100)
  };
  
  // Cronología de Actividad Reciente (últimas 15 actividades)
  recentActivity: Array<{
    type: 'task' | 'message' | 'call';
    action: string; // 'created', 'assigned', 'sent', 'initiated', 'joined'
    title: string;
    project?: string;
    recipient?: string; // para mensajes
    timestamp: Date;
    status?: string; // para tareas
  }>;
  
  // Proyectos Más Activos (top 5)
  projects: Array<{
    id: string;
    name: string;
    role: 'owner' | 'admin' | 'member';
    taskCount: number;
    messageCount: number;
  }>;
  
  // Insights Generados por IA
  insights: {
    mostActiveProject: string | null;
    averageTasksPerProject: number;
    peakActivityType: 'communication' | 'task_management';
    collaborationScore: number; // 0-100
    leadershipScore: number; // puntuación calculada
  };
}
```

### **Ejemplo de Respuesta**
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
      "title": "Implementar autenticación de usuario",
      "project": "Axon Backend",
      "timestamp": "2024-12-20T13:45:00Z",
      "status": "in_progress"
    },
    {
      "type": "message",
      "action": "sent",
      "title": "Oye, ¿puedes revisar el endpoint de perfil?",
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

Obtener el perfil integral de cualquier usuario (misma estructura que `/auth/me/profile`).

### **Solicitud**
```http
GET /users/550e8400-e29b-41d4-a716-446655440000/profile
Authorization: Bearer <jwt_token>
```

### **Parámetros de Ruta**
- `userId` (UUID) - El ID del usuario cuyo perfil se desea obtener

### **Respuesta**
Misma estructura que `/auth/me/profile` pero para el usuario especificado.

---

## **📈 Explicación de Data Insights**

### **Tasa de Finalización**
```
completionRate = (tasksCompleted / tasksAssigned) * 100
```

### **Puntuación de Colaboración**
```
collaborationScore = min(100, directConversations * 5 + callsParticipated * 10)
```

### **Puntuación de Liderazgo**
```
leadershipScore = ownerProjects * 20 + adminProjects * 10 + invitationsSent * 2
```

### **Tipo de Actividad Pico**
- `communication` - si messagesSent > tasksCreated
- `task_management` - si tasksCreated >= messagesSent

---

## **🔄 Datos en Tiempo Real**

Todas las estadísticas se calculan en tiempo real desde la base de datos:
- **Datos de proyecto** de las relaciones `ProjectMember`
- **Estadísticas de tareas** de las entidades `Task` con asociaciones de usuario
- **Conteos de mensajes** de las entidades `Message`
- **Participación en llamadas** de las entidades `CallParticipant`
- **Datos de invitación** de las entidades `ProjectInvitation`

---

## **⚡ Rendimiento**

- Utiliza **consultas paralelas** con `Promise.all()` para rendimiento óptimo
- **Índices recomendados** en campos consultados frecuentemente:
  - `tasks.createdBy`
  - `tasks.assignedTo`
  - `messages.senderId`
  - `callParticipants.userId`
  - `projectInvitations.invitedUserId`

---

## **❌ Códigos de Error**

| Código | Mensaje | Descripción |
|--------|---------|-------------|
| `401` | `unauthorized` | Token JWT inválido o expirado |
| `404` | `user-not-found` | Usuario no encontrado (solo para `/users/:userId/profile`) |
| `403` | `access-denied` | Sin permisos para ver este perfil |
| `500` | `server-error` | Error interno del servidor |

---

## **🔐 Permisos de Acceso**

### **Perfil Propio (`/auth/me/profile`)**
- ✅ Acceso completo a todas las estadísticas e insights
- ✅ Datos de actividad detallados
- ✅ Información de todos los proyectos

### **Perfil de Otros (`/users/:userId/profile`)**
- ✅ Información básica del usuario
- ✅ Estadísticas de proyectos compartidos únicamente
- ❌ Datos de actividad limitados
- ❌ Sin información de invitaciones privadas

---

## **📱 Uso en Frontend**

### **Ejemplo de Implementación**
```typescript
// Obtener perfil del usuario actual
const getUserProfile = async () => {
  try {
    const response = await fetch('/auth/me/profile', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Error al obtener perfil');
    }
    
    const profile = await response.json();
    return profile;
  } catch (error) {
    console.error('Error de perfil:', error);
    throw error;
  }
};

// Obtener perfil de otro usuario
const getOtherUserProfile = async (userId: string) => {
  try {
    const response = await fetch(`/users/${userId}/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Usuario no encontrado');
      }
      if (response.status === 403) {
        throw new Error('Sin permisos para ver este perfil');
      }
      throw new Error('Error al obtener perfil');
    }
    
    const profile = await response.json();
    return profile;
  } catch (error) {
    console.error('Error de perfil:', error);
    throw error;
  }
};
```

---

## **📊 Casos de Uso Comunes**

### **1. Dashboard de Usuario**
```typescript
const profile = await getUserProfile();
const {
  stats: { completionRate, totalProjects, tasksCompleted },
  insights: { collaborationScore, mostActiveProject }
} = profile;

// Mostrar métricas clave en el dashboard
```

### **2. Perfil de Equipo**
```typescript
const teamProfiles = await Promise.all(
  teamMembers.map(member => getOtherUserProfile(member.id))
);

// Comparar estadísticas del equipo
const teamStats = teamProfiles.map(profile => ({
  name: profile.fullName,
  completionRate: profile.stats.completionRate,
  collaborationScore: profile.insights.collaborationScore
}));
```

### **3. Análisis de Rendimiento**
```typescript
const profile = await getUserProfile();
const performanceMetrics = {
  productivity: profile.stats.completionRate,
  collaboration: profile.insights.collaborationScore,
  leadership: profile.insights.leadershipScore,
  engagement: profile.stats.callsParticipated + profile.stats.messagesSent
};
``` 