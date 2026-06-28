# Sprint 16 — Chat Management Report

This report outlines the technical design, architectural patterns, ownership verification logic, API design, database schemas mapping, and verification outcomes completed during Sprint 16 for the **DevMate AI** platform.

---

## Chat Management Architecture

The Chat Management module provides renaming, deleting, listing, searching, sorting, and paginating chats (conversations). It interacts directly with the database tables (`conversations` and `messages`), keeping backend structures aligned. It conforms strictly to the Service-Based architecture:

```
User (HTTP Request)
      │
      ▼
┌──────────────┐
│ Route Layer  │  --> secure PATCH/DELETE/GET endpoints, JWT verification
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Controllers  │  --> validates query/body parameters, extracts user ID
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Services   │  --> manages database CRUD statements
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Database   │  --> performs SQL queries over conversations & messages tables
└──────────────┘
```

---

## Ownership Verification Logic

To prevent unauthorized access to other user chats (cross-user chat leakage):
1. **Ownership Check (`verifyOwnership`)**: Before performing rename (`PATCH`) or delete (`DELETE`) operations, the service queries the `conversations` table for the target chat ID.
2. **Authorization Enforcement**: If the conversation does not exist, a `404 Not Found` is thrown. If the conversation's `user_id` does not match the authenticated user's ID (`req.user.id`), a `403 Forbidden` error is returned, blocking the operation.
3. **Isolated Queries**: Listing and search queries incorporate the `user_id = ?` clause directly in the SQL statement.

---

## API Design

The following REST endpoints are mounted under `/api/chats` inside [routes/index.js](file:///c:/Users/Shaurya%20Binjola/Desktop/DevMate_AI/backend/src/routes/index.js):

| Method | Endpoint | Description | Query/Body Parameters |
| :--- | :--- | :--- | :--- |
| **PATCH** | `/api/chats/:id/rename` | Renames conversation title | Body: `{ "title": "New Title" }` |
| **DELETE** | `/api/chats/:id` | Deletes conversation and messages | Path Parameter: `id` |
| **GET** | `/api/chats` | Lists user chats (paginated/sorted) | Query: `?page=1&limit=10&sortBy=latest` |
| **GET** | `/api/chats/search` | Searches conversation title/messages | Query: `?q=searchTerm` |
| **POST** | `/api/chats` | Creates conversation (Legacy compatibility) | Body: `{ "title": "New Chat" }` |
| **POST** | `/api/chats/:conversationId/messages` | Saves a conversation message (Legacy) | Body: `{ "role": "user", "content": "..." }` |

---

## Testing & Verification Results

Verification was performed using the integration test script [testChats.js](file:///c:/Users/Shaurya%20Binjola/Desktop/DevMate_AI/backend/src/utils/testChats.js).

### Test Suite Execution Output (`npm run chats:test`):

```
> backend@1.0.0 chats:test
> node src/utils/testChats.js

[INFO]: Initializing MySQL connection pool...
[INFO]: MySQL connection pool configured for database "devmate_ai" on 127.0.0.1:3306
[INFO]: ==================================================
[INFO]: Starting Chat Management Integration Audit...
[INFO]: ==================================================
[INFO]: Test 1: Listing user conversations sorting by latest first...
[INFO]: Test 1 Passed: Chats list returned chronological latest first order.
[INFO]: Test 2: Listing user conversations sorting by oldest first...
[INFO]: Test 2 Passed: Chats list returned chronological oldest first order.
[INFO]: Test 3: Checking pagination bounds limits...
[INFO]: Test 3 Passed: Pagination offset calculations succeeded.
[INFO]: Test 4: Renaming conversation title context...
[INFO]: Test 4 Passed: Chat renamed successfully.
[INFO]: Test 5: Searching conversations matching title query...
[INFO]: Test 5 Passed: Search matching title succeeded.
[INFO]: Test 6: Searching conversations matching message body content...
[INFO]: Test 6 Passed: Search matching message content succeeded.
[INFO]: Test 7: Confirming ownership check boundaries (User B renaming User A chat)...
[INFO]: Test 7 Passed: Unauthorized access correctly rejected with 403 Forbidden.
[INFO]: Test 8: Validating parameter validation for empty rename title...
[INFO]: Test 8 Passed: Empty title successfully rejected with 400 Bad Request.
[INFO]: Test 9: Deleting conversation and message logs references...
[INFO]: Test 9 Passed: Chat session and messages successfully deleted from DB tables.
[INFO]: Cleaning up database test records...
[INFO]: Teardown complete.
[INFO]: ==================================================
[INFO]: Chat Management verification tests completed successfully!
[INFO]: ==================================================
```

### Verification Summary:
- **List Chats (Latest First / Oldest First)**: ✅ Passed
- **Pagination offset constraints**: ✅ Passed
- **Rename Chat**: ✅ Passed
- **Delete Chat & message cascades**: ✅ Passed
- **Search Conversations (Title & Content matches)**: ✅ Passed
- **Ownership Verification (Cross-tenant protection)**: ✅ Passed
- **Invalid Payload validation (400)**: ✅ Passed
