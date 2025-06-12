# 🔐 Sistema de Recuperación de Contraseña - Guía de Integración Frontend

## 📋 Resumen
Este documento explica cómo implementar la funcionalidad de **Recuperación de Contraseña** en tu aplicación frontend.

## 🎯 Flujo Completo del Usuario
1. Usuario hace clic en enlace "¿Olvidaste tu contraseña?" en página de login
2. Usuario ingresa su dirección de email
3. Sistema envía email de restablecimiento al usuario
4. Usuario hace clic en enlace de restablecimiento en email → va a página de restablecer contraseña
5. Usuario ingresa nueva contraseña y confirma
6. Contraseña se actualiza, usuario puede iniciar sesión con nueva contraseña

---

## 🔗 Endpoints de API

### URL Base: `http://localhost:3000`

### 1. Solicitar Restablecimiento de Contraseña
```http
POST /auth/request-password-reset
Content-Type: application/json

{
  "email": "usuario@ejemplo.com"
}
```

**Respuesta:**
```json
{
  "message": "password-reset-email-sent"
}
```

**Nota:** Siempre retorna éxito (incluso si el email no existe) por seguridad.

### 2. Restablecer Contraseña
```http
POST /auth/reset-password
Content-Type: application/json

{
  "token": "abc123def456...",
  "newPassword": "nuevaContraseñaSegura123"
}
```

**Respuesta Exitosa:**
```json
{
  "message": "password-reset-successful"
}
```

**Respuesta de Error:**
```json
{
  "message": "invalid-or-expired-token",
  "statusCode": 400
}
```

### 3. Verificar Token (Opcional)
```http
GET /auth/verify-reset-token/abc123def456...
```

**Respuesta Exitosa:**
```json
{
  "message": "token-valid",
  "email": "usuario@ejemplo.com"
}
```

---

## 🖥️ Implementación Frontend

### Página 1: Solicitud de Recuperación de Contraseña

**Ruta:** `/forgot-password`

**Estructura HTML:**
```html
<div class="forgot-password-container">
  <h2>¿Olvidaste tu Contraseña?</h2>
  <p>Ingresa tu dirección de email y te enviaremos un enlace de restablecimiento.</p>
  
  <form id="forgotPasswordForm">
    <div class="form-group">
      <label for="email">Dirección de Email</label>
      <input 
        type="email" 
        id="email" 
        name="email" 
        required 
        placeholder="Ingresa tu email"
      >
    </div>
    
    <button type="submit" id="submitBtn">
      Enviar Enlace de Restablecimiento
    </button>
    
    <div id="message" class="message hidden"></div>
  </form>
  
  <a href="/login">← Volver a Iniciar Sesión</a>
</div>
```

**JavaScript:**
```javascript
document.getElementById('forgotPasswordForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('email').value;
  const submitBtn = document.getElementById('submitBtn');
  const messageDiv = document.getElementById('message');
  
  // Mostrar estado de carga
  submitBtn.textContent = 'Enviando...';
  submitBtn.disabled = true;
  messageDiv.className = 'message hidden';
  
  try {
    const response = await fetch('/auth/request-password-reset', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      messageDiv.textContent = '¡Enlace de restablecimiento enviado! Revisa tu email.';
      messageDiv.className = 'message success';
      document.getElementById('email').value = '';
    } else {
      throw new Error(data.message || 'Algo salió mal');
    }
    
  } catch (error) {
    messageDiv.textContent = 'Error: ' + error.message;
    messageDiv.className = 'message error';
  } finally {
    submitBtn.textContent = 'Enviar Enlace de Restablecimiento';
    submitBtn.disabled = false;
  }
});
```

---

### Página 2: Restablecer Contraseña

**Ruta:** `/reset-password`

**Estructura HTML:**
```html
<div class="reset-password-container">
  <h2>Restablece tu Contraseña</h2>
  <p>Ingresa tu nueva contraseña a continuación.</p>
  
  <form id="resetPasswordForm">
    <div class="form-group">
      <label for="newPassword">Nueva Contraseña</label>
      <input 
        type="password" 
        id="newPassword" 
        name="newPassword" 
        required 
        minlength="6"
        placeholder="Ingresa nueva contraseña"
      >
    </div>
    
    <div class="form-group">
      <label for="confirmPassword">Confirmar Contraseña</label>
      <input 
        type="password" 
        id="confirmPassword" 
        name="confirmPassword" 
        required 
        minlength="6"
        placeholder="Confirma nueva contraseña"
      >
    </div>
    
    <button type="submit" id="resetBtn">
      Restablecer Contraseña
    </button>
    
    <div id="message" class="message hidden"></div>
  </form>
  
  <a href="/login">← Volver a Iniciar Sesión</a>
</div>
```

**JavaScript:**
```javascript
// Obtener token de la URL cuando se carga la página
const urlParams = new URLSearchParams(window.location.search);
const resetToken = urlParams.get('token');

// Verificar si existe el token
if (!resetToken) {
  document.getElementById('message').textContent = 'Enlace de restablecimiento inválido.';
  document.getElementById('message').className = 'message error';
  document.getElementById('resetPasswordForm').style.display = 'none';
}

// Opcional: Verificar token al cargar la página
async function verifyToken() {
  if (!resetToken) return;
  
  try {
    const response = await fetch(`/auth/verify-reset-token/${resetToken}`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error('Enlace de restablecimiento inválido o expirado');
    }
    
    // Opcionalmente mostrar email del usuario
    console.log('Restableciendo contraseña para:', data.email);
    
  } catch (error) {
    document.getElementById('message').textContent = error.message;
    document.getElementById('message').className = 'message error';
    document.getElementById('resetPasswordForm').style.display = 'none';
  }
}

// Llamar función de verificación al cargar la página
verifyToken();

// Manejar envío del formulario
document.getElementById('resetPasswordForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const newPassword = document.getElementById('newPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  const resetBtn = document.getElementById('resetBtn');
  const messageDiv = document.getElementById('message');
  
  // Validar que las contraseñas coincidan
  if (newPassword !== confirmPassword) {
    messageDiv.textContent = 'Las contraseñas no coinciden.';
    messageDiv.className = 'message error';
    return;
  }
  
  // Validar longitud mínima
  if (newPassword.length < 6) {
    messageDiv.textContent = 'La contraseña debe tener al menos 6 caracteres.';
    messageDiv.className = 'message error';
    return;
  }
  
  // Mostrar estado de carga
  resetBtn.textContent = 'Restableciendo...';
  resetBtn.disabled = true;
  messageDiv.className = 'message hidden';
  
  try {
    const response = await fetch('/auth/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: resetToken,
        newPassword: newPassword
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      messageDiv.textContent = '¡Contraseña restablecida exitosamente! Redirigiendo...';
      messageDiv.className = 'message success';
      
      // Redirigir a login después de 2 segundos
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
      
    } else {
      throw new Error(data.message || 'Error al restablecer contraseña');
    }
    
  } catch (error) {
    let errorMessage = 'Error: ' + error.message;
    
    // Personalizar mensajes de error
    if (error.message.includes('expired')) {
      errorMessage = 'El enlace ha expirado. Solicita uno nuevo.';
    } else if (error.message.includes('invalid')) {
      errorMessage = 'Enlace inválido. Solicita uno nuevo.';
    }
    
    messageDiv.textContent = errorMessage;
    messageDiv.className = 'message error';
  } finally {
    resetBtn.textContent = 'Restablecer Contraseña';
    resetBtn.disabled = false;
  }
});
```

---

## 🎨 CSS Sugerido

```css
.forgot-password-container,
.reset-password-container {
  max-width: 400px;
  margin: 50px auto;
  padding: 30px;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.forgot-password-container h2,
.reset-password-container h2 {
  text-align: center;
  color: #333;
  margin-bottom: 10px;
}

.forgot-password-container p,
.reset-password-container p {
  text-align: center;
  color: #666;
  margin-bottom: 30px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  color: #333;
  font-weight: bold;
}

.form-group input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 16px;
  box-sizing: border-box;
}

.form-group input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

button[type="submit"] {
  width: 100%;
  padding: 12px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.3s;
}

button[type="submit"]:hover:not(:disabled) {
  background: #0056b3;
}

button[type="submit"]:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.message {
  margin-top: 15px;
  padding: 10px;
  border-radius: 5px;
  text-align: center;
}

.message.success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.message.error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.message.hidden {
  display: none;
}

a {
  display: block;
  text-align: center;
  margin-top: 20px;
  color: #007bff;
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}
```

---

## 📱 React/React Native Implementation

### React Component Example

```jsx
import React, { useState } from 'react';

const ForgotPasswordForm = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const response = await fetch('/auth/request-password-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setMessage({
          text: '¡Enlace de restablecimiento enviado! Revisa tu email.',
          type: 'success'
        });
        setEmail('');
      } else {
        throw new Error('Error al enviar enlace');
      }
    } catch (error) {
      setMessage({
        text: 'Error: ' + error.message,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-container">
      <h2>¿Olvidaste tu Contraseña?</h2>
      <p>Ingresa tu dirección de email y te enviaremos un enlace de restablecimiento.</p>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Dirección de Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Ingresa tu email"
          />
        </div>
        
        <button type="submit" disabled={loading}>
          {loading ? 'Enviando...' : 'Enviar Enlace de Restablecimiento'}
        </button>
        
        {message.text && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}
      </form>
      
      <a href="/login">← Volver a Iniciar Sesión</a>
    </div>
  );
};

export default ForgotPasswordForm;
```

### React Native Component Example

```jsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert
} from 'react-native';

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Por favor ingresa tu email');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:3000/auth/request-password-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (response.ok) {
        Alert.alert(
          'Éxito',
          '¡Enlace de restablecimiento enviado! Revisa tu email.',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack()
            }
          ]
        );
        setEmail('');
      } else {
        throw new Error('Error al enviar enlace');
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>¿Olvidaste tu Contraseña?</Text>
      <Text style={styles.subtitle}>
        Ingresa tu dirección de email y te enviaremos un enlace de restablecimiento.
      </Text>
      
      <TextInput
        style={styles.input}
        placeholder="Ingresa tu email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />
      
      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Enviando...' : 'Enviar Enlace'}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.backLink}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backLinkText}>← Volver a Iniciar Sesión</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 15,
    fontSize: 16,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  backLinkText: {
    color: '#007bff',
    fontSize: 16,
  },
});

export default ForgotPasswordScreen;
```

---

## 🔒 Consideraciones de Seguridad

### 1. Validación de Email
```javascript
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Usar antes de enviar request
if (!validateEmail(email)) {
  setMessage({ text: 'Por favor ingresa un email válido', type: 'error' });
  return;
}
```

### 2. Rate Limiting Frontend
```javascript
const RATE_LIMIT_MS = 60000; // 1 minuto
let lastRequestTime = 0;

const handleSubmit = async (e) => {
  e.preventDefault();
  
  const now = Date.now();
  if (now - lastRequestTime < RATE_LIMIT_MS) {
    setMessage({
      text: 'Por favor espera antes de solicitar otro enlace',
      type: 'error'
    });
    return;
  }
  
  lastRequestTime = now;
  // ... resto de la lógica
};
```

### 3. Token Expiration Handling
```javascript
const checkTokenExpiration = async (token) => {
  try {
    const response = await fetch(`/auth/verify-reset-token/${token}`);
    
    if (!response.ok) {
      throw new Error('Token expirado o inválido');
    }
    
    return true;
  } catch (error) {
    // Redirigir a página de solicitud
    window.location.href = '/forgot-password?expired=true';
    return false;
  }
};
```

---

## 🧪 Testing

### Unit Tests Example (Jest)

```javascript
// forgotPassword.test.js
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import ForgotPasswordForm from './ForgotPasswordForm';

// Mock fetch
global.fetch = jest.fn();

describe('ForgotPasswordForm', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  test('muestra mensaje de éxito cuando email es enviado', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'password-reset-email-sent' })
    });

    render(<ForgotPasswordForm />);
    
    const emailInput = screen.getByPlaceholderText('Ingresa tu email');
    const submitButton = screen.getByRole('button');

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/enlace de restablecimiento enviado/i)).toBeInTheDocument();
    });
  });

  test('muestra mensaje de error cuando falla', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'));

    render(<ForgotPasswordForm />);
    
    const emailInput = screen.getByPlaceholderText('Ingresa tu email');
    const submitButton = screen.getByRole('button');

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });
});
```

---

## 📧 Email Template Integration

El backend enviará emails con este enlace:
```
https://tu-app.com/reset-password?token=abc123def456...
```

Asegúrate de que tu aplicación maneje esta ruta y extraiga el token del parámetro de consulta.

### Ejemplo de Email Template (HTML)
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Restablecimiento de Contraseña</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="padding: 20px; background: #f8f9fa; border-radius: 10px;">
    <h2 style="color: #333;">Restablecimiento de Contraseña</h2>
    
    <p>Hola,</p>
    
    <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta.</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{resetLink}}" 
         style="background: #007bff; color: white; padding: 15px 30px; 
                text-decoration: none; border-radius: 5px; display: inline-block;">
        Restablecer Contraseña
      </a>
    </div>
    
    <p>Este enlace expirará en 1 hora por seguridad.</p>
    
    <p>Si no solicitaste este cambio, puedes ignorar este email.</p>
    
    <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
    
    <p style="color: #666; font-size: 14px;">
      Si tienes problemas con el botón, copia y pega este enlace en tu navegador:<br>
      <a href="{{resetLink}}">{{resetLink}}</a>
    </p>
  </div>
</body>
</html>
```

---

## ✅ Checklist de Implementación

- [ ] Crear página `/forgot-password`
- [ ] Crear página `/reset-password`
- [ ] Implementar validación de email
- [ ] Agregar manejo de errores
- [ ] Configurar estilos CSS
- [ ] Probar flujo completo
- [ ] Agregar rate limiting
- [ ] Implementar verificación de token
- [ ] Configurar redirecciones
- [ ] Agregar tests unitarios

---

¡Con esta implementación tendrás un sistema completo de recuperación de contraseñas funcional y seguro! 🔐✨ 