# Tasks API Documentation 📋

## Overview
The Tasks system supports both **personal tasks** and **project tasks** with full CRUD operations, subtasks, and labels.

## Priority System 🎨
- **Priority 1 (Low):** `#10B981` (Green) ⬇️
- **Priority 2 (Medium):** `#F59E0B` (Amber) ➡️
- **Priority 3 (High):** `#EF4444` (Red) ⬆️
- **Priority 4 (Critical):** `#7C3AED` (Purple) 🔥

## Task Status
- `todo` - Not started
- `in_progress` - Currently being worked on
- `done` - Completed

---

## 🚀 Task Endpoints

### Create Task
```http
POST /tasks
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "title": "Fix login bug",
  "description": "Users can't login with special characters in email",
  "projectId": "uuid-here", // Optional - omit for personal task
  "sectionId": 1, // Optional - omit for no section
  "assigneeIds": ["user-uuid-1", "user-uuid-2"], // Optional
  "labelIds": [1, 2], // Optional
  "priority": 3, // 1-4, default: 2
  "dueDate": "2024-01-15T10:00:00Z", // Optional
  "status": "todo" // Optional, default: "todo"
}
```

**Response:**
```json
{
  "id": "task-uuid",
  "title": "Fix login bug",
  "description": "Users can't login with special characters in email",
  "priority": 3,
  "status": "todo",
  "dueDate": "2024-01-15T10:00:00.000Z",
  "order": 1,
  "project": { "id": "project-uuid", "name": "Axon Backend" },
  "section": { "id": 1, "name": "In Progress" },
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

### Get Personal Tasks
```http
GET /tasks/personal
Authorization: Bearer <jwt-token>
```

### Get Project Tasks
```http
GET /tasks/project/{projectId}
Authorization: Bearer <jwt-token>
```

### Get Section Tasks
```http
GET /tasks/project/{projectId}/section/{sectionId}
Authorization: Bearer <jwt-token>
```

### Get Task by ID
```http
GET /tasks/{taskId}
Authorization: Bearer <jwt-token>
```

### Update Task
```http
PUT /tasks/{taskId}
Authorization: Bearer <jwt-token>

{
  "title": "Updated title",
  "status": "in_progress",
  "priority": 4,
  "assigneeIds": ["new-user-uuid"]
  // Any field from CreateTaskDto can be updated
}
```

### Delete Task
```http
DELETE /tasks/{taskId}
Authorization: Bearer <jwt-token>
```

---

## 📝 Subtask Endpoints

### Create Subtask
```http
POST /tasks/{taskId}/subtasks
Authorization: Bearer <jwt-token>

{
  "title": "Write unit tests",
  "description": "Add tests for the login function",
  "order": 1 // Optional
}
```

### Update Subtask
```http
PUT /tasks/{taskId}/subtasks/{subtaskId}
Authorization: Bearer <jwt-token>

{
  "title": "Updated subtask title",
  "completed": true,
  "description": "Updated description"
}
```

### Delete Subtask
```http
DELETE /tasks/{taskId}/subtasks/{subtaskId}
Authorization: Bearer <jwt-token>
```

---

## 🏷️ Label Endpoints

### Create Project Label
```http
POST /tasks/projects/{projectId}/labels
Authorization: Bearer <jwt-token>

{
  "name": "Bug",
  "color": "#EF4444"
}
```

### Get Project Labels
```http
GET /tasks/projects/{projectId}/labels
Authorization: Bearer <jwt-token>
```

### Update Label
```http
PUT /tasks/projects/{projectId}/labels/{labelId}
Authorization: Bearer <jwt-token>

{
  "name": "Critical Bug",
  "color": "#7C3AED"
}
```

### Delete Label
```http
DELETE /tasks/projects/{projectId}/labels/{labelId}
Authorization: Bearer <jwt-token>
```

---

## 💡 Usage Examples

### Creating a Personal Task
```javascript
const personalTask = {
  "title": "Update resume",
  "description": "Add new skills and recent projects",
  "priority": 2,
  "dueDate": "2024-01-20T18:00:00Z"
  // No projectId = personal task
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

### Creating a Project Task with Assignees
```javascript
const projectTask = {
  "title": "Implement real-time notifications",
  "description": "Add WebSocket support for live updates",
  "projectId": "project-uuid",
  "sectionId": 2, // "In Progress" section
  "assigneeIds": ["dev1-uuid", "dev2-uuid"],
  "labelIds": [1, 3], // ["Feature", "High Priority"]
  "priority": 3,
  "dueDate": "2024-01-25T09:00:00Z"
};
```

### Moving Task Between Sections
```javascript
// Move task to "Done" section
fetch(`/tasks/${taskId}`, {
  method: 'PUT',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    "sectionId": 3, // "Done" section
    "status": "done"
  })
});
```

### Creating Subtasks for Kanban Cards
```javascript
const subtasks = [
  { "title": "Design database schema", "order": 1 },
  { "title": "Create API endpoints", "order": 2 },
  { "title": "Add unit tests", "order": 3 },
  { "title": "Update documentation", "order": 4 }
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

## 🔒 Security Notes

1. **Personal Tasks**: Only visible to the creator
2. **Project Tasks**: Only accessible to project members
3. **Assignees**: Can only assign project members
4. **Labels**: Project-specific, only project members can manage
5. **Sections**: Must belong to the same project as the task

---

## 🎯 Common Workflows

### Kanban Board Setup
1. Create project sections: "Backlog", "To Do", "In Progress", "Review", "Done"
2. Create project labels: "Bug", "Feature", "Urgent", "Documentation"
3. Create tasks and assign to sections
4. Move tasks between sections as work progresses
5. Add subtasks for detailed task breakdown

### Personal Task Management
1. Create personal tasks (no projectId)
2. Set priorities and due dates
3. Add subtasks for complex personal tasks
4. Update status as tasks progress

### Team Collaboration
1. Create project tasks
2. Assign multiple team members
3. Add relevant labels for categorization
4. Use subtasks for task delegation
5. Track progress through status updates 