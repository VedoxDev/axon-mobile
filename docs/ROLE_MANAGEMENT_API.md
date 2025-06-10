# Role Management API Documentation 👑

Complete role management system for project members. Only project owners can change member roles between "member" and "admin".

## **Endpoints Overview**

### **🔐 Role Management Endpoints**
| Method | Endpoint | Description | Auth | Permission |
|--------|----------|-------------|------|------------|
| `PUT` | `/projects/:projectId/members/:memberId/role` | Change member role | ✅ JWT | Owner Only |

---

## **👑 PUT `/projects/:projectId/members/:memberId/role`**

Change a project member's role between "member" and "admin". Only project owners can use this endpoint.

### **Request**
```http
PUT /projects/550e8400-e29b-41d4-a716-446655440000/members/user-uuid-123/role
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "role": "admin"
}
```

### **Path Parameters**
- `projectId` (UUID) - The ID of the project
- `memberId` (UUID) - The ID of the user whose role will be changed

### **Required Fields**
```typescript
{
  role: "member" | "admin";  // New role for the member
}
```

### **Response**
```json
{
  "message": "member-role-changed-successfully",
  "memberId": "user-uuid-123",
  "newRole": "admin",
  "memberName": "John Doe"
}
```

### **Usage Examples**

#### **Promote Member to Admin**
```http
PUT /projects/proj-123/members/user-456/role
Authorization: Bearer <jwt_token>

{
  "role": "admin"
}
```

#### **Demote Admin to Member**
```http
PUT /projects/proj-123/members/user-789/role
Authorization: Bearer <jwt_token>

{
  "role": "member"
}
```

---

## **🔒 Security & Validation Rules**

### **Access Control**
- ✅ **Owner Only**: Only project owners can change member roles
- ✅ **JWT Required**: Must be authenticated with valid JWT token
- ✅ **Project Membership**: Owner must be a member of the project

### **Business Rules**
- ✅ **Role Validation**: Only accepts "member" or "admin" values
- ✅ **Cannot Change Owner**: Owner role is protected and cannot be modified
- ✅ **Cannot Change Self**: Owner cannot change their own role
- ✅ **Member Must Exist**: Target member must exist in the project
- ✅ **Project Must Exist**: Project must exist and be accessible

### **Role Permissions After Change**

#### **Member Role Permissions:**
- `VIEW_PROJECT` - Can view project details
- `CREATE_TASK` - Can create new tasks

#### **Admin Role Permissions:**
- `VIEW_PROJECT` - Can view project details
- `EDIT_PROJECT` - Can modify project settings
- `MANAGE_MEMBERS` - Can invite new members
- `CREATE_TASK` - Can create new tasks
- `ASSIGN_TASK` - Can assign tasks to members
- `MANAGE_SECTIONS` - Can create/edit/delete sections

#### **Owner Role Permissions (Unchanged):**
- All admin permissions PLUS:
- `DELETE_PROJECT` - Can delete the entire project
- `CHANGE_MEMBER_ROLES` - Can promote/demote members

---

## **🚨 Error Responses**

### **Forbidden - Not Owner (403)**
```json
{
  "statusCode": 403,
  "message": "only-owner-can-change-roles",
  "error": "Forbidden"
}
```

### **Project Not Found (404)**
```json
{
  "statusCode": 404,
  "message": "project-not-found",
  "error": "Not Found"
}
```

### **Member Not Found (404)**
```json
{
  "statusCode": 404,
  "message": "member-not-found",
  "error": "Not Found"
}
```

### **Cannot Change Owner Role (400)**
```json
{
  "statusCode": 400,
  "message": "cannot-change-owner-role",
  "error": "Bad Request"
}
```

### **Cannot Change Own Role (400)**
```json
{
  "statusCode": 400,
  "message": "cannot-change-own-role",
  "error": "Bad Request"
}
```

### **Invalid Role Value (400)**
```json
{
  "statusCode": 400,
  "message": [
    "role-must-be-member-or-admin"
  ],
  "error": "Bad Request"
}
```

### **Invalid UUID (400)**
```json
{
  "statusCode": 400,
  "message": "invalid-project-id",
  "error": "Bad Request"
}
```

---

## **💻 Frontend Implementation**

### **Role Change Function**
```typescript
const changeMemberRole = async (projectId: string, memberId: string, newRole: 'member' | 'admin') => {
  try {
    const response = await api.put(`/projects/${projectId}/members/${memberId}/role`, {
      role: newRole
    });
    
    console.log('Role changed successfully:', response.data);
    
    // Update local state
    setProjectMembers(prev => prev.map(member => 
      member.id === memberId 
        ? { ...member, role: newRole }
        : member
    ));
    
    // Show success message
    showNotification({
      type: 'success',
      message: `${response.data.memberName} is now ${newRole === 'admin' ? 'an admin' : 'a member'}`
    });
    
  } catch (error) {
    handleRoleChangeError(error);
  }
};
```

### **Error Handling**
```typescript
const handleRoleChangeError = (error: any) => {
  const errorMessage = error.response?.data?.message || 'Failed to change role';
  
  switch (errorMessage) {
    case 'only-owner-can-change-roles':
      showNotification({
        type: 'error',
        message: 'Only project owners can change member roles'
      });
      break;
    case 'cannot-change-owner-role':
      showNotification({
        type: 'error', 
        message: 'Cannot change the owner\'s role'
      });
      break;
    case 'cannot-change-own-role':
      showNotification({
        type: 'error',
        message: 'You cannot change your own role'
      });
      break;
    default:
      showNotification({
        type: 'error',
        message: 'Failed to change member role. Please try again.'
      });
  }
};
```

### **UI Component Example**
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
      onChange={(e) => changeMemberRole(projectId, member.id, e.target.value)}
      className="role-selector"
    >
      <option value="member">Member</option>
      <option value="admin">Admin</option>
    </select>
  );
};
```

---

## **📋 Testing Examples**

### **Valid Role Change**
```bash
curl -X PUT "http://localhost:3000/projects/proj-123/members/user-456/role" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{"role": "admin"}'
```

### **Expected Success Response**
```json
{
  "message": "member-role-changed-successfully",
  "memberId": "user-456", 
  "newRole": "admin",
  "memberName": "John Smith"
}
```

---

## **⚡ Key Features**

### **✅ Secure Access Control**
- Only project owners can change roles
- Cannot modify owner role (protected)
- Cannot change own role (prevents lockout)

### **✅ Smart Validation**
- UUID validation for all parameters
- Role enum validation (member/admin only)
- Member existence verification

### **✅ Clear Error Messages**
- Descriptive error codes for all scenarios
- Frontend-friendly error handling
- Consistent API response format

### **✅ Audit Trail Ready**
- Returns changed member information
- Includes member name for logging
- Clear success/failure responses

---

## **🔮 Role Hierarchy**

```
👑 Owner
├── All permissions
├── Can delete project
├── Can change member roles
├── Cannot be changed/removed
└── Set automatically on project creation

🛡️ Admin  
├── Most permissions
├── Can manage members & sections
├── Can assign tasks
├── Cannot delete project
└── Can be promoted/demoted by owner

👤 Member
├── Basic permissions
├── Can view project & create tasks
├── Cannot manage members
├── Cannot manage sections  
└── Can be promoted to admin by owner
```

---

*This system provides secure and flexible role management while maintaining proper access control!* 🔐✨ 