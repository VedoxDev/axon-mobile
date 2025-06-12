# Documentación de API de Tareas 📋

## Resumen
El sistema de Tareas soporta tanto **tareas personales** como **tareas de proyecto** con operaciones CRUD completas, subtareas y etiquetas.

## Sistema de Prioridades 🎨
- **Prioridad 1 (Baja):** `#10B981` (Verde) ⬇️
- **Prioridad 2 (Media):** `#F59E0B` (Ámbar) ➡️
- **Prioridad 3 (Alta):** `#EF4444` (Rojo) ⬆️
- **Prioridad 4 (Crítica):** `#7C3AED` (Púrpura) 🔥

## Estado de Tareas
- `todo` - Sin comenzar
- `in_progress` - Actualmente en trabajo
- `done` - Completado

---

## 🚀 Endpoints de Tareas

### Crear Tarea
```http
POST /tasks
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "title": "Corregir bug de login",
  "description": "Los usuarios no pueden iniciar sesión con caracteres especiales en el email",
  "projectId": "uuid-here", // Opcional - omitir para tarea personal
  "sectionId": 1, // Opcional - omitir para sin sección
  "assigneeIds": ["user-uuid-1", "user-uuid-2"], // Opcional
  "labelIds": [1, 2], // Opcional
  "priority": 3, // 1-4, por defecto: 2
  "dueDate": "2024-01-15T10:00:00Z", // Opcional
  "status": "todo" // Opcional, por defecto: "todo"
}
```

**Respuesta:**
```json
{
  "id": "task-uuid",
  "title": "Corregir bug de login",
  "description": "Los usuarios no pueden iniciar sesión con caracteres especiales en el email",
  "priority": 3,
  "status": "todo",
  "dueDate": "2024-01-15T10:00:00.000Z",
  "order": 1,
  "project": { "id": "project-uuid", "name": "Axon Backend" },
  "section": { "id": 1, "name": "En Progreso" },
  "createdBy": { "id": "user-uuid", "nombre": "Victor", "apellidos": "Fonseca" },
  "assignees": [
    { "id": "user-uuid-1", "nombre": "John", "apellidos": "Doe" }
  ],
  "labels": [
    { "id": 1, "name": "Bug", "color": "#EF4444" }
  ],
  "subtasks": [],
  "createdAt": "2024-01-10T10:00:00.000Z",
  "updatedAt": "2024-01-10T10:00:00.000Z"
}
```

### Obtener Tareas Personales
```http
GET /tasks/personal
Authorization: Bearer <jwt-token>
```

### Obtener Tareas del Proyecto
```http
GET /tasks/project/{projectId}
Authorization: Bearer <jwt-token>
```

### Obtener Tareas de la Sección
```http
GET /tasks/project/{projectId}/section/{sectionId}
Authorization: Bearer <jwt-token>
```

### Obtener Tarea por ID
```http
GET /tasks/{taskId}
Authorization: Bearer <jwt-token>
```

### Actualizar Tarea
```http
PUT /tasks/{taskId}
Authorization: Bearer <jwt-token>

{
  "title": "Título actualizado",
  "status": "in_progress",
  "priority": 4,
  "assigneeIds": ["new-user-uuid"]
  // Cualquier campo de CreateTaskDto puede ser actualizado
}
```

### Eliminar Tarea
```http
DELETE /tasks/{taskId}
Authorization: Bearer <jwt-token>
```

---

## 📝 Endpoints de Subtareas

### Crear Subtarea
```http
POST /tasks/{taskId}/subtasks
Authorization: Bearer <jwt-token>

{
  "title": "Escribir pruebas unitarias",
  "description": "Agregar pruebas para la función de login",
  "order": 1 // Opcional
}
```

### Actualizar Subtarea
```http
PUT /tasks/{taskId}/subtasks/{subtaskId}
Authorization: Bearer <jwt-token>

{
  "title": "Título de subtarea actualizado",
  "completed": true,
  "description": "Descripción actualizada"
}
```

### Eliminar Subtarea
```http
DELETE /tasks/{taskId}/subtasks/{subtaskId}
Authorization: Bearer <jwt-token>
```

---

## 🏷️ Endpoints de Etiquetas

### Crear Etiqueta del Proyecto
```http
POST /tasks/projects/{projectId}/labels
Authorization: Bearer <jwt-token>

{
  "name": "Bug",
  "color": "#EF4444"
}
```

### Obtener Etiquetas del Proyecto
```http
GET /tasks/projects/{projectId}/labels
Authorization: Bearer <jwt-token>
```

### Actualizar Etiqueta
```http
PUT /tasks/projects/{projectId}/labels/{labelId}
Authorization: Bearer <jwt-token>

{
  "name": "Bug Crítico",
  "color": "#7C3AED"
}
```

### Eliminar Etiqueta
```http
DELETE /tasks/projects/{projectId}/labels/{labelId}
Authorization: Bearer <jwt-token>
```

---

## 💡 Ejemplos de Uso

### Creando una Tarea Personal
```javascript
const personalTask = {
  "title": "Actualizar currículum",
  "description": "Agregar nuevas habilidades y proyectos recientes",
  "priority": 2,
  "dueDate": "2024-01-20T18:00:00Z"
  // Sin projectId = tarea personal
};

fetch('/tasks', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(personalTask)
});
```

### Creando una Tarea de Proyecto con Asignados
```javascript
const projectTask = {
  "title": "Implementar notificaciones en tiempo real",
  "description": "Agregar soporte WebSocket para actualizaciones en vivo",
  "projectId": "project-uuid",
  "sectionId": 2, // Sección "En Progreso"
  "assigneeIds": ["dev1-uuid", "dev2-uuid"],
  "labelIds": [1, 3], // ["Funcionalidad", "Alta Prioridad"]
  "priority": 3,
  "dueDate": "2024-01-25T09:00:00Z"
};
```

### Mover Tarea Entre Secciones
```javascript
// Mover tarea a sección "Completado"
fetch(`/tasks/${taskId}`, {
  method: 'PUT',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    "sectionId": 3, // Sección "Completado"
    "status": "done"
  })
});
```

### Creando Subtareas para Tarjetas Kanban
```javascript
const subtasks = [
  { "title": "Diseñar esquema de base de datos", "order": 1 },
  { "title": "Crear endpoints de API", "order": 2 },
  { "title": "Agregar pruebas unitarias", "order": 3 },
  { "title": "Actualizar documentación", "order": 4 }
];

for (const subtask of subtasks) {
  await fetch(`/tasks/${taskId}/subtasks`, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(subtask)
  });
}
```

---

## ❌ Respuestas de Error

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": ["title-required", "invalid-priority"],
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
  "message": "task-not-found"
}
```

---

## 🎯 Casos de Uso Avanzados

### Sistema de Tablero Kanban Completo
```javascript
class KanbanTaskManager {
  constructor(projectId) {
    this.projectId = projectId;
    this.sections = [];
    this.tasks = {};
  }
  
  async loadBoard() {
    // Cargar secciones
    const sectionsResponse = await fetch(`/projects/${this.projectId}/sections`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    this.sections = await sectionsResponse.json();
    
    // Cargar tareas para cada sección
    for (const section of this.sections) {
      const tasksResponse = await fetch(`/tasks/project/${this.projectId}/section/${section.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      this.tasks[section.id] = await tasksResponse.json();
    }
  }
  
  async moveTask(taskId, fromSectionId, toSectionId) {
    // Actualizar tarea en servidor
    await fetch(`/tasks/${taskId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ sectionId: toSectionId })
    });
    
    // Actualizar estado local
    const task = this.tasks[fromSectionId].find(t => t.id === taskId);
    this.tasks[fromSectionId] = this.tasks[fromSectionId].filter(t => t.id !== taskId);
    this.tasks[toSectionId].push({ ...task, sectionId: toSectionId });
  }
  
  async createTaskWithSubtasks(taskData, subtasks = []) {
    // Crear tarea principal
    const taskResponse = await fetch('/tasks', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(taskData)
    });
    
    const task = await taskResponse.json();
    
    // Crear subtareas
    for (const subtask of subtasks) {
      await fetch(`/tasks/${task.id}/subtasks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(subtask)
      });
    }
    
    return task;
  }
}
```

### Gestión de Etiquetas con Colores
```javascript
class TaskLabelManager {
  constructor(projectId) {
    this.projectId = projectId;
    this.predefinedColors = [
      '#EF4444', '#F59E0B', '#10B981', '#3B82F6', 
      '#8B5CF6', '#EC4899', '#6B7280', '#059669'
    ];
  }
  
  async createLabel(name, color = null) {
    // Asignar color automáticamente si no se proporciona
    if (!color) {
      const existingLabels = await this.getLabels();
      color = this.predefinedColors[existingLabels.length % this.predefinedColors.length];
    }
    
    const response = await fetch(`/tasks/projects/${this.projectId}/labels`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, color })
    });
    
    return await response.json();
  }
  
  async getLabels() {
    const response = await fetch(`/tasks/projects/${this.projectId}/labels`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return await response.json();
  }
  
  async bulkCreateLabels(labelNames) {
    const labels = [];
    for (const name of labelNames) {
      try {
        const label = await this.createLabel(name);
        labels.push(label);
      } catch (error) {
        console.error(`Error creando etiqueta ${name}:`, error);
      }
    }
    return labels;
  }
}

// Uso
const labelManager = new TaskLabelManager('project-uuid');
await labelManager.bulkCreateLabels([
  'Bug', 'Funcionalidad', 'Mejora', 'Documentación', 
  'Pruebas', 'Refactoring', 'Urgente', 'Investigación'
]);
```

### Sistema de Asignación Inteligente
```javascript
class SmartTaskAssignment {
  constructor(projectId) {
    this.projectId = projectId;
  }
  
  async getTeamWorkload() {
    const projectTasks = await fetch(`/tasks/project/${this.projectId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const tasks = await projectTasks.json();
    
    // Calcular carga de trabajo por usuario
    const workload = {};
    tasks.forEach(task => {
      if (task.status !== 'done') {
        task.assignees.forEach(assignee => {
          if (!workload[assignee.id]) {
            workload[assignee.id] = {
              user: assignee,
              tasks: 0,
              priorities: { 1: 0, 2: 0, 3: 0, 4: 0 }
            };
          }
          workload[assignee.id].tasks++;
          workload[assignee.id].priorities[task.priority]++;
        });
      }
    });
    
    return workload;
  }
  
  async assignTaskAutomatically(taskData) {
    const workload = await this.getTeamWorkload();
    
    // Encontrar usuario con menor carga de trabajo
    const leastBusyUser = Object.values(workload)
      .sort((a, b) => {
        // Priorizar por tareas críticas, luego por total
        const aScore = a.priorities[4] * 4 + a.priorities[3] * 2 + a.tasks;
        const bScore = b.priorities[4] * 4 + b.priorities[3] * 2 + b.tasks;
        return aScore - bScore;
      })[0];
    
    if (leastBusyUser) {
      taskData.assigneeIds = [leastBusyUser.user.id];
    }
    
    return await this.createTask(taskData);
  }
  
  async createTask(taskData) {
    const response = await fetch('/tasks', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(taskData)
    });
    
    return await response.json();
  }
}
```

---

## 🔐 Consideraciones de Seguridad

### Permisos por Tipo de Tarea
- **Tareas Personales**: Solo el creador puede ver/editar
- **Tareas de Proyecto**: Todos los miembros del proyecto pueden ver
- **Edición**: Solo asignados, creador, admins y propietarios pueden editar
- **Eliminación**: Solo creador, admins y propietarios pueden eliminar

### Validación de Datos
```javascript
const validateTaskData = (taskData) => {
  const errors = [];
  
  if (!taskData.title || taskData.title.trim().length < 3) {
    errors.push('El título debe tener al menos 3 caracteres');
  }
  
  if (taskData.priority && (taskData.priority < 1 || taskData.priority > 4)) {
    errors.push('La prioridad debe estar entre 1 y 4');
  }
  
  if (taskData.dueDate && new Date(taskData.dueDate) < new Date()) {
    errors.push('La fecha de vencimiento no puede ser en el pasado');
  }
  
  return errors;
};
```

---

## 📊 Métricas y Análisis

### Estadísticas de Rendimiento
```javascript
class TaskAnalytics {
  async getProjectMetrics(projectId) {
    const tasks = await fetch(`/tasks/project/${projectId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const taskData = await tasks.json();
    
    return {
      total: taskData.length,
      completed: taskData.filter(t => t.status === 'done').length,
      inProgress: taskData.filter(t => t.status === 'in_progress').length,
      overdue: taskData.filter(t => 
        t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done'
      ).length,
      byPriority: {
        critical: taskData.filter(t => t.priority === 4).length,
        high: taskData.filter(t => t.priority === 3).length,
        medium: taskData.filter(t => t.priority === 2).length,
        low: taskData.filter(t => t.priority === 1).length
      },
      completionRate: taskData.length > 0 
        ? (taskData.filter(t => t.status === 'done').length / taskData.length) * 100 
        : 0
    };
  }
  
  async getUserProductivity(userId) {
    const personalTasks = await fetch('/tasks/personal', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const tasks = await personalTasks.json();
    
    const userTasks = tasks.filter(t => 
      t.assignees.some(a => a.id === userId)
    );
    
    return {
      assigned: userTasks.length,
      completed: userTasks.filter(t => t.status === 'done').length,
      avgCompletionTime: this.calculateAvgCompletionTime(userTasks),
      currentLoad: userTasks.filter(t => t.status !== 'done').length
    };
  }
  
  calculateAvgCompletionTime(tasks) {
    const completedTasks = tasks.filter(t => 
      t.status === 'done' && t.createdAt && t.updatedAt
    );
    
    if (completedTasks.length === 0) return 0;
    
    const totalTime = completedTasks.reduce((sum, task) => {
      const created = new Date(task.createdAt);
      const completed = new Date(task.updatedAt);
      return sum + (completed - created);
    }, 0);
    
    return totalTime / completedTasks.length / (1000 * 60 * 60 * 24); // días
  }
}
```

---

## 🚀 Optimización de Rendimiento

### Paginación para Grandes Conjuntos de Datos
```javascript
const getTasksPaginated = async (projectId, page = 1, limit = 20) => {
  const response = await fetch(
    `/tasks/project/${projectId}?page=${page}&limit=${limit}`, 
    {
      headers: { 'Authorization': `Bearer ${token}` }
    }
  );
  
  return await response.json();
};
```

### Caché Local para Mejor UX
```javascript
class TaskCache {
  constructor() {
    this.cache = new Map();
    this.ttl = 5 * 60 * 1000; // 5 minutos
  }
  
  get(key) {
    const item = this.cache.get(key);
    if (item && Date.now() - item.timestamp < this.ttl) {
      return item.data;
    }
    this.cache.delete(key);
    return null;
  }
  
  set(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
  
  invalidate(pattern) {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
}

const taskCache = new TaskCache();
``` 