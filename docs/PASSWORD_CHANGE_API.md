# Documentación de API de Cambio de Contraseña

## Resumen

Este endpoint permite a los usuarios autenticados cambiar su contraseña de forma segura. Requiere la contraseña actual para verificación y aplica los mismos requisitos de seguridad que el registro.

## Endpoint

### Cambiar Contraseña

**URL:** `PUT /auth/change-password`

**Autenticación:** Requerida (JWT Bearer Token)

**Content-Type:** `application/json`

#### Cuerpo de la Solicitud

```json
{
  "currentPassword": "string",
  "newPassword": "string", 
  "confirmPassword": "string"
}
```

#### Requisitos de Campos

| Campo | Tipo | Requerido | Descripción |
|-------|------|----------|-------------|
| `currentPassword` | string | Sí | Contraseña actual del usuario para verificación |
| `newPassword` | string | Sí | Nueva contraseña que cumple con los requisitos de seguridad |
| `confirmPassword` | string | Sí | Confirmación de la nueva contraseña (debe coincidir con newPassword) |

#### Requisitos de Contraseña

La `newPassword` debe cumplir con los siguientes criterios:

- **Longitud Mínima:** 8 caracteres
- **Longitud Máxima:** 64 caracteres
- **Letra Mayúscula:** Al menos una letra mayúscula (A-Z)
- **Número:** Al menos un dígito (0-9)
- **Carácter Especial:** Al menos un símbolo (@$!%*?&.)
- **Caracteres Permitidos:** Solo letras (incluyendo ñÑ), números y símbolos (@$!%*?&.)

#### Validaciones de Seguridad

1. **Verificación de Contraseña Actual:** La contraseña actual proporcionada debe coincidir con la contraseña almacenada
2. **Confirmación de Contraseña:** La nueva contraseña y la confirmación de contraseña deben coincidir exactamente
3. **Unicidad de Contraseña:** La nueva contraseña debe ser diferente de la contraseña actual
4. **Requisitos de Seguridad:** La nueva contraseña debe cumplir con todos los requisitos de complejidad

## Formato de Respuesta

### Respuesta Exitosa

**Código de Estado:** `200 OK`

```json
{
  "message": "password-changed-successfully"
}
```

### Respuestas de Error

#### Errores de Autenticación

**Código de Estado:** `401 Unauthorized`

```json
{
  "message": "current-password-incorrect"
}
```

```json
{
  "message": "user-not-found"
}
```

```json
{
  "message": "Unauthorized"
}
```

#### Errores de Validación

**Código de Estado:** `400 Bad Request`

**Campos Requeridos Faltantes:**
```json
{
  "message": [
    "current-password-required",
    "new-password-required", 
    "confirm-password-required"
  ]
}
```

**Violaciones de Seguridad de Contraseña:**
```json
{
  "message": [
    "new-password-too-short",
    "new-password-too-weak (needs uppercase, number, symbol)",
    "new-password-invalid-characters"
  ]
}
```

**Errores de Lógica de Contraseña:**
```json
{
  "message": "passwords-do-not-match"
}
```

```json
{
  "message": "new-password-must-be-different"
}
```

## Ejemplo de Uso

### Usando cURL

```bash
curl -X PUT http://localhost:3000/auth/change-password \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "ContraseñaAntigua123!",
    "newPassword": "NuevaSegura456@",
    "confirmPassword": "NuevaSegura456@"
  }'
```

### Usando JavaScript (fetch)

```javascript
const changePassword = async (currentPassword, newPassword, confirmPassword) => {
  try {
    const response = await fetch('/auth/change-password', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        currentPassword,
        newPassword,
        confirmPassword
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    const result = await response.json();
    console.log('Contraseña cambiada exitosamente:', result.message);
    return result;
  } catch (error) {
    console.error('Error al cambiar contraseña:', error.message);
    throw error;
  }
};

// Ejemplo de uso
changePassword('ContraseñaAntigua123!', 'NuevaSegura456@', 'NuevaSegura456@')
  .then(() => {
    alert('¡Contraseña cambiada exitosamente! Por favor inicia sesión nuevamente.');
    // Redirigir al login o refrescar tokens
  })
  .catch(error => {
    alert('Error al cambiar contraseña: ' + error.message);
  });
```

### Usando Axios

```javascript
import axios from 'axios';

const changePassword = async (passwords) => {
  try {
    const response = await axios.put('/auth/change-password', passwords, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    return response.data;
  } catch (error) {
    if (error.response?.data?.message) {
      throw new Error(Array.isArray(error.response.data.message) 
        ? error.response.data.message.join(', ')
        : error.response.data.message
      );
    }
    throw error;
  }
};
```

## Guías de Integración Frontend

### Validación de Formulario

Implementa validación del lado del cliente para coincidir con los requisitos del servidor:

```javascript
const validatePassword = (password) => {
  const errors = [];
  
  if (password.length < 8) {
    errors.push('La contraseña debe tener al menos 8 caracteres');
  }
  
  if (password.length > 64) {
    errors.push('La contraseña no debe tener más de 64 caracteres');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('La contraseña debe contener al menos una letra mayúscula');
  }
  
  if (!/\d/.test(password)) {
    errors.push('La contraseña debe contener al menos un número');
  }
  
  if (!/[@$!%*?&.]/.test(password)) {
    errors.push('La contraseña debe contener al menos un carácter especial (@$!%*?&.)');
  }
  
  if (!/^[A-Za-zñÑ\d@$!%*?&.]+$/.test(password)) {
    errors.push('La contraseña contiene caracteres inválidos');
  }
  
  return errors;
};

const validatePasswordChange = (currentPassword, newPassword, confirmPassword) => {
  const errors = [];
  
  if (!currentPassword) {
    errors.push('La contraseña actual es requerida');
  }
  
  if (!newPassword) {
    errors.push('La nueva contraseña es requerida');
  }
  
  if (!confirmPassword) {
    errors.push('La confirmación de contraseña es requerida');
  }
  
  if (newPassword && confirmPassword && newPassword !== confirmPassword) {
    errors.push('Las contraseñas no coinciden');
  }
  
  if (currentPassword && newPassword && currentPassword === newPassword) {
    errors.push('La nueva contraseña debe ser diferente de la actual');
  }
  
  if (newPassword) {
    errors.push(...validatePassword(newPassword));
  }
  
  return errors;
};
```

### Componente React de Ejemplo

```javascript
import React, { useState } from 'react';

const PasswordChangeForm = () => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar errores al cambiar
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validatePasswordChange(
      formData.currentPassword,
      formData.newPassword,
      formData.confirmPassword
    );
    
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    try {
      await changePassword(
        formData.currentPassword,
        formData.newPassword,
        formData.confirmPassword
      );
      
      alert('¡Contraseña cambiada exitosamente!');
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      setErrors([error.message]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="currentPassword">Contraseña Actual:</label>
        <input
          type="password"
          id="currentPassword"
          name="currentPassword"
          value={formData.currentPassword}
          onChange={handleChange}
          required
        />
      </div>
      
      <div>
        <label htmlFor="newPassword">Nueva Contraseña:</label>
        <input
          type="password"
          id="newPassword"
          name="newPassword"
          value={formData.newPassword}
          onChange={handleChange}
          required
        />
      </div>
      
      <div>
        <label htmlFor="confirmPassword">Confirmar Nueva Contraseña:</label>
        <input
          type="password"
          id="confirmPassword"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          required
        />
      </div>
      
      {errors.length > 0 && (
        <div style={{ color: 'red' }}>
          {errors.map((error, index) => (
            <p key={index}>{error}</p>
          ))}
        </div>
      )}
      
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Cambiando...' : 'Cambiar Contraseña'}
      </button>
    </form>
  );
};

export default PasswordChangeForm;
```

## Consideraciones de Seguridad

### Mejores Prácticas

1. **Verificación de Contraseña Actual:** Siempre verifica la contraseña actual antes de permitir el cambio
2. **Validación del Lado del Servidor:** Nunca confíes solo en la validación del cliente
3. **Hashing Seguro:** Las contraseñas se almacenan usando bcrypt con salt
4. **Prevención de Ataques de Fuerza Bruta:** Implementa limitación de intentos
5. **Logs de Auditoría:** Registra todos los cambios de contraseña para auditoría

### Flujo de Seguridad

1. Usuario proporciona contraseña actual
2. Sistema verifica contraseña actual contra hash almacenado
3. Sistema valida nueva contraseña contra requisitos de seguridad
4. Sistema verifica que nueva contraseña sea diferente de la actual
5. Sistema hashea nueva contraseña
6. Sistema actualiza contraseña en base de datos
7. Sistema registra evento de cambio de contraseña

## Manejo de Errores Comunes

### Errores de Usuario

- **Contraseña actual incorrecta:** Verificar que el usuario recuerde su contraseña actual
- **Contraseñas no coinciden:** Verificar que la confirmación sea exacta
- **Contraseña muy débil:** Guiar al usuario con los requisitos específicos

### Errores de Sistema

- **Usuario no encontrado:** Verificar autenticación JWT
- **Error de base de datos:** Reintentar la operación o notificar error del servidor

## Consideraciones de UX

### Retroalimentación Visual

- Mostrar requisitos de contraseña en tiempo real
- Usar indicadores de seguridad (débil/fuerte)
- Confirmar éxito claramente
- Proporcionar mensajes de error específicos

### Accesibilidad

- Asegurar que los campos tengan etiquetas apropiadas
- Proporcionar texto alternativo para indicadores visuales
- Soportar navegación por teclado
- Incluir mensajes de error legibles por lectores de pantalla 