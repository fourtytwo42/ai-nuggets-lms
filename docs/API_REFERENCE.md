# API Reference

Complete API documentation for the AI Microlearning LMS.

## Base URL

- **Development:** `http://localhost:3000/api`
- **Production:** `https://your-domain.com/api`

## Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <jwt-token>
```

Tokens are obtained via `/api/auth/login` or `/api/auth/register`.

## Endpoints

### Authentication

#### POST /api/auth/register

Register a new user account.

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
  "token": "jwt-token",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "learner",
    "organizationId": "uuid"
  }
}
```

#### POST /api/auth/login

Authenticate user.

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
  "token": "jwt-token",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "learner",
    "organizationId": "uuid"
  },
  "expiresAt": "2025-12-13T12:00:00Z"
}
```

#### POST /api/auth/refresh

Refresh JWT token.

**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
{
  "token": "new-jwt-token",
  "expiresAt": "2025-12-13T12:00:00Z"
}
```

#### POST /api/auth/logout

Logout user.

**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
{
  "success": true
}
```

### Content Ingestion

#### POST /api/admin/ingestion/folders

Add a watched folder.

**Headers:** `Authorization: Bearer <token>` (Admin required)

**Request:**

```json
{
  "path": "/path/to/folder",
  "fileTypes": ["pdf", "docx", "txt"],
  "recursive": true,
  "autoProcess": true
}
```

**Response:**

```json
{
  "id": "uuid",
  "path": "/path/to/folder",
  "enabled": true,
  "fileTypes": ["pdf", "docx", "txt"],
  "recursive": true,
  "autoProcess": true,
  "createdAt": "2025-12-10T12:00:00Z"
}
```

#### GET /api/admin/ingestion/folders

List watched folders.

**Headers:** `Authorization: Bearer <token>` (Admin required)

**Response:**

```json
[
  {
    "id": "uuid",
    "path": "/path/to/folder",
    "enabled": true,
    "fileTypes": ["pdf", "docx"],
    "recursive": true,
    "autoProcess": true,
    "createdAt": "2025-12-10T12:00:00Z"
  }
]
```

#### PUT /api/admin/ingestion/folders/:id

Update watched folder.

**Headers:** `Authorization: Bearer <token>` (Admin required)

**Request:**

```json
{
  "enabled": false,
  "fileTypes": ["pdf"]
}
```

#### DELETE /api/admin/ingestion/folders/:id

Remove watched folder.

**Headers:** `Authorization: Bearer <token>` (Admin required)

**Response:**

```json
{
  "success": true
}
```

#### POST /api/admin/ingestion/urls

Add monitored URL.

**Headers:** `Authorization: Bearer <token>` (Admin required)

**Request:**

```json
{
  "url": "https://example.com/content",
  "checkInterval": 5
}
```

#### GET /api/admin/ingestion/urls

List monitored URLs.

**Headers:** `Authorization: Bearer <token>` (Admin required)

#### PUT /api/admin/ingestion/urls/:id

Update monitored URL.

**Headers:** `Authorization: Bearer <token>` (Admin required)

#### DELETE /api/admin/ingestion/urls/:id

Remove monitored URL.

**Headers:** `Authorization: Bearer <token>` (Admin required)

#### GET /api/admin/ingestion/jobs

List ingestion jobs.

**Headers:** `Authorization: Bearer <token>` (Admin required)

**Query Parameters:**

- `status` (optional): Filter by status
- `limit` (optional): Maximum results (default: 50)

### File Management

#### POST /api/admin/files/upload

Upload a file for processing.

**Headers:**

- `Authorization: Bearer <token>` (Admin required)
- `Content-Type: multipart/form-data`

**Request:** Form data with `file` field

**Response:**

```json
{
  "message": "File uploaded and queued for processing",
  "job": {
    "id": "uuid",
    "type": "file",
    "status": "pending"
  }
}
```

#### GET /api/admin/files

List uploaded files.

**Headers:** `Authorization: Bearer <token>` (Admin required)

**Response:**

```json
[
  {
    "id": "uuid",
    "filename": "document.pdf",
    "filetype": "pdf",
    "filesize": 1024000,
    "status": "completed",
    "nuggetCount": 5,
    "createdAt": "2025-12-10T12:00:00Z"
  }
]
```

#### GET /api/admin/files/:id

Download or preview file.

**Headers:** `Authorization: Bearer <token>` (Admin required)

**Response:** File content with appropriate Content-Type

#### DELETE /api/admin/files/:id

Delete file and associated nuggets.

**Headers:** `Authorization: Bearer <token>` (Admin required)

**Response:**

```json
{
  "success": true
}
```

### Settings

#### GET /api/admin/settings/ai-models

Get AI model configuration.

**Headers:** `Authorization: Bearer <token>` (Admin required)

#### PUT /api/admin/settings/ai-models

Update AI model configuration.

**Headers:** `Authorization: Bearer <token>` (Admin required)

**Request:**

```json
{
  "contentGenerationModel": "gpt-4o",
  "tutoringModel": "gpt-4o",
  "tutoringTemp": 0.8
}
```

#### GET /api/admin/settings/voice

Get voice configuration.

**Headers:** `Authorization: Bearer <token>` (Admin required)

#### PUT /api/admin/settings/voice

Update voice configuration.

**Headers:** `Authorization: Bearer <token>` (Admin required)

**Request:**

```json
{
  "ttsProvider": "openai-hd",
  "ttsModel": "tts-1-hd",
  "ttsVoice": "nova",
  "qualityTier": "high"
}
```

#### GET /api/admin/settings/system

Get system settings.

**Headers:** `Authorization: Bearer <token>` (Admin required)

**Query Parameters:**

- `key` (optional): Get specific setting
- `scope` (optional): Filter by scope

#### POST /api/admin/settings/system

Create or update system setting (upsert).

**Headers:** `Authorization: Bearer <token>` (Admin required)

**Request:**

```json
{
  "key": "OPENAI_API_KEY",
  "value": "sk-...",
  "scope": "system",
  "scopeId": null
}
```

#### DELETE /api/admin/settings/system

Delete system setting.

**Headers:** `Authorization: Bearer <token>` (Admin required)

**Query Parameters:**

- `key` (required): Setting key to delete

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message",
  "errorType": "validation_error" | "authentication_error" | "authorization_error" | "not_found" | "server_error"
}
```

**Status Codes:**

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Rate Limiting

- **Default:** 100 requests per minute per user
- **Headers:** `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

## Related Documentation

- [Authentication System](AUTHENTICATION.md) - Auth details
- [Content Ingestion](CONTENT_INGESTION.md) - Ingestion system
- [File Management](FILE_MANAGEMENT.md) - File system
