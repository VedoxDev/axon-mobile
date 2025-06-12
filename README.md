# Axon - Frontend Móvil 📱

**Proyecto desarrollado por Victor Fonseca y Ranzes Mata**

Frontend móvil del Trabajo de Fin de Grado (TFG) 🎓 para la plataforma colaborativa Axon.

Este repositorio contiene el frontend de la aplicación móvil Axon, una plataforma colaborativa completa que incluye gestión de proyectos, tareas, chat en tiempo real, videollamadas y calendario personal. Desarrollado inicialmente para Android con soporte multiplataforma.

## 🚀 Características Principales

### 🔐 Autenticación y Seguridad
- **Inicio de sesión** con validación completa
- **Registro de usuarios** con verificación de email
- **Recuperación de contraseña** con sistema de tokens
- **Cambio de contraseña** con validación de fortaleza
- **Autenticación con Google** (OAuth2)
- **Temas claro y oscuro** adaptativos

### 👥 Gestión de Proyectos
- **Creación y gestión** de proyectos colaborativos
- **Sistema de roles** (Administrador/Miembro)
- **Invitación de miembros** por email
- **Configuración de proyectos** avanzada
- **Actividad del proyecto** en tiempo real

### ✅ Sistema de Tareas
- **Tareas personales y de proyecto** con prioridades
- **Estados personalizables** (To Do, In Progress, Done, etc.)
- **Fechas de vencimiento** y recordatorios
- **Secciones Kanban** con drag & drop
- **Asignación de tareas** a miembros
- **Filtros y búsqueda** avanzados

### 💬 Chat en Tiempo Real
- **Mensajes directos** entre usuarios
- **Chat grupal** por proyecto
- **WebSocket** para comunicación instantánea
- **Historial de mensajes** persistente
- **Notificaciones** de mensajes nuevos

### 📹 Videollamadas y Reuniones
- **Videollamadas 1:1** y grupales
- **Llamadas de audio** únicamente
- **Integración con LiveKit** para WebRTC
- **Reuniones programadas** con calendario
- **Invitaciones automáticas** por chat
- **Grabación de reuniones** (próximamente)

### 📅 Calendario Personal
- **Vista mensual** con eventos
- **Integración de tareas** con fechas de vencimiento
- **Reuniones programadas** visualizadas
- **Filtros por tipo** (tareas, reuniones, anuncios)
- **Navegación temporal** fluida

### 📢 Sistema de Anuncios
- **Anuncios de proyecto** con prioridades
- **Notificaciones push** para anuncios importantes
- **Gestión de visibilidad** y fechas de expiración
- **Historial de anuncios** del proyecto

### 👤 Perfil de Usuario
- **Gestión de perfil** completa
- **Estadísticas de actividad** personalizadas
- **Configuración de notificaciones**
- **Historial de participación** en proyectos

## 🛠️ Tecnologías y Dependencias

### Framework Principal
- **React Native** 0.79.3
- **Expo** 53.0.10 con Expo Router
- **TypeScript** para tipado estático

### Navegación y UI
- **Expo Router** para navegación basada en archivos
- **React Navigation** para tabs y stack navigation
- **React Native Reanimated** para animaciones
- **React Native Gesture Handler** para gestos
- **React Native Modal** para modales

### Comunicación y Datos
- **Axios** para peticiones HTTP
- **Socket.io Client** para WebSocket
- **AsyncStorage** para persistencia local
- **React Context** para gestión de estado

### Multimedia y Llamadas
- **LiveKit** para videollamadas WebRTC
- **Expo AV** para reproducción de audio/video
- **Expo Camera** para acceso a cámara

### UI/UX Avanzada
- **React Native SVG** para iconos vectoriales
- **Expo Linear Gradient** para gradientes
- **Expo Blur** para efectos de desenfoque
- **Flash Calendar** para calendario optimizado
- **React Native Calendars** para vistas de calendario
- **Toast Message** para notificaciones

### Utilidades
- **Date-fns** para manipulación de fechas
- **Expo Haptics** para feedback táctil
- **Expo Localization** para internacionalización

## 📁 Estructura del Proyecto

```
axon/
├── app/                          # Pantallas principales (Expo Router)
│   ├── (tabs)/                   # Navegación por pestañas
│   │   ├── home/                 # Pantalla de inicio
│   │   ├── tasks.tsx             # Gestión de tareas
│   │   ├── calendar.tsx          # Calendario personal
│   │   ├── activity.tsx          # Actividad global
│   │   └── user.tsx              # Perfil de usuario
│   ├── project/                  # Funcionalidades de proyecto
│   │   ├── Task/                 # Gestión de tareas de proyecto
│   │   ├── Members/              # Gestión de miembros
│   │   ├── Calendar/             # Calendario de proyecto
│   │   ├── Meetings/             # Reuniones de proyecto
│   │   ├── Announcements/        # Anuncios de proyecto
│   │   ├── Files/                # Archivos de proyecto
│   │   └── Settings/             # Configuración de proyecto
│   ├── chat/                     # Sistema de chat
│   ├── call/                     # Videollamadas
│   ├── auth/                     # Autenticación
│   ├── login.tsx                 # Inicio de sesión
│   ├── register.tsx              # Registro de usuario
│   ├── forgot-password.tsx       # Recuperación de contraseña
│   └── changePassword.tsx        # Cambio de contraseña
├── components/                   # Componentes reutilizables
│   ├── CustomAlert.tsx           # Alertas personalizadas
│   ├── CreateMeetingModal.tsx    # Modal de creación de reuniones
│   ├── MeetingInfoModal.tsx      # Información de reuniones
│   ├── TaskInfoModal.tsx         # Información de tareas
│   └── AnimatedProjectButton.tsx # Botones animados
├── services/                     # Servicios de API
│   ├── userService.ts            # Gestión de usuarios
│   ├── projectService.ts         # Gestión de proyectos
│   ├── taskService.ts            # Gestión de tareas
│   ├── chatService.ts            # Servicio de chat
│   ├── callService.ts            # Servicio de llamadas
│   ├── meetingService.ts         # Gestión de reuniones
│   ├── announcementService.ts    # Gestión de anuncios
│   ├── sectionService.ts         # Gestión de secciones Kanban
│   ├── invitationService.ts      # Gestión de invitaciones
│   └── userSearchService.ts      # Búsqueda de usuarios
├── contexts/                     # Contextos de React
│   ├── UserContext.tsx           # Contexto de usuario
│   └── ProjectContext.tsx        # Contexto de proyecto
├── constants/                    # Constantes y configuración
├── hooks/                        # Hooks personalizados
├── config/                       # Configuración de la app
├── assets/                       # Recursos estáticos
└── docs/                         # Documentación técnica
```

## 📚 Documentación Técnica

El proyecto incluye documentación técnica completa en español:

### APIs y Endpoints
- **USER_PROFILE_API.md** - Gestión de perfiles de usuario
- **PASSWORD_CHANGE_API.md** - Sistema de cambio de contraseñas
- **ROLE_MANAGEMENT_API.md** - Gestión de roles de proyecto
- **SECTIONS_API.md** - Secciones Kanban con drag & drop
- **TASKS_API.md** - Sistema completo de tareas
- **CALLS_API.md** - Videollamadas con LiveKit
- **CHAT_API.md** - Sistema de chat en tiempo real
- **MEETINGS_API.md** - Gestión de reuniones programadas
- **ANNOUNCEMENTS_API.md** - Sistema de anuncios

### Guías de Implementación
- **FORGOT_PASSWORD_FRONTEND_DOCS.md** - Implementación de recuperación de contraseña
- **CALL_INVITATION_DETECTION.md** - Detección de invitaciones de llamada
- **MEETINGS_DATA_MANAGEMENT.md** - Gestión de datos de reuniones
- **PERSONAL_CALENDAR_DATA_MANAGEMENT.md** - Sistema de calendario personal

## 🚀 Instalación y Configuración

### Requisitos Previos
- **Node.js** (versión 18 o superior)
- **Expo CLI** instalado globalmente
- **Android Studio** (para desarrollo Android)

### Instalación

1. **Clonar el repositorio:**
   ```bash
   git clone [repository-url]
   cd axon
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno:**
   ```bash
   # Crear archivo .env con las configuraciones necesarias
   cp .env.example .env
   ```

4. **Iniciar el servidor de desarrollo:**
   ```bash
   npx expo start
   ```

5. **Ejecutar en dispositivo:**
   - **Android:** `npx expo run:android`
   - **iOS:** `npx expo run:ios`
   - **Web:** `npx expo start --web`

### Configuración del Backend

Asegúrate de que el backend de Axon esté ejecutándose y configurado correctamente:
- **API Base URL** configurada en los servicios
- **WebSocket** habilitado para chat en tiempo real
- **LiveKit** configurado para videollamadas
- **Base de datos** inicializada con las tablas necesarias

## 🧪 Desarrollo y Testing

### Scripts Disponibles
```bash
npm start          # Iniciar servidor de desarrollo
npm run android    # Ejecutar en Android
npm run ios        # Ejecutar en iOS
npm run web        # Ejecutar en navegador web
npm run lint       # Ejecutar linter
```

### Estructura de Testing
- **Servicios:** Cada servicio incluye manejo de errores robusto
- **Componentes:** Componentes modulares y reutilizables
- **Estados:** Gestión de estado centralizada con Context API

## 🔧 Configuración Avanzada

### LiveKit (Videollamadas)
```javascript
// Configuración en config/livekit.ts
export const LIVEKIT_CONFIG = {
  url: 'wss://your-livekit-server.com',
  apiKey: 'your-api-key',
  apiSecret: 'your-api-secret'
};
```

### WebSocket (Chat)
```javascript
// Configuración en services/chatService.ts
const socket = io('your-backend-url', {
  auth: { token: userToken },
  transports: ['websocket']
});
```

## 🎯 Características Destacadas

### 🔄 Sincronización en Tiempo Real
- **WebSocket** para actualizaciones instantáneas
- **Estado optimista** para mejor UX
- **Reconexión automática** en caso de pérdida de conexión

### 📱 Experiencia Móvil Nativa
- **Gestos táctiles** intuitivos
- **Animaciones fluidas** con Reanimated
- **Feedback háptico** para interacciones
- **Optimización de rendimiento** con FlashList

### 🎨 Diseño Adaptativo
- **Temas claro y oscuro** automáticos
- **Responsive design** para diferentes tamaños
- **Iconografía consistente** con Expo Symbols
- **Gradientes y efectos** visuales modernos

### 🔐 Seguridad Robusta
- **Tokens JWT** para autenticación
- **Validación de entrada** en todos los formularios
- **Encriptación** de datos sensibles
- **Gestión segura** de credenciales

## 🚧 Roadmap y Próximas Características

### En Desarrollo
- [ ] **Notificaciones push** nativas
- [ ] **Modo offline** con sincronización
- [ ] **Compartir archivos** en proyectos
- [ ] **Grabación de reuniones**
- [ ] **Integración con calendarios** externos

### Planificado
- [ ] **Aplicación web** (React)
- [ ] **Aplicación de escritorio** (Electron)
- [ ] **API pública** para integraciones
- [ ] **Plugins y extensiones**

## 👥 Contribución

Este proyecto es parte de un Trabajo de Fin de Grado desarrollado por:
- **Victor Fonseca** - Desarrollo Frontend y Backend
- **Ranzes Mata** - Desarrollo Frontend y Diseño UX/UI

### Guías de Contribución
1. **Fork** el repositorio
2. **Crear rama** para nueva característica (`git checkout -b feature/nueva-caracteristica`)
3. **Commit** cambios (`git commit -am 'Agregar nueva característica'`)
4. **Push** a la rama (`git push origin feature/nueva-caracteristica`)
5. **Crear Pull Request**

## 📄 Licencia

Este proyecto es parte de un Trabajo de Fin de Grado y está sujeto a las políticas académicas correspondientes.

## 📞 Soporte y Contacto

Para soporte técnico o consultas sobre el proyecto:
- **Documentación:** Revisar archivos en `/docs`
- **Issues:** Crear issue en el repositorio
- **Email:** Contactar a los desarrolladores

---

**Desarrollado con ❤️ por Victor Fonseca y Ranzes Mata**  
*Trabajo de Fin de Grado - Universidad [Nombre de la Universidad]*
