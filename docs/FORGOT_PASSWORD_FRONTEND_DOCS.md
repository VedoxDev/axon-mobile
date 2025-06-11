# 🔐 Forgot Password System - Frontend Integration Guide

## 📋 Overview
This document explains how to implement the **Forgot Password** functionality in your frontend application.

## 🎯 Complete User Flow
1. User clicks "Forgot Password?" link on login page
2. User enters their email address
3. System sends reset email to user
4. User clicks reset link in email → goes to reset password page
5. User enters new password and confirms
6. Password is updated, user can login with new password

---

## 🔗 API Endpoints

### Base URL: `http://localhost:3000`

### 1. Request Password Reset
```http
POST /auth/request-password-reset
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "message": "password-reset-email-sent"
}
```

**Note:** Always returns success (even if email doesn't exist) for security.

### 2. Reset Password
```http
POST /auth/reset-password
Content-Type: application/json

{
  "token": "abc123def456...",
  "newPassword": "newSecurePassword123"
}
```

**Success Response:**
```json
{
  "message": "password-reset-successful"
}
```

**Error Response:**
```json
{
  "message": "invalid-or-expired-token",
  "statusCode": 400
}
```

### 3. Verify Token (Optional)
```http
GET /auth/verify-reset-token/abc123def456...
```

**Success Response:**
```json
{
  "message": "token-valid",
  "email": "user@example.com"
}
```

---

## 🖥️ Frontend Implementation

### Page 1: Forgot Password Request

**Route:** `/forgot-password`

**HTML Structure:**
```html
<div class="forgot-password-container">
  <h2>Forgot Your Password?</h2>
  <p>Enter your email address and we'll send you a reset link.</p>
  
  <form id="forgotPasswordForm">
    <div class="form-group">
      <label for="email">Email Address</label>
      <input 
        type="email" 
        id="email" 
        name="email" 
        required 
        placeholder="Enter your email"
      >
    </div>
    
    <button type="submit" id="submitBtn">
      Send Reset Link
    </button>
    
    <div id="message" class="message hidden"></div>
  </form>
  
  <a href="/login">← Back to Login</a>
</div>
```

**JavaScript:**
```javascript
document.getElementById('forgotPasswordForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('email').value;
  const submitBtn = document.getElementById('submitBtn');
  const messageDiv = document.getElementById('message');
  
  // Show loading state
  submitBtn.textContent = 'Sending...';
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
      messageDiv.textContent = 'Reset link sent! Check your email.';
      messageDiv.className = 'message success';
      document.getElementById('email').value = '';
    } else {
      throw new Error(data.message || 'Something went wrong');
    }
    
  } catch (error) {
    messageDiv.textContent = 'Error: ' + error.message;
    messageDiv.className = 'message error';
  } finally {
    submitBtn.textContent = 'Send Reset Link';
    submitBtn.disabled = false;
  }
});
```

---

### Page 2: Reset Password

**Route:** `/reset-password`

**HTML Structure:**
```html
<div class="reset-password-container">
  <h2>Reset Your Password</h2>
  <p>Enter your new password below.</p>
  
  <form id="resetPasswordForm">
    <div class="form-group">
      <label for="newPassword">New Password</label>
      <input 
        type="password" 
        id="newPassword" 
        name="newPassword" 
        required 
        minlength="6"
        placeholder="Enter new password"
      >
    </div>
    
    <div class="form-group">
      <label for="confirmPassword">Confirm Password</label>
      <input 
        type="password" 
        id="confirmPassword" 
        name="confirmPassword" 
        required 
        minlength="6"
        placeholder="Confirm new password"
      >
    </div>
    
    <button type="submit" id="resetBtn">
      Reset Password
    </button>
    
    <div id="message" class="message hidden"></div>
  </form>
  
  <a href="/login">← Back to Login</a>
</div>
```

**JavaScript:**
```javascript
// Get token from URL when page loads
const urlParams = new URLSearchParams(window.location.search);
const resetToken = urlParams.get('token');

// Check if token exists
if (!resetToken) {
  document.getElementById('message').textContent = 'Invalid reset link.';
  document.getElementById('message').className = 'message error';
  document.getElementById('resetPasswordForm').style.display = 'none';
}

// Optional: Verify token on page load
async function verifyToken() {
  if (!resetToken) return;
  
  try {
    const response = await fetch(`/auth/verify-reset-token/${resetToken}`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error('Invalid or expired reset link');
    }
    
    // Optionally show user's email
    console.log('Resetting password for:', data.email);
    
  } catch (error) {
    document.getElementById('message').textContent = error.message;
    document.getElementById('message').className = 'message error';
    document.getElementById('resetPasswordForm').style.display = 'none';
  }
}

// Call verify function on page load
verifyToken();

// Handle form submission
document.getElementById('resetPasswordForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const newPassword = document.getElementById('newPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  const resetBtn = document.getElementById('resetBtn');
  const messageDiv = document.getElementById('message');
  
  // Validate passwords match
  if (newPassword !== confirmPassword) {
    messageDiv.textContent = 'Passwords do not match.';
    messageDiv.className = 'message error';
    return;
  }
  
  // Show loading state
  resetBtn.textContent = 'Resetting...';
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
      messageDiv.textContent = 'Password reset successful! Redirecting to login...';
      messageDiv.className = 'message success';
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
      
    } else {
      throw new Error(data.message || 'Reset failed');
    }
    
  } catch (error) {
    messageDiv.textContent = 'Error: ' + error.message;
    messageDiv.className = 'message error';
    resetBtn.textContent = 'Reset Password';
    resetBtn.disabled = false;
  }
});
```

---

## 🎨 CSS Suggestions

```css
.forgot-password-container,
.reset-password-container {
  max-width: 400px;
  margin: 50px auto;
  padding: 30px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: white;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
  color: #333;
}

.form-group input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.form-group input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0,123,255,0.25);
}

button {
  width: 100%;
  padding: 12px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.2s;
}

button:hover {
  background-color: #0056b3;
}

button:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

.message {
  padding: 10px;
  margin-top: 15px;
  border-radius: 4px;
  text-align: center;
}

.message.success {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.message.error {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.message.hidden {
  display: none;
}

a {
  color: #007bff;
  text-decoration: none;
  display: inline-block;
  margin-top: 15px;
}

a:hover {
  text-decoration: underline;
}
```

---

## 🔗 Integration with Login Page

Add this link to your login page:

```html
<div class="login-form">
  <!-- Your existing login form -->
  
  <div class="forgot-password-link">
    <a href="/forgot-password">Forgot your password?</a>
  </div>
</div>
```

---

## ⚠️ Error Handling

### Common Error Messages:
- `"invalid-or-expired-token"` - Token is invalid or expired (30 min limit)
- `"password-reset-email-sent"` - Always returned (security feature)
- `"password-reset-successful"` - Password was successfully reset

### Frontend Error Handling:
```javascript
try {
  const response = await fetch('/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, newPassword })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Something went wrong');
  }
  
  const data = await response.json();
  // Handle success
  
} catch (error) {
  // Handle specific errors
  if (error.message === 'invalid-or-expired-token') {
    showMessage('Reset link has expired. Please request a new one.', 'error');
  } else {
    showMessage('Error: ' + error.message, 'error');
  }
}
```

---

## 🚀 React/Vue/Angular Examples

### React Component Example:
```jsx
import { useState } from 'react';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch('/auth/request-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      const data = await response.json();
      setMessage('Reset link sent! Check your email.');
      setEmail('');
      
    } catch (error) {
      setMessage('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Sending...' : 'Send Reset Link'}
      </button>
      {message && <div className="message">{message}</div>}
    </form>
  );
}
```

---

## ✅ Testing Checklist

- [ ] Forgot password page loads correctly
- [ ] Email validation works
- [ ] Success message shows after submission
- [ ] Reset email is received
- [ ] Reset link redirects to reset password page
- [ ] Token is extracted from URL correctly
- [ ] Password confirmation validation works
- [ ] Password reset succeeds with valid token
- [ ] Error shown for expired/invalid tokens
- [ ] Redirect to login after successful reset
- [ ] All error states are handled gracefully

---

## 🔧 Environment Configuration

Make sure your frontend is configured to:
- Run on `http://localhost:3001` (or update the email URL)
- Proxy API calls to `http://localhost:3000`
- Handle routing for `/forgot-password` and `/reset-password`

---

**That's it! Your frontend developer has everything needed to implement the complete forgot password flow! 🚀** 