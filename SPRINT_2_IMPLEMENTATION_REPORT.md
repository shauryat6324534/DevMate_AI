# Sprint 2 — Database Setup Report

This report outlines the Entity-Relationship structures, design decisions, database configurations, connection pooling parameters, and verification tests completed during Sprint 2.

---

## ER Diagram Explanation

The relational structure of **DevMate AI** is designed around a single central entity (`users`) mapping out to user interactions, audit logs, and downloadable outputs:

```mermaid
erDiagram
    users ||--o{ conversations : "owns"
    users ||--o{ history : "logs"
    users ||--o{ downloads : "exports"
    conversations ||--o{ messages : "contains"

    users {
        int id PK
        varchar name
        varchar email UNIQUE
        varchar password
        timestamp created_at
    }

    conversations {
        int id PK
        int user_id FK
        varchar title
        timestamp created_at
    }

    messages {
        int id PK
        int conversation_id FK
        varchar sender
        text content
        timestamp created_at
    }

    history {
        int id PK
        int user_id FK
        varchar feature_type
        text input
        text output
        timestamp created_at
    }

    downloads {
        int id PK
        int user_id FK
        varchar file_type
        varchar file_name
        timestamp created_at
    }
```

### Relationships:
1. **One-to-Many (`users` -> `conversations`)**: A user can own multiple chat sessions. Deleting a user automatically triggers a cascade delete of all their conversations.
2. **One-to-Many (`conversations` -> `messages`)**: A conversation holds a series of user and AI messages. Deleting a conversation thread cascades to remove all associated message rows.
3. **One-to-Many (`users` -> `history`)**: Tracks usage activity. Linked to users with cascading delete.
4. **One-to-Many (`users` -> `downloads`)**: Tracks file exports. Linked to users with cascading delete.

---

## Database Design Decisions

1. **MySQL Relational Database**: Chosen for ACID conformity, structural safety, and efficient foreign-key constraint enforcement.
2. **Cascading Referential Integrity (`ON DELETE CASCADE`)**: Enforced at the engine layer to guarantee clean deletion processes. When a parent user account is removed, all child rows in `conversations`, `history`, and `downloads` are wiped from disk, preventing dangling pointer indexes.
3. **Utf8mb4 Character Collation**: All tables are configured with `DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci` to support full unicode symbols, emoji characters, and international formatting.
4. **Indexed Primary & Unique Fields**: User emails are designated as `UNIQUE` to prevent profile collisions. Primary keys are configured as auto-incrementing integers for rapid query indexing.

---

## Table Explanations

| Table Name | Description | Columns & Constraints |
| :--- | :--- | :--- |
| **`users`** | Stores developer registration credentials. | `id` (PK, Auto-Increment), `name`, `email` (Unique), `password`, `created_at` (Default Current Timestamp). |
| **`conversations`** | Groups message threads into sessions. | `id` (PK), `user_id` (FK referencing `users(id)`), `title`, `created_at`. |
| **`messages`** | Holds chat thread transcripts. | `id` (PK), `conversation_id` (FK referencing `conversations(id)`), `sender` ('user' / 'ai'), `content`, `created_at`. |
| **`history`** | Logs feature analytics and inputs. | `id` (PK), `user_id` (FK referencing `users(id)`), `feature_type`, `input`, `output`, `created_at`. |
| **`downloads`** | Manages file export references. | `id` (PK), `user_id` (FK referencing `users(id)`), `file_type` ('txt' / 'md'), `file_name`, `created_at`. |

---

## Connection Pool Explanation

To optimize resource allocation and prevent overheads from repeatedly establishing sockets, a connection pool is set up in `db.js` using `mysql2/promise`:

- **Active Pool Instance**: `mysql.createPool(...)`
- **Dynamic Connection Limit**: Parameterized via `DB_CONNECTION_LIMIT=10` (customizable in `.env`).
- **Wait Policy**: `waitForConnections: true` and `queueLimit: 0` ensures incoming queries queue gracefully if all threads are busy, rather than immediately returning connection errors.
- **Asynchronous Execution Wrapper**: The exported `query(sql, params)` automatically handles acquiring, executing, and releasing connections back to the pool, preventing memory leaks.

---

## Testing Results

The database was validated through automated tests executing in the environment:

### 1. Schema Generation (`npm run db:init`):
- Read DDL structures from `schema.sql`.
- Verified existence of target database `devmate_ai`.
- Executed table creation transactions: **Successful**.

### 2. Transaction and Integration Testing (`npm run db:test`):
- **Arithmetic Query Execution**: Passed in 55ms.
- **Mock User Insertion**: Successfully inserted user row (ID: 1).
- **Mock Conversation Setup**: Inserted conversation thread mapping FK constraints (ID: 1).
- **Mock Message Submission**: Appended messages under conversation context.
- **Cascade Deletion Verification**: Executed `DELETE FROM users WHERE id = 1`. Cascading triggers verified: the linked conversation row with ID 1 was automatically purged from the database.
