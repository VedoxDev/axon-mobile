# Password Change API Documentation

## Overview

This endpoint allows authenticated users to change their password securely. It requires the current password for verification and enforces the same password strength requirements as registration.

## Endpoint

### Change Password

**URL:** `PUT /auth/change-password`

**Authentication:** Required (JWT Bearer Token)

**Content-Type:** `application/json`

#### Request Body

```json
{
  "currentPassword": "string",
  "newPassword": "string", 
  "confirmPassword": "string"
}
```

#### Field Requirements

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `currentPassword` | string | Yes | User's current password for verification |
| `newPassword` | string | Yes | New password meeting security requirements |
| `confirmPassword` | string | Yes | Confirmation of new password (must match newPassword) |

#### Password Requirements

The `newPassword` must meet the following criteria:

- **Minimum Length:** 8 characters
- **Maximum Length:** 64 characters
- **Uppercase Letter:** At least one uppercase letter (A-Z)
- **Number:** At least one digit (0-9)
- **Special Character:** At least one symbol (@$!%*?&.)
- **Allowed Characters:** Only letters (including ñÑ), numbers, and symbols (@$!%*?&.)

#### Security Validations

1. **Current Password Verification:** The provided current password must match the stored password
2. **Password Confirmation:** New password and confirm password must match exactly
3. **Password Uniqueness:** New password must be different from the current password
4. **Strength Requirements:** New password must meet all complexity requirements

## Response Format

### Success Response

**Status Code:** `200 OK`

```json
{
  "message": "password-changed-successfully"
}
```

### Error Responses

#### Authentication Errors

**Status Code:** `401 Unauthorized`

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

#### Validation Errors

**Status Code:** `400 Bad Request`

**Missing Required Fields:**
```json
{
  "message": [
    "current-password-required",
    "new-password-required", 
    "confirm-password-required"
  ]
}
```

**Password Strength Violations:**
```json
{
  "message": [
    "new-password-too-short",
    "new-password-too-weak (needs uppercase, number, symbol)",
    "new-password-invalid-characters"
  ]
}
```

**Password Logic Errors:**
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

## Example Usage

### Using cURL

```bash
curl -X PUT http://localhost:3000/auth/change-password \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "OldPass123!",
    "newPassword": "NewSecure456@",
    "confirmPassword": "NewSecure456@"
  }'
```

### Using JavaScript (fetch)

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
    console.log('Password changed successfully:', result.message);
    return result;
  } catch (error) {
    console.error('Password change failed:', error.message);
    throw error;
  }
};

// Usage example
changePassword('OldPass123!', 'NewSecure456@', 'NewSecure456@')
  .then(() => {
    alert('Password changed successfully! Please log in again.');
    // Redirect to login or refresh tokens
  })
  .catch(error => {
    alert('Failed to change password: ' + error.message);
  });
```

### Using Axios

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

## Frontend Integration Guidelines

### Form Validation

Implement client-side validation to match the server requirements:

```javascript
const validatePassword = (password) => {
  const errors = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (password.length > 64) {
    errors.push('Password must be no more than 64 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[@$!%*?&.]/.test(password)) {
    errors.push('Password must contain at least one special character (@$!%*?&.)');
  }
  
  if (!/^[A-Za-zñÑ\d@$!%*?&.]+$/.test(password)) {
    errors.push('Password contains invalid characters');
  }
  
  return errors;
};

const validatePasswordChange = (currentPassword, newPassword, confirmPassword) => {
  const errors = [];
  
  if (!currentPassword) {
    errors.push('Current password is required');
  }
  
  if (!newPassword) {
    errors.push('New password is required');
  } else {
    errors.push(...validatePassword(newPassword));
  }
  
  if (!confirmPassword) {
    errors.push('Password confirmation is required');
  }
  
  if (newPassword && confirmPassword && newPassword !== confirmPassword) {
    errors.push('New password and confirmation do not match');
  }
  
  if (currentPassword && newPassword && currentPassword === newPassword) {
    errors.push('New password must be different from current password');
  }
  
  return errors;
};
```

### Security Best Practices

1. **Clear Form Fields:** Clear all password fields after successful change
2. **Session Management:** Consider forcing re-authentication after password change
3. **User Feedback:** Provide clear feedback for both success and error cases
4. **Rate Limiting:** Implement client-side delays between attempts
5. **Password Strength Indicator:** Show real-time password strength feedback

### Error Handling

```javascript
const handlePasswordChangeError = (error) => {
  if (typeof error === 'string') {
    return error;
  }
  
  if (Array.isArray(error)) {
    return error.join(', ');
  }
  
  // Map server error messages to user-friendly messages
  const errorMap = {
    'current-password-incorrect': 'Current password is incorrect',
    'passwords-do-not-match': 'New password and confirmation do not match',
    'new-password-must-be-different': 'New password must be different from current password',
    'new-password-too-weak (needs uppercase, number, symbol)': 'Password must contain uppercase letter, number, and special character'
  };
  
  return errorMap[error] || error;
};
```

## Security Features

- **bcrypt Hashing:** Passwords are hashed using bcrypt with salt rounds of 10
- **Current Password Verification:** Prevents unauthorized password changes
- **Password Strength Enforcement:** Same requirements as registration
- **Authentication Required:** Only authenticated users can change passwords
- **Password Uniqueness:** Prevents reusing the current password
- **Input Validation:** Comprehensive validation on both client and server side

## Notes

- Password change does not invalidate existing JWT tokens
- Consider implementing token refresh or forced re-authentication flow
- The endpoint uses PUT method following RESTful conventions for updates
- All password validations are performed server-side for security
- Error messages are localized and can be easily translated 