# Sprint 7 — Conversation System Report

This report outlines the technical design, architectural patterns, user isolation queries, database mappings, and integration testing completed during Sprint 7 for the **DevMate AI** platform.

---

## Conversation Architecture

The conversation module is decoupled from AI generation processes and works independently to establish ChatGPT-style chat sessions. It conforms strictly to the Service-Based architecture:

```
User (HTTP Request)
      │
      ▼
┌──────────────┐
│ Route Layer  │  --> secure endpoint check, JWT validation
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Controllers  │  --> parses query parameters, executes basic syntax validation
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Services   │  --> implements title trimming, isolation rules, DB commands
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Database   │  --> MySQL SELECT/INSERT transactions
└──────────────┘
```

---

## Existing Database Integration & Table Usage

No database structure revisions, schema modifications, or migrations were introduced during this sprint. The system integrates directly with the existing `conversations` database table created in Sprint 2:

```sql
CREATE TABLE IF NOT EXISTS conversations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_conversation_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;
```

---

## API Endpoints

All endpoints are mounted under the `/api/conversations` prefix:

| HTTP Verb | Path | Middleware | Description |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/conversations` | `protect` (JWT) | Establish a new conversation. Accepts optional `prompt` in body to build the title. |
| **GET** | `/api/conversations` | `protect` (JWT) | Load all conversation headers belonging to the authenticated user. |
| **GET** | `/api/conversations/:id` | `protect` (JWT) | Fetch details of a single conversation session after checking ownership. |

---

## User Isolation Logic

To prevent security breaches where one user attempts to fetch or manipulate another user's chat sessions, user verification is enforced directly at the SQL level.
- Single conversation lookups use both the session identifier and the active user ID context:
  ```sql
  SELECT id, user_id as userId, title, created_at as createdAt 
  FROM conversations 
  WHERE id = ? AND user_id = ?;
  ```
- Unauthorized cross-user fetch queries (User B trying to load User A's session) are intercepted at the controller layer via dynamic pre-checks (`getRawConversation`) and rejected with an explicit `403 Forbidden` status.

---

## Validation Strategy

1. **Missing or Invalid IDs**: Rejects non-numeric or negative ID parameters with `400 Bad Request`.
2. **Missing JWT Credentials**: Requests lacking token payloads are blocked by the middleware with `401 Unauthorized`.
3. **Conversations Not Found**: Queries matching non-existent IDs return `404 Not Found`.
4. **Clean Titles**: Automatically extracts titles from the first prompt (stripped of extra whitespace and truncated to a maximum of 50 characters). If no prompt is provided, defaults to `"New Conversation"`. No AI calls are executed for title generation.

---

## Testing & Verification Results

Verification was performed using the automated integration test script [testConversations.js](file:///c:/Users/Shaurya%20Binjola/Desktop/DevMate_AI/backend/src/utils/testConversations.js).

### Test Suite Execution Output (`npm run conversations:test`):

```
> backend@1.0.0 conversations:test
> node src/utils/testConversations.js

[INFO]: Initializing MySQL connection pool...
[INFO]: MySQL connection pool configured for database "devmate_ai" on 127.0.0.1:3306
[INFO]: ==================================================
[INFO]: Starting Conversation System Integration Audit...
[INFO]: ==================================================
[INFO]: Test 1: Creating conversation for User A...
[INFO]: Conversation Service: Creating conversation for user 6 with title "Create a robust and fast microservice API in Py..."
[INFO]: Test 1 Passed: Conversation created (ID: 3) with title "Create a robust and fast microservice API in Py...".
[INFO]: Test 2: Fetching all conversations for User A...
[INFO]: Conversation Service: Fetching conversations for user 6
[INFO]: Test 2 Passed: Fetched 1 conversations successfully.
[INFO]: Test 3: Fetching single conversation by ID for User A...
[INFO]: Conversation Service: Retrieving conversation 3 for user 6
[INFO]: Test 3 Passed: Successfully retrieved conversation after verifying owner.
[INFO]: Test 4: Verifying user isolation (User B access check to User A's conversation)...
[INFO]: Test 4 Passed: User B access attempt to User A's conversation correctly blocked with 403.
[INFO]: Test 5: Testing route validation with missing credentials (unauthenticated)...
[INFO]: Test 5 Passed: Request without authenticated credentials blocked with 401.
[INFO]: Test 6: Fetching with invalid ID structure (e.g. non-numeric)...
[INFO]: Test 6 Passed: Non-numeric ID format blocked with 400.
[INFO]: Test 7: Fetching non-existent conversation ID...
[INFO]: Test 7 Passed: Non-existent ID correctly responded with 404.
[INFO]: Cleaning up database test records...
[INFO]: Cleanup complete.
[INFO]: ==================================================
[INFO]: Conversation System verification tests completed successfully!
[INFO]: ==================================================
```

### Verification Summary:
- **Create session**: ✅ Passed
- **Load user list**: ✅ Passed
- **Retrieve by ID**: ✅ Passed
- **Access isolation check (403)**: ✅ Passed
- **Missing JWT intercept (401)**: ✅ Passed
- **Invalid ID parameters (400)**: ✅ Passed
- **Non-existent ID mappings (404)**: ✅ Passed
