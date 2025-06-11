# Project Sections API Documentation 📂

## Overview
Project Sections (Secciones) organize tasks within projects, enabling Kanban-style boards and structured task management. Each section belongs to a specific project and maintains a custom order.

## Features ✨
- **Project-Based Sections** - Each section belongs to a specific project
- **Custom Ordering** - Drag-and-drop reordering with automatic order management
- **Task Organization** - Tasks can be assigned to sections for better structure
- **Kanban Support** - Perfect for creating Kanban boards (To Do, In Progress, Done)
- **Automatic Cleanup** - Sections automatically reorder when one is deleted
- **Permission Control** - Only admins and owners can manage sections

---

## 🎯 Quick Start

### Create a Section
```http
POST /projects/{projectId}/sections
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "name": "In Progress",
  "order": 2
}
```

**Response:**
```json
{
  "id": 2,
  "name": "In Progress", 
  "order": 2,
  "project": {
    "id": "project-uuid",
    "name": "Axon Backend"
  }
}
```

---

## 📋 Section Management Endpoints

### Create Section
**URL:** `POST /projects/{projectId}/sections`

**Authentication:** Required (JWT Bearer Token)

**Permissions:** `MANAGE_SECTIONS` (Admin/Owner only)

**Request Body:**
```json
{
  "name": "Done",
  "order": 3
}
```

**Validation Requirements:**
| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `name` | string | ✅ Yes | 3-50 characters, unique per project |
| `order` | number | ❌ No | Auto-assigned if not provided |

**Success Response (201):**
```json
{
  "id": 3,
  "name": "Done",
  "order": 3,
  "project": {
    "id": "project-uuid",
    "name": "Mobile App Project"
  }
}
```

---

### Get Project Sections
**URL:** `GET /projects/{projectId}/sections`

**Authentication:** Required (JWT Bearer Token)

**Permissions:** `VIEW_PROJECT` (All project members)

**Success Response (200):**
```json
[
  {
    "id": 1,
    "name": "Backlog",
    "order": 1
  },
  {
    "id": 2,
    "name": "In Progress", 
    "order": 2
  },
  {
    "id": 3,
    "name": "Done",
    "order": 3
  }
]
```

**Note:** Sections are automatically ordered by the `order` field (ASC).

---

### Update Section
**URL:** `PUT /projects/{projectId}/sections/{sectionId}`

**Authentication:** Required (JWT Bearer Token)

**Permissions:** `MANAGE_SECTIONS` (Admin/Owner only)

**Request Body:**
```json
{
  "name": "Completed Tasks",
  "order": 4
}
```

**Success Response (200):**
```json
{
  "id": 3,
  "name": "Completed Tasks",
  "order": 4,
  "project": {
    "id": "project-uuid",
    "name": "Mobile App Project"
  }
}
```

---

### Delete Section
**URL:** `DELETE /projects/{projectId}/sections/{sectionId}`

**Authentication:** Required (JWT Bearer Token)

**Permissions:** `MANAGE_SECTIONS` (Admin/Owner only)

**Success Response (200):**
```json
{
  "message": "section-deleted-successfully"
}
```

**Note:** Deleting a section automatically reorders remaining sections to fill the gap.

---

### Reorder Sections (Drag & Drop)
**URL:** `PUT /projects/{projectId}/sections/reorder`

**Authentication:** Required (JWT Bearer Token)

**Permissions:** `MANAGE_SECTIONS` (Admin/Owner only)

**Request Body:**
```json
{
  "sectionIds": [3, 1, 2]
}
```

**Success Response (200):**
```json
{
  "message": "sections-reordered-successfully"
}
```

**Note:** The array order determines the new section order. Section ID at index 0 gets order 1, index 1 gets order 2, etc.

---

## ❌ Error Responses

### 400 Bad Request

**Invalid Project ID:**
```json
{
  "statusCode": 400,
  "message": "invalid-project-id"
}
```

**Invalid Section ID:**
```json
{
  "statusCode": 400,
  "message": "invalid-section-id"
}
```

**Name Validation Errors:**
```json
{
  "statusCode": 400,
  "message": [
    "name-too-short",
    "name-too-large"
  ]
}
```

**Missing Required Fields:**
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

**Project Not Found:**
```json
{
  "statusCode": 404,
  "message": "project-not-found"
}
```

**Section Not Found:**
```json
{
  "statusCode": 404,
  "message": "section-not-found"
}
```

**Some Sections Not Found (Reorder):**
```json
{
  "statusCode": 404,
  "message": "some-sections-not-found"
}
```

### 409 Conflict

**Section Name Already Exists:**
```json
{
  "statusCode": 409,
  "message": "section-name-exists"
}
```

---

## 🔧 Integration with Tasks

### Creating Tasks in Sections
When creating tasks, you can assign them to a section:

```javascript
const taskInSection = {
  "title": "Implement user authentication",
  "description": "Add JWT-based authentication system",
  "projectId": "project-uuid",
  "sectionId": 2, // "In Progress" section
  "priority": 3
};

fetch('/tasks', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(taskInSection)
});
```

### Moving Tasks Between Sections
Update a task's section to move it between Kanban columns:

```javascript
// Move task from "In Progress" to "Done"
fetch(`/tasks/${taskId}`, {
  method: 'PUT',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ sectionId: 3, status: "done" })
});
```

### Getting Tasks by Section
Retrieve all tasks within a specific section:

```javascript
fetch(`/tasks/project/${projectId}/section/${sectionId}`, {
  headers: {
    'Authorization': 'Bearer ' + token
  }
});
```

---

## 💡 Common Use Cases

### 1. Kanban Board Setup
```javascript
// Create typical Kanban sections
const kanbanSections = [
  { name: "Backlog", order: 1 },
  { name: "To Do", order: 2 },
  { name: "In Progress", order: 3 },
  { name: "Review", order: 4 },
  { name: "Done", order: 5 }
];

for (const section of kanbanSections) {
  await fetch(`/projects/${projectId}/sections`, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(section)
  });
}
```

### 2. Drag & Drop Reordering
```javascript
// User drags "Done" section to first position
const newOrder = [3, 1, 2]; // [Done, Backlog, In Progress]

await fetch(`/projects/${projectId}/sections/reorder`, {
  method: 'PUT',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    sectionIds: newOrder
  })
});
```

### 3. Custom Project Workflows
```javascript
// Software development workflow
const devSections = [
  { name: "Ideas", order: 1 },
  { name: "Requirements", order: 2 },
  { name: "Development", order: 3 },
  { name: "Testing", order: 4 },
  { name: "Deployment", order: 5 },
  { name: "Maintenance", order: 6 }
];

// Marketing campaign workflow  
const marketingSections = [
  { name: "Research", order: 1 },
  { name: "Planning", order: 2 },
  { name: "Creation", order: 3 },
  { name: "Review", order: 4 },
  { name: "Launch", order: 5 },
  { name: "Analysis", order: 6 }
];
```

---

## 🔒 Security & Permissions

### Permission Requirements
| Action | Required Permission | Who Can Access |
|--------|-------------------|----------------|
| Create Section | `MANAGE_SECTIONS` | Admin, Owner |
| View Sections | `VIEW_PROJECT` | All project members |
| Update Section | `MANAGE_SECTIONS` | Admin, Owner |
| Delete Section | `MANAGE_SECTIONS` | Admin, Owner |
| Reorder Sections | `MANAGE_SECTIONS` | Admin, Owner |

### Business Rules
- ✅ **Project Scoped**: Sections belong to specific projects
- ✅ **Unique Names**: Section names must be unique within each project
- ✅ **Auto Ordering**: Order automatically assigned if not provided
- ✅ **Cascade Deletion**: Deleting a project deletes all its sections
- ✅ **Reorder Cleanup**: Remaining sections automatically reorder after deletion
- ❌ **Cross-Project**: Sections cannot be moved between projects
- ❌ **Personal Tasks**: Personal tasks (no projectId) cannot have sections

---

## 🎯 Frontend Implementation Examples

### React Kanban Board
```javascript
import React, { useState, useEffect } from 'react';

const KanbanBoard = ({ projectId }) => {
  const [sections, setSections] = useState([]);
  const [tasks, setTasks] = useState({});

  useEffect(() => {
    loadSections();
    loadTasks();
  }, [projectId]);

  const loadSections = async () => {
    const response = await fetch(`/projects/${projectId}/sections`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    const data = await response.json();
    setSections(data);
  };

  const loadTasks = async () => {
    const response = await fetch(`/tasks/project/${projectId}`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    const data = await response.json();
    
    // Group tasks by section
    const tasksBySection = {};
    data.forEach(task => {
      const sectionId = task.section?.id || 'no-section';
      if (!tasksBySection[sectionId]) {
        tasksBySection[sectionId] = [];
      }
      tasksBySection[sectionId].push(task);
    });
    setTasks(tasksBySection);
  };

  const moveTask = async (taskId, newSectionId) => {
    await fetch(`/tasks/${taskId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${getToken()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ sectionId: newSectionId })
    });
    
    loadTasks(); // Refresh tasks
  };

  return (
    <div className="kanban-board">
      {sections.map(section => (
        <div key={section.id} className="kanban-column">
          <h3>{section.name}</h3>
          <div className="tasks">
            {(tasks[section.id] || []).map(task => (
              <div key={task.id} className="task-card">
                <h4>{task.title}</h4>
                <p>{task.description}</p>
                {/* Add drag & drop handlers */}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
```

### React Native Section Manager
```javascript
import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';

const SectionManager = ({ projectId, onSectionCreated }) => {
  const [sectionName, setSectionName] = useState('');
  const [loading, setLoading] = useState(false);

  const createSection = async () => {
    if (sectionName.trim().length < 3) {
      Alert.alert('Error', 'Section name must be at least 3 characters');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/projects/${projectId}/sections`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: sectionName.trim() })
      });

      if (response.ok) {
        const newSection = await response.json();
        setSectionName('');
        onSectionCreated(newSection);
        Alert.alert('Success', 'Section created successfully');
      } else {
        const error = await response.json();
        Alert.alert('Error', error.message || 'Failed to create section');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 18, marginBottom: 10 }}>Create New Section</Text>
      <TextInput
        value={sectionName}
        onChangeText={setSectionName}
        placeholder="Enter section name..."
        style={{
          borderWidth: 1,
          borderColor: '#ddd',
          padding: 10,
          marginBottom: 10,
          borderRadius: 5
        }}
        maxLength={50}
      />
      <Button
        title={loading ? 'Creating...' : 'Create Section'}
        onPress={createSection}
        disabled={loading || sectionName.trim().length < 3}
      />
    </View>
  );
};
```

---

## 🚀 Best Practices

### Section Naming
- Use clear, action-oriented names ("To Do", "In Progress", "Done")
- Keep names short for better UI display
- Consider your team's workflow terminology

### Order Management
- Let the system auto-assign order when creating sections
- Use the reorder endpoint for drag & drop functionality
- Don't manually manage order numbers in your frontend

### Performance
- Cache section data in your frontend state
- Only reload sections when they're modified
- Group tasks by section ID for efficient rendering

### Error Handling
- Always validate section names on the frontend
- Handle permission errors gracefully
- Provide clear feedback for section conflicts

---

**🎯 Perfect for creating organized, visual project workflows!** 🚀📂 