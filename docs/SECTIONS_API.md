# Documentación de API de Secciones de Proyecto 📂

## Resumen
Las Secciones de Proyecto (Secciones) organizan tareas dentro de proyectos, habilitando tableros estilo Kanban y gestión estructurada de tareas. Cada sección pertenece a un proyecto específico y mantiene un orden personalizado.

## Características ✨
- **Secciones Basadas en Proyecto** - Cada sección pertenece a un proyecto específico
- **Ordenamiento Personalizado** - Reordenamiento de arrastrar y soltar con gestión automática de orden
- **Organización de Tareas** - Las tareas se pueden asignar a secciones para mejor estructura
- **Soporte Kanban** - Perfecto para crear tableros Kanban (Pendiente, En Progreso, Completado)
- **Limpieza Automática** - Las secciones se reordenan automáticamente cuando una es eliminada
- **Control de Permisos** - Solo admins y propietarios pueden gestionar secciones

---

## 🎯 Inicio Rápido

### Crear una Sección
```http
POST /projects/{projectId}/sections
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "name": "En Progreso",
  "order": 2
}
```

**Respuesta:**
```json
{
  "id": 2,
  "name": "En Progreso", 
  "order": 2,
  "project": {
    "id": "project-uuid",
    "name": "Axon Backend"
  }
}
```

---

## 📋 Endpoints de Gestión de Secciones

### Crear Sección
**URL:** `POST /projects/{projectId}/sections`

**Autenticación:** Requerida (JWT Bearer Token)

**Permisos:** `MANAGE_SECTIONS` (Solo Admin/Propietario)

**Cuerpo de la Solicitud:**
```json
{
  "name": "Completado",
  "order": 3
}
```

**Requisitos de Validación:**
| Campo | Tipo | Requerido | Reglas |
|-------|------|----------|-------|
| `name` | string | ✅ Sí | 3-50 caracteres, único por proyecto |
| `order` | number | ❌ No | Se asigna automáticamente si no se proporciona |

**Respuesta Exitosa (201):**
```json
{
  "id": 3,
  "name": "Completado",
  "order": 3,
  "project": {
    "id": "project-uuid",
    "name": "Proyecto de App Móvil"
  }
}
```

---

### Obtener Secciones del Proyecto
**URL:** `GET /projects/{projectId}/sections`

**Autenticación:** Requerida (JWT Bearer Token)

**Permisos:** `VIEW_PROJECT` (Todos los miembros del proyecto)

**Respuesta Exitosa (200):**
```json
[
  {
    "id": 1,
    "name": "Pendientes",
    "order": 1
  },
  {
    "id": 2,
    "name": "En Progreso", 
    "order": 2
  },
  {
    "id": 3,
    "name": "Completado",
    "order": 3
  }
]
```

**Nota:** Las secciones se ordenan automáticamente por el campo `order` (ASC).

---

### Actualizar Sección
**URL:** `PUT /projects/{projectId}/sections/{sectionId}`

**Autenticación:** Requerida (JWT Bearer Token)

**Permisos:** `MANAGE_SECTIONS` (Solo Admin/Propietario)

**Cuerpo de la Solicitud:**
```json
{
  "name": "Tareas Completadas",
  "order": 4
}
```

**Respuesta Exitosa (200):**
```json
{
  "id": 3,
  "name": "Tareas Completadas",
  "order": 4,
  "project": {
    "id": "project-uuid",
    "name": "Proyecto de App Móvil"
  }
}
```

---

### Eliminar Sección
**URL:** `DELETE /projects/{projectId}/sections/{sectionId}`

**Autenticación:** Requerida (JWT Bearer Token)

**Permisos:** `MANAGE_SECTIONS` (Solo Admin/Propietario)

**Respuesta Exitosa (200):**
```json
{
  "message": "section-deleted-successfully"
}
```

**Nota:** Eliminar una sección automáticamente reordena las secciones restantes para llenar el vacío.

---

### Reordenar Secciones (Arrastrar y Soltar)
**URL:** `PUT /projects/{projectId}/sections/reorder`

**Autenticación:** Requerida (JWT Bearer Token)

**Permisos:** `MANAGE_SECTIONS` (Solo Admin/Propietario)

**Cuerpo de la Solicitud:**
```json
{
  "sectionIds": [3, 1, 2]
}
```

**Respuesta Exitosa (200):**
```json
{
  "message": "sections-reordered-successfully"
}
```

**Nota:** El orden del array determina el nuevo orden de las secciones. El ID de sección en el índice 0 obtiene el orden 1, el índice 1 obtiene el orden 2, etc.

---

## ❌ Respuestas de Error

### 400 Bad Request

**ID de Proyecto Inválido:**
```json
{
  "statusCode": 400,
  "message": "invalid-project-id"
}
```

**ID de Sección Inválido:**
```json
{
  "statusCode": 400,
  "message": "invalid-section-id"
}
```

**Errores de Validación de Nombre:**
```json
{
  "statusCode": 400,
  "message": [
    "name-too-short",
    "name-too-large"
  ]
}
```

**Campos Requeridos Faltantes:**
```json
{
  "statusCode": 400,
  "message": "name-required"
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

**Proyecto No Encontrado:**
```json
{
  "statusCode": 404,
  "message": "project-not-found"
}
```

**Sección No Encontrada:**
```json
{
  "statusCode": 404,
  "message": "section-not-found"
}
```

### 409 Conflict

**Nombre Duplicado:**
```json
{
  "statusCode": 409,
  "message": "section-name-already-exists"
}
```

---

## 💻 Implementación Frontend

### Servicio de Secciones
```typescript
class SectionService {
  private baseURL = '/projects';
  
  async getSections(projectId: string): Promise<Section[]> {
    const response = await api.get(`${this.baseURL}/${projectId}/sections`);
    return response.data;
  }
  
  async createSection(projectId: string, data: CreateSectionDto): Promise<Section> {
    const response = await api.post(`${this.baseURL}/${projectId}/sections`, data);
    return response.data;
  }
  
  async updateSection(projectId: string, sectionId: number, data: UpdateSectionDto): Promise<Section> {
    const response = await api.put(`${this.baseURL}/${projectId}/sections/${sectionId}`, data);
    return response.data;
  }
  
  async deleteSection(projectId: string, sectionId: number): Promise<void> {
    await api.delete(`${this.baseURL}/${projectId}/sections/${sectionId}`);
  }
  
  async reorderSections(projectId: string, sectionIds: number[]): Promise<void> {
    await api.put(`${this.baseURL}/${projectId}/sections/reorder`, { sectionIds });
  }
}
```

### Hooks de React
```typescript
import { useState, useEffect } from 'react';

export const useSections = (projectId: string) => {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const fetchSections = async () => {
    try {
      setLoading(true);
      const data = await SectionService.getSections(projectId);
      setSections(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Error al cargar secciones');
    } finally {
      setLoading(false);
    }
  };
  
  const createSection = async (name: string, order?: number) => {
    try {
      const newSection = await SectionService.createSection(projectId, { name, order });
      setSections(prev => [...prev, newSection].sort((a, b) => a.order - b.order));
      return newSection;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Error al crear sección');
    }
  };
  
  const updateSection = async (sectionId: number, data: UpdateSectionDto) => {
    try {
      const updatedSection = await SectionService.updateSection(projectId, sectionId, data);
      setSections(prev => prev.map(s => s.id === sectionId ? updatedSection : s));
      return updatedSection;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Error al actualizar sección');
    }
  };
  
  const deleteSection = async (sectionId: number) => {
    try {
      await SectionService.deleteSection(projectId, sectionId);
      setSections(prev => prev.filter(s => s.id !== sectionId));
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Error al eliminar sección');
    }
  };
  
  const reorderSections = async (newOrder: Section[]) => {
    try {
      const sectionIds = newOrder.map(s => s.id);
      await SectionService.reorderSections(projectId, sectionIds);
      setSections(newOrder);
    } catch (err: any) {
      // Revertir orden en caso de error
      await fetchSections();
      throw new Error(err.response?.data?.message || 'Error al reordenar secciones');
    }
  };
  
  useEffect(() => {
    if (projectId) {
      fetchSections();
    }
  }, [projectId]);
  
  return {
    sections,
    loading,
    error,
    createSection,
    updateSection,
    deleteSection,
    reorderSections,
    refetch: fetchSections
  };
};
```

### Componente Kanban Board
```typescript
import React from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useSections } from './hooks/useSections';

const KanbanBoard: React.FC<{ projectId: string }> = ({ projectId }) => {
  const { sections, loading, error, reorderSections } = useSections(projectId);
  
  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;
    
    const newSections = Array.from(sections);
    const [reorderedSection] = newSections.splice(result.source.index, 1);
    newSections.splice(result.destination.index, 0, reorderedSection);
    
    try {
      await reorderSections(newSections);
    } catch (error) {
      alert('Error al reordenar secciones: ' + error.message);
    }
  };
  
  if (loading) return <div>Cargando secciones...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="sections" direction="horizontal">
        {(provided) => (
          <div 
            className="kanban-board"
            {...provided.droppableProps}
            ref={provided.innerRef}
          >
            {sections.map((section, index) => (
              <Draggable 
                key={section.id} 
                draggableId={section.id.toString()} 
                index={index}
              >
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`kanban-column ${snapshot.isDragging ? 'dragging' : ''}`}
                  >
                    <h3>{section.name}</h3>
                    {/* Contenido de tareas aquí */}
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
};

export default KanbanBoard;
```

### Formulario de Creación de Sección
```typescript
import React, { useState } from 'react';

const CreateSectionForm: React.FC<{ 
  projectId: string; 
  onSectionCreated: (section: Section) => void;
}> = ({ projectId, onSectionCreated }) => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('El nombre de la sección es requerido');
      return;
    }
    
    if (name.length < 3) {
      setError('El nombre debe tener al menos 3 caracteres');
      return;
    }
    
    if (name.length > 50) {
      setError('El nombre no puede tener más de 50 caracteres');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post(`/projects/${projectId}/sections`, { name });
      onSectionCreated(response.data);
      setName('');
      alert('Sección creada exitosamente');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message;
      if (Array.isArray(errorMessage)) {
        setError(errorMessage.join(', '));
      } else {
        setError(errorMessage || 'Error al crear sección');
      }
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="create-section-form">
      <div className="form-group">
        <label htmlFor="sectionName">Nombre de la Sección:</label>
        <input
          type="text"
          id="sectionName"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="ej. En Progreso, Completado"
          maxLength={50}
          required
        />
        <small>3-50 caracteres</small>
      </div>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      <button type="submit" disabled={loading || !name.trim()}>
        {loading ? 'Creando...' : 'Crear Sección'}
      </button>
    </form>
  );
};

export default CreateSectionForm;
```

---

## 🎯 Casos de Uso Comunes

### 1. Configuración Inicial de Tablero Kanban
```typescript
const setupKanbanBoard = async (projectId: string) => {
  const defaultSections = [
    { name: 'Pendientes', order: 1 },
    { name: 'En Progreso', order: 2 },
    { name: 'En Revisión', order: 3 },
    { name: 'Completado', order: 4 }
  ];
  
  for (const section of defaultSections) {
    try {
      await SectionService.createSection(projectId, section);
    } catch (error) {
      console.error(`Error creando sección ${section.name}:`, error);
    }
  }
};
```

### 2. Mover Tareas Entre Secciones
```typescript
const moveTaskToSection = async (taskId: string, newSectionId: number) => {
  try {
    await api.put(`/tasks/${taskId}`, {
      sectionId: newSectionId
    });
    
    // Actualizar estado local
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { ...task, sectionId: newSectionId }
        : task
    ));
  } catch (error) {
    console.error('Error moviendo tarea:', error);
  }
};
```

### 3. Reordenamiento de Arrastrar y Soltar
```typescript
const handleSectionReorder = async (startIndex: number, endIndex: number) => {
  const result = Array.from(sections);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  
  // Actualizar orden local inmediatamente para UX fluida
  setSections(result);
  
  try {
    // Sincronizar con el servidor
    await reorderSections(result.map(s => s.id));
  } catch (error) {
    // Revertir cambios locales en caso de error
    setSections(sections);
    alert('Error al reordenar secciones');
  }
};
```

---

## 🔐 Consideraciones de Seguridad

### Control de Permisos
- Solo los usuarios con rol `admin` o `owner` pueden gestionar secciones
- Los miembros regulares solo pueden ver las secciones
- Todas las operaciones requieren autenticación JWT

### Validación de Datos
- Los nombres de sección deben ser únicos por proyecto
- Longitud de nombre limitada (3-50 caracteres)
- Validación de UUID para IDs de proyecto y sección

### Integridad de Datos
- La eliminación de secciones mueve automáticamente las tareas a una sección por defecto
- El reordenamiento mantiene la consistencia de orden
- Las transacciones de base de datos aseguran operaciones atómicas

---

## 📊 Optimización de Rendimiento

### Estrategias de Caché
```typescript
// Caché de secciones con invalidación inteligente
const sectionCache = new Map<string, { data: Section[], timestamp: number }>();

const getCachedSections = (projectId: string): Section[] | null => {
  const cached = sectionCache.get(projectId);
  if (cached && Date.now() - cached.timestamp < 300000) { // 5 minutos
    return cached.data;
  }
  return null;
};

const setCachedSections = (projectId: string, sections: Section[]) => {
  sectionCache.set(projectId, { data: sections, timestamp: Date.now() });
};
```

### Actualizaciones Optimistas
```typescript
const createSectionOptimistic = async (projectId: string, sectionData: CreateSectionDto) => {
  // Crear sección temporal para UI inmediata
  const tempSection = {
    id: Date.now(), // ID temporal
    ...sectionData,
    order: sections.length + 1
  };
  
  setSections(prev => [...prev, tempSection]);
  
  try {
    // Crear en servidor
    const realSection = await SectionService.createSection(projectId, sectionData);
    
    // Reemplazar sección temporal con la real
    setSections(prev => prev.map(s => 
      s.id === tempSection.id ? realSection : s
    ));
  } catch (error) {
    // Remover sección temporal en caso de error
    setSections(prev => prev.filter(s => s.id !== tempSection.id));
    throw error;
  }
};
```

---

## 🧪 Ejemplos de Pruebas

### Pruebas de Unidad
```typescript
describe('SectionService', () => {
  test('debe crear sección exitosamente', async () => {
    const mockSection = { name: 'Nueva Sección', order: 1 };
    const expectedResponse = { id: 1, ...mockSection };
    
    jest.spyOn(api, 'post').mockResolvedValue({ data: expectedResponse });
    
    const result = await SectionService.createSection('project-1', mockSection);
    
    expect(api.post).toHaveBeenCalledWith('/projects/project-1/sections', mockSection);
    expect(result).toEqual(expectedResponse);
  });
  
  test('debe manejar errores de validación', async () => {
    const invalidSection = { name: 'ab' }; // Muy corto
    
    jest.spyOn(api, 'post').mockRejectedValue({
      response: { data: { message: ['name-too-short'] } }
    });
    
    await expect(SectionService.createSection('project-1', invalidSection))
      .rejects.toThrow();
  });
});
```

### Pruebas de Integración
```typescript
describe('Integración de Secciones', () => {
  test('flujo completo de gestión de secciones', async () => {
    const projectId = 'test-project';
    
    // 1. Crear sección
    const newSection = await SectionService.createSection(projectId, {
      name: 'Test Section'
    });
    expect(newSection.id).toBeDefined();
    
    // 2. Obtener secciones
    const sections = await SectionService.getSections(projectId);
    expect(sections).toContain(newSection);
    
    // 3. Actualizar sección
    const updatedSection = await SectionService.updateSection(
      projectId, 
      newSection.id, 
      { name: 'Updated Section' }
    );
    expect(updatedSection.name).toBe('Updated Section');
    
    // 4. Eliminar sección
    await SectionService.deleteSection(projectId, newSection.id);
    
    const finalSections = await SectionService.getSections(projectId);
    expect(finalSections).not.toContain(newSection);
  });
});
``` 