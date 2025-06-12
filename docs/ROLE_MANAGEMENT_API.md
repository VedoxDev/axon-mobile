# Documentación de API de Gestión de Roles 👑

Sistema completo de gestión de roles para miembros del proyecto. Solo los propietarios del proyecto pueden cambiar los roles de los miembros entre "member" y "admin".

## **Resumen de Endpoints**

### **🔐 Endpoints de Gestión de Roles**
| Método | Endpoint | Descripción | Auth | Permiso |
|--------|----------|-------------|------|---------|
| `PUT` | `/projects/:projectId/members/:memberId/role` | Cambiar rol de miembro | ✅ JWT | Solo Propietario |

---

## **👑 PUT `/projects/:projectId/members/:memberId/role`**

Cambiar el rol de un miembro del proyecto entre "member" y "admin". Solo los propietarios del proyecto pueden usar este endpoint.

### **Solicitud**
```http
PUT /projects/550e8400-e29b-41d4-a716-446655440000/members/user-uuid-123/role
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "role": "admin"
}
```

### **Parámetros de Ruta**
- `projectId` (UUID) - El ID del proyecto
- `memberId` (UUID) - El ID del usuario cuyo rol será cambiado

### **Campos Requeridos**
```typescript
{
  role: "member" | "admin";  // Nuevo rol para el miembro
}
```

### **Respuesta**
```json
{
  "message": "member-role-changed-successfully",
  "memberId": "user-uuid-123",
  "newRole": "admin",
  "memberName": "John Doe"
}
```

### **Ejemplos de Uso**

#### **Promover Miembro a Admin**
```http
PUT /projects/proj-123/members/user-456/role
Authorization: Bearer <jwt_token>

{
  "role": "admin"
}
```

#### **Degradar Admin a Miembro**
```http
PUT /projects/proj-123/members/user-789/role
Authorization: Bearer <jwt_token>

{
  "role": "member"
}
```

---

## **🔒 Reglas de Seguridad y Validación**

### **Control de Acceso**
- ✅ **Solo Propietario**: Solo los propietarios del proyecto pueden cambiar roles de miembros
- ✅ **JWT Requerido**: Debe estar autenticado con token JWT válido
- ✅ **Membresía del Proyecto**: El propietario debe ser miembro del proyecto

### **Reglas de Negocio**
- ✅ **Validación de Rol**: Solo acepta valores "member" o "admin"
- ✅ **No Puede Cambiar Propietario**: El rol de propietario está protegido y no se puede modificar
- ✅ **No Puede Cambiar a Sí Mismo**: El propietario no puede cambiar su propio rol
- ✅ **El Miembro Debe Existir**: El miembro objetivo debe existir en el proyecto
- ✅ **El Proyecto Debe Existir**: El proyecto debe existir y ser accesible

### **Permisos de Rol Después del Cambio**

#### **Permisos de Rol Miembro:**
- `VIEW_PROJECT` - Puede ver detalles del proyecto
- `CREATE_TASK` - Puede crear nuevas tareas

#### **Permisos de Rol Admin:**
- `VIEW_PROJECT` - Puede ver detalles del proyecto
- `EDIT_PROJECT` - Puede modificar configuraciones del proyecto
- `MANAGE_MEMBERS` - Puede invitar nuevos miembros
- `CREATE_TASK` - Puede crear nuevas tareas
- `ASSIGN_TASK` - Puede asignar tareas a miembros
- `MANAGE_SECTIONS` - Puede crear/editar/eliminar secciones

#### **Permisos de Rol Propietario (Sin Cambios):**
- Todos los permisos de admin MÁS:
- `DELETE_PROJECT` - Puede eliminar todo el proyecto
- `CHANGE_MEMBER_ROLES` - Puede promover/degradar miembros

---

## **🚨 Respuestas de Error**

### **Prohibido - No es Propietario (403)**
```json
{
  "statusCode": 403,
  "message": "only-owner-can-change-roles",
  "error": "Forbidden"
}
```

### **Proyecto No Encontrado (404)**
```json
{
  "statusCode": 404,
  "message": "project-not-found",
  "error": "Not Found"
}
```

### **Miembro No Encontrado (404)**
```json
{
  "statusCode": 404,
  "message": "member-not-found",
  "error": "Not Found"
}
```

### **No Puede Cambiar Rol de Propietario (400)**
```json
{
  "statusCode": 400,
  "message": "cannot-change-owner-role",
  "error": "Bad Request"
}
```

### **No Puede Cambiar Su Propio Rol (400)**
```json
{
  "statusCode": 400,
  "message": "cannot-change-own-role",
  "error": "Bad Request"
}
```

### **Valor de Rol Inválido (400)**
```json
{
  "statusCode": 400,
  "message": [
    "role-must-be-member-or-admin"
  ],
  "error": "Bad Request"
}
```

### **UUID Inválido (400)**
```json
{
  "statusCode": 400,
  "message": "invalid-project-id",
  "error": "Bad Request"
}
```

---

## **💻 Implementación Frontend**

### **Función de Cambio de Rol**
```typescript
const changeMemberRole = async (projectId: string, memberId: string, newRole: 'member' | 'admin') => {
  try {
    const response = await api.put(`/projects/${projectId}/members/${memberId}/role`, {
      role: newRole
    });
    
    console.log('Rol cambiado exitosamente:', response.data);
    
    // Actualizar estado local
    setProjectMembers(prev => prev.map(member => 
      member.id === memberId 
        ? { ...member, role: newRole }
        : member
    ));
    
    // Mostrar mensaje de éxito
    showNotification({
      type: 'success',
      message: `${response.data.memberName} ahora es ${newRole === 'admin' ? 'un admin' : 'un miembro'}`
    });
    
  } catch (error) {
    handleRoleChangeError(error);
  }
};
```

### **Manejo de Errores**
```typescript
const handleRoleChangeError = (error: any) => {
  const errorMessage = error.response?.data?.message || 'Error al cambiar rol';
  
  switch (errorMessage) {
    case 'only-owner-can-change-roles':
      showNotification({
        type: 'error',
        message: 'Solo los propietarios del proyecto pueden cambiar roles de miembros'
      });
      break;
    case 'cannot-change-owner-role':
      showNotification({
        type: 'error', 
        message: 'No se puede cambiar el rol del propietario'
      });
      break;
    case 'cannot-change-own-role':
      showNotification({
        type: 'error',
        message: 'No puedes cambiar tu propio rol'
      });
      break;
    default:
      showNotification({
        type: 'error',
        message: 'Error al cambiar rol del miembro. Por favor inténtalo de nuevo.'
      });
  }
};
```

### **Ejemplo de Componente UI**
```typescript
const MemberRoleSelector = ({ member, projectId, currentUserRole, currentUserId }) => {
  const isOwner = currentUserRole === 'owner';
  const isOwnProfile = member.id === currentUserId;
  const canChangeRole = isOwner && !isOwnProfile && member.role !== 'owner';

  if (!canChangeRole) {
    return <span className="role-badge">{member.role}</span>;
  }

  return (
    <select 
      value={member.role}
      onChange={(e) => changeMemberRole(projectId, member.id, e.target.value as 'member' | 'admin')}
      className="role-selector"
    >
      <option value="member">Miembro</option>
      <option value="admin">Admin</option>
    </select>
  );
};
```

### **Componente React Completo**
```typescript
import React, { useState } from 'react';

const ProjectMemberManagement = ({ project, currentUser }) => {
  const [members, setMembers] = useState(project.members);
  const [loading, setLoading] = useState(false);

  const handleRoleChange = async (memberId: string, newRole: 'member' | 'admin') => {
    setLoading(true);
    try {
      await changeMemberRole(project.id, memberId, newRole);
      
      // Actualizar estado local
      setMembers(prev => prev.map(member => 
        member.id === memberId 
          ? { ...member, role: newRole }
          : member
      ));
      
      alert(`Rol cambiado exitosamente a ${newRole}`);
    } catch (error) {
      alert('Error al cambiar rol: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const canManageRoles = currentUser.role === 'owner';

  return (
    <div className="member-management">
      <h3>Miembros del Proyecto</h3>
      
      {members.map(member => (
        <div key={member.id} className="member-row">
          <div className="member-info">
            <img src={member.avatar} alt={member.name} />
            <span>{member.nombre} {member.apellidos}</span>
          </div>
          
          <div className="member-role">
            {canManageRoles && member.id !== currentUser.id && member.role !== 'owner' ? (
              <select
                value={member.role}
                onChange={(e) => handleRoleChange(member.id, e.target.value as 'member' | 'admin')}
                disabled={loading}
              >
                <option value="member">Miembro</option>
                <option value="admin">Admin</option>
              </select>
            ) : (
              <span className={`role-badge ${member.role}`}>
                {member.role === 'owner' ? 'Propietario' : 
                 member.role === 'admin' ? 'Admin' : 'Miembro'}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProjectMemberManagement;
```

---

## **🎯 Casos de Uso Comunes**

### **1. Promover Miembro Activo a Admin**
```typescript
// Cuando un miembro muestra liderazgo y necesita más permisos
await changeMemberRole(projectId, activeMemberId, 'admin');
```

### **2. Degradar Admin Inactivo**
```typescript
// Cuando un admin no está cumpliendo con sus responsabilidades
await changeMemberRole(projectId, inactiveAdminId, 'member');
```

### **3. Configuración Masiva de Roles**
```typescript
const setupProjectRoles = async (projectId: string, roleAssignments: Array<{memberId: string, role: 'member' | 'admin'}>) => {
  for (const assignment of roleAssignments) {
    try {
      await changeMemberRole(projectId, assignment.memberId, assignment.role);
    } catch (error) {
      console.error(`Error asignando rol a ${assignment.memberId}:`, error);
    }
  }
};
```

---

## **🔐 Consideraciones de Seguridad**

### **Principio de Menor Privilegio**
- Los miembros solo tienen permisos básicos por defecto
- Los permisos administrativos se otorgan solo cuando es necesario
- Solo el propietario puede modificar la estructura de permisos

### **Auditoría de Cambios**
```typescript
// Registrar todos los cambios de rol para auditoría
const logRoleChange = {
  action: 'ROLE_CHANGED',
  projectId: projectId,
  targetUserId: memberId,
  performedBy: currentUser.id,
  oldRole: member.previousRole,
  newRole: newRole,
  timestamp: new Date()
};
```

### **Validación de Permisos en Tiempo Real**
```typescript
// Verificar permisos antes de mostrar acciones
const canUserManageRoles = (user: User, project: Project) => {
  return project.members.find(m => m.id === user.id)?.role === 'owner';
};
```

---

## **📊 Monitoreo y Métricas**

### **Métricas de Roles Sugeridas**
- Número total de admins por proyecto
- Frecuencia de cambios de rol
- Distribución de roles por proyecto
- Actividad de usuarios después de cambios de rol

### **Alertas Recomendadas**
- Notificar cuando un proyecto tiene demasiados admins
- Alertar sobre cambios de rol frecuentes
- Monitorear proyectos sin admins activos 