# Sprint 8 — Message Persistence Report

This report outlines the technical design, architectural patterns, user isolation queries, database mappings, pagination details, and integration testing completed during Sprint 8 for the **DevMate AI** platform.

---

## Message Architecture

The message persistence module is decoupled from prompt generation/AI execution and runs independently to save and retrieve conversation message transcripts. It conforms strictly to the Service-Based architecture:

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
│ Controllers  │  --> parses query parameters, page/limit defaults, validates syntax
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Services   │  --> verifies ownership, calculates offset pagination parameters
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Database   │  --> MySQL SELECT/INSERT transactions with JOIN statements
└──────────────┘
```

---

## Existing Database Integration & Table Usage

No database structure revisions, schema modifications, or migrations were introduced during this sprint. The system integrates directly with the existing `messages` database table created in Sprint 2:

```sql
CREATE TABLE IF NOT EXISTS messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  conversation_id INT NOT NULL,
  sender VARCHAR(50) NOT NULL, -- 'user' or 'ai'
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_message_conversation FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
) ENGINE=InnoDB;
```

---

## API Endpoints

All endpoints are mounted under the `/api/messages` prefix:

| HTTP Verb | Path | Middleware | Description |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/messages` | `protect` (JWT) | Save a conversation message. Accepts `conversationId`, `sender` ('user' or 'ai'), and `content`. |
| **GET** | `/api/messages/:conversationId` | `protect` (JWT) | Retrieve conversation messages with pagination. Supports query parameters `?page=X&limit=Y`. |

---

## User Isolation & Retrieval Flow

To ensure strict tenant isolation and verify conversation ownership, messages are fetched using a JOIN condition linking `messages` and `conversations` at the database level:

```sql
SELECT m.id, m.conversation_id as conversationId, m.sender, m.content, m.created_at as createdAt 
FROM messages m
INNER JOIN conversations c ON m.conversation_id = c.id
WHERE m.conversation_id = ? AND c.user_id = ?
ORDER BY m.created_at ASC
LIMIT [limit] OFFSET [offset];
```

By binding BOTH the `conversationId` and `userId` context, user isolation is guaranteed at the query compilation layer, preventing any unauthorized user from reading or appending message logs.

---

## Pagination Strategy

- Queries accept parameters `page` and `limit` (defaulting to `1` and `20` respectively).
- Evaluates total records to construct structured metadata containing:
  - `messages`: Chronological list.
  - `page`: Active page index.
  - `limit`: Items limit.
  - `total`: Total records.
  - `totalPages`: Total counts divided by limit.
- LIMIT and OFFSET values are parsed to integers and interpolated directly in the SQL string to bypass mysql2 prepared statement issues with type bindings.

---

## Validation Strategy

1. **Missing or Invalid parameters**: Checks parameters for type and existence (HTTP 400).
2. **Sender validation**: Enforces values are strictly `'user'` or `'ai'` (HTTP 400).
3. **Empty message validations**: Enforces message body size is greater than 0 (HTTP 400).
4. **Ownership & Exist check**: Fetches conversation status first; returns `404 Not Found` if missing, or `403 Forbidden` if owned by another profile.

---

## Testing & Verification Results

Verification was performed using the integration test script [testMessages.js](file:///c:/Users/Shaurya%20Binjola/Desktop/DevMate_AI/backend/src/utils/testMessages.js).

### Test Suite Execution Output (`npm run messages:test`):

```
> backend@1.0.0 messages:test
> node src/utils/testMessages.js

[INFO]: Initializing MySQL connection pool...
[INFO]: MySQL connection pool configured for database "devmate_ai" on 127.0.0.1:3306
[INFO]: ==================================================
[INFO]: Starting Message Persistence Integration Audit...
[INFO]: ==================================================
[INFO]: Test 1: Saving User message for User A...
[INFO]: Message Service: Saving message from "user" in conversation 6
[INFO]: Test 1 Passed: User message successfully saved in messages table.
[INFO]: Test 2: Saving AI message response for User A...
[INFO]: Message Service: Saving message from "ai" in conversation 6
[INFO]: Test 2 Passed: AI response successfully saved in messages table.
[INFO]: Test 3: Retrieving messages and checking chronological order...
[INFO]: Message Service: Fetching messages for conversation 6 (User: 10, Page: 1, Limit: 20)
[INFO]: Test 3 Passed: Chronological sort (created_at ASC) verified correctly.
[INFO]: Test 4: Checking pagination controls (page=1, limit=1)...
[INFO]: Message Service: Fetching messages for conversation 6 (User: 10, Page: 1, Limit: 1)
[INFO]: Test 4 Passed: Pagination metadata matches expected parameters.
[INFO]: Test 5: Testing tenant isolation constraints (User B access check)...
[INFO]: Test 5 Passed: User B block validated with 403 Forbidden.
[INFO]: Test 6: Validation checks for bad/non-numeric conversation IDs...
[INFO]: Test 6 Passed: Bad numeric format blocked with 400.
[INFO]: Test 7: Missing credential validation rejections...
[INFO]: Test 7 Passed: Unauthenticated request intercepted and rejected with 401.
[INFO]: Test 8: Checking missing conversation ID mappings (404)...
[INFO]: Test 8 Passed: Non-existent conversation responded with 404.
[INFO]: Cleaning up database test logs...
[INFO]: Teardown complete.
[INFO]: ==================================================
[INFO]: Message System verification tests completed successfully!
[INFO]: ==================================================
```

### Verification Summary:
- **Save user message**: ✅ Passed
- **Save AI response**: ✅ Passed
- **Chronological ordering check**: ✅ Passed
- **Pagination metadata check**: ✅ Passed
- **Tenant isolation constraints (403)**: ✅ Passed
- **Bad parameters formats (400)**: ✅ Passed
- **Unauthorized missing JWT (401)**: ✅ Passed
- **Non-existent conversation ID (404)**: ✅ Passed
