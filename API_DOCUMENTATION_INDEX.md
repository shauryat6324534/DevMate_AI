# DevMate AI — API Documentation Index

This document maps all available backend API endpoints, listing their request types, required body parameters, and response structures.

---

## 1. Authentication
Endpoints are mounted under the `/api/auth` prefix.

### POST `/api/auth/register`
- **Description**: Creates a new user profile.
- **Body parameters**:
  ```json
  { "name": "John Doe", "email": "john@example.com", "password": "Password123" }
  ```
- **Response (201)**:
  ```json
  { "success": true, "data": { "token": "...", "user": { "id": 1, "name": "John Doe", "email": "john@example.com" } } }
  ```

### POST `/api/auth/login`
- **Description**: Authenticates users and returns session tokens.
- **Body parameters**:
  ```json
  { "email": "john@example.com", "password": "Password123" }
  ```
- **Response (200)**: Same payload structure as Registration.

---

## 2. Conversation & Chat Management
Endpoints are protected by JWT middleware and mounted under `/api/chats`.

### GET `/api/chats`
- **Description**: Retrieves a paginated list of conversations for the authenticated user.
- **Query parameters**: `page` (default: 1), `limit` (default: 10), `sortBy` (`latest` or `oldest`).
- **Response (200)**:
  ```json
  { "success": true, "data": { "conversations": [...], "page": 1, "totalPages": 2 } }
  ```

### GET `/api/chats/search`
- **Description**: Searches conversation titles for matching terms.
- **Query parameters**: `q` (e.g., `?q=binary search`).
- **Response (200)**: `{ "success": true, "data": [...] }`

### PATCH `/api/chats/:id/rename`
- **Description**: Renames the title of the specified conversation.
- **Body parameters**: `{ "title": "New Title" }`
- **Response (200)**: `{ "success": true, "message": "Conversation renamed successfully" }`

### DELETE `/api/chats/:id`
- **Description**: Deletes a conversation and its messages.
- **Response (200)**: `{ "success": true, "message": "Conversation deleted successfully" }`

---

## 3. Messages & History
Mounted under `/api/messages` and `/api/history`.

### GET `/api/messages/:conversationId`
- **Description**: Fetches messages in the specified conversation.
- **Response (200)**: `{ "success": true, "data": { "messages": [...] } }`

### GET `/api/history`
- **Description**: Fetches history records for the user.
- **Response (200)**: `{ "success": true, "data": [...] }`

---

## 4. AI Services & Learning
All require a bearer token in the `Authorization` header.

### POST `/api/learning-assistant`
- **Description**: Interacts with the coding tutor.
- **Body parameters**:
  ```json
  { "prompt": "Explain concepts", "conversationId": 12 }
  ```
- **Response (200)**: Returns formatted lessons and matches conversation IDs.

### POST `/api/explain-code`
- **Description**: Explains a code block.
- **Body parameters**: `{ "code": "...", "level": "beginner" }`
- **Response (200)**: `{ "success": true, "data": { "purpose": "...", "logic": "...", "complexity": { "time": "...", "space": "..." } } }`

### POST `/api/optimize-code`
- **Description**: Optimizes a code block.
- **Body parameters**: `{ "code": "..." }`
- **Response (200)**: `{ "success": true, "data": { "optimizedCode": "...", "explanation": "..." } }`

### POST `/api/review-code`
- **Description**: Runs a static review report.
- **Body parameters**: `{ "code": "..." }`
- **Response (200)**: `{ "success": true, "data": { "qualityScore": 85, "namingConventions": [...], "codeSmells": [...] } }`

### Documentation Generation
- `POST /api/generate-readme` -> Body: `{ "code": "..." }` -> Response: `{ "success": true, "data": { "readme": "..." } }`
- `POST /api/generate-function-docs` -> Body: `{ "code": "..." }` -> Response: `{ "success": true, "data": { "functionDocs": "..." } }`
- `POST /api/generate-api-docs` -> Body: `{ "code": "..." }` -> Response: `{ "success": true, "data": { "apiDocs": "..." } }`
- `POST /api/generate-comments` -> Body: `{ "code": "..." }` -> Response: `{ "success": true, "data": { "commentedCode": "..." } }`

---

## 5. Downloads
Mounted under `/api/download`.

### GET `/api/download/[type]`
- **Description**: Downloads generated artifacts in MD or TXT formats.
- **Types**: `code`, `explanation`, `documentation`, `review`, `learning`.
- **Query parameters**: `id` (history record ID), `format` (`txt` or `md`), `token` (for authorization verification).
- **Response**: File download stream.

---

## 6. Profile Settings
Mounted under `/api/profile`.

### GET `/api/profile`
- **Description**: Retrieves the authenticated user's profile details.
- **Response (200)**: `{ "success": true, "data": { "id": 1, "name": "...", "email": "..." } }`

### PUT `/api/profile`
- **Description**: Updates profile info details.
- **Body parameters**: `{ "name": "New Name", "email": "newemail@example.com" }`
- **Response (200)**: `{ "success": true, "data": { "id": 1, "name": "...", "email": "..." } }`

### PUT `/api/profile/change-password`
- **Description**: Changes the user password.
- **Body parameters**: `{ "currentPassword": "OldPassword!", "newPassword": "NewPassword!" }`
- **Response (200)**: `{ "success": true, "message": "Password updated successfully" }`
