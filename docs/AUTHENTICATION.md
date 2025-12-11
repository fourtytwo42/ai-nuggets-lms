# Authentication System

## Overview

The AI Microlearning LMS uses JWT-based authentication with role-based access control (RBAC). All protected routes require authentication, and users are redirected to login if not authenticated.

## Authentication Flow

1. **Registration**: Users can create accounts at `/register`
   - Creates a new organization if one doesn't exist
   - Creates a user account with the 'learner' role by default
   - Automatically creates a learner profile

2. **Login**: Users authenticate at `/login`
   - Validates email and password
   - Returns JWT token and user information
   - Token is stored in localStorage

3. **Protected Routes**: All routes under `/(app)/*` require authentication
   - Middleware checks for valid JWT token
   - Redirects to `/login` if not authenticated
   - Token is sent in `Authorization: Bearer <token>` header

4. **Logout**: Clears token from localStorage and redirects to login

## User Roles

- **admin**: Full system access, can manage ingestion, nuggets, settings
- **learner**: Can access learning sessions and dashboard
- **instructor**: (Future) Can create and manage content

## Test Accounts

After running the seed script (`npm run db:seed`), the following test accounts are available:

- **Admin**: `admin@test.com` / `admin123`
- **Learner 1**: `learner@test.com` / `learner123`
- **Learner 2**: `user@test.com` / `user123`

## API Endpoints

### POST /api/auth/register
Creates a new user account and organization.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "organizationName": "My Organization"
}
```

**Response:**
```json
{
  "token": "jwt-token-here",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "learner",
    "organizationId": "org-id"
  }
}
```

### POST /api/auth/login
Authenticates a user and returns a JWT token.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "jwt-token-here",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "learner",
    "organizationId": "org-id"
  },
  "expiresAt": "2025-12-14T12:00:00.000Z"
}
```

### POST /api/auth/refresh
Refreshes an existing JWT token.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "token": "new-jwt-token-here",
  "expiresAt": "2025-12-14T12:00:00.000Z"
}
```

### POST /api/auth/logout
Logs out a user (client-side token removal).

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true
}
```

## Frontend Authentication

### Client-Side Utilities

Located in `src/lib/auth/client.ts`:

- `getToken()`: Retrieves JWT token from localStorage
- `getUser()`: Retrieves user information from localStorage
- `setAuth(token, user)`: Stores token and user info
- `clearAuth()`: Removes authentication data
- `isAuthenticated()`: Checks if user is authenticated
- `fetchWithAuth(url, options)`: Wrapper for fetch with auth header

### Protected Routes

All routes under `app/(app)/*` are protected by:
1. Next.js middleware (`src/middleware.ts`) - checks for token
2. Client-side layout (`app/(app)/layout.tsx`) - redirects if not authenticated

## Security Considerations

1. **JWT Tokens**: Tokens expire after 3 days (configurable via `JWT_EXPIRES_IN`)
2. **Password Hashing**: Uses bcrypt with salt rounds
3. **Token Storage**: Tokens stored in localStorage (consider httpOnly cookies for production)
4. **HTTPS**: Required in production to protect tokens in transit
5. **Rate Limiting**: Should be implemented for login/register endpoints

## Environment Variables

Required environment variables:

- `JWT_SECRET`: Secret key for signing JWT tokens
- `JWT_EXPIRES_IN`: Token expiration time (default: "3d")
- `DATABASE_URL`: PostgreSQL connection string

## Seeding Test Data

To seed test accounts:

```bash
npm run db:seed
```

Or with timeout protection:

```bash
npm run db:seed:safe
```

This creates:
- 1 test organization
- 1 admin user
- 2 learner users with profiles

