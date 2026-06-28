# Sprint 9 — History System Report

This report outlines the technical design, architectural patterns, user isolation queries, database mappings, sorting/filtering parameters, and integration testing completed during Sprint 9 for the **DevMate AI** platform.

---

## History Architecture

The activity history logging module is designed to track feature utilization across the application dynamically. It integrates into any endpoint layer and stores records inside the `history` table:

```
Any App Feature Controller (e.g. Code Gen)
                   │
                   ▼
       historyService.logActivity()
                   │
                   ▼
┌──────────────┐
│  Database   │  --> MySQL history table saves
└──────────────┘
```

Retrieval queries flow through standard secure route endpoints:

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
│ Controllers  │  --> parses query parameters, whitelists sort orders
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Services   │  --> implements filters, handles ownership check
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Database   │  --> MySQL query lookups
└──────────────┘
```

---

## Existing Database Integration & Table Usage

No database structure revisions, schema modifications, or migrations were introduced during this sprint. The system integrates directly with the existing `history` database table created in Sprint 2:

```sql
CREATE TABLE IF NOT EXISTS history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  feature_type VARCHAR(100) NOT NULL, -- e.g. 'code-gen', 'explanation', etc.
  input TEXT NOT NULL,
  output TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_history_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;
```

---

## API Design

All history endpoints are mounted under the `/api/history` prefix:

| HTTP Verb | Path | Middleware | Description |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/history` | `protect` (JWT) | List history log records. Supports optional filter query `?featureType=code-gen` and sort query `?sort=ASC` (defaults to `DESC`). |
| **GET** | `/api/history/:id` | `protect` (JWT) | Retrieve a single history log record details after verifying ownership context. |

---

## User Isolation Strategy

1. **SQL-Level Scoping**: Listing queries strictly append `WHERE user_id = ?` to verify user context. Single-record queries filter by both target log ID and authenticated owner ID:
   ```sql
   SELECT id, user_id as userId, feature_type as featureType, input, output, created_at as createdAt 
   FROM history 
   WHERE id = ? AND user_id = ?;
   ```
2. **Access Rejection Controls**: Before fetching log details, the controller executes a general ID check. If it exists but is owned by another profile, it blocks with `403 Forbidden`. If missing, it responds with `404 Not Found`.

---

## Testing & Verification Results

Verification was performed using the integration test script [testHistory.js](file:///c:/Users/Shaurya%20Binjola/Desktop/DevMate_AI/backend/src/utils/testHistory.js).

### Test Suite Execution Output (`npm run history:test`):

```
> backend@1.0.0 history:test
> node src/utils/testHistory.js

[INFO]: Initializing MySQL connection pool...
[INFO]: MySQL connection pool configured for database "devmate_ai" on 127.0.0.1:3306
[INFO]: ==================================================
[INFO]: Starting History System Integration Audit...
[INFO]: ==================================================
[INFO]: Test 1: Logging multiple feature activities for User A...
[INFO]: Test 1 Passed: Logs successfully created for all 6 features.
[INFO]: Test 2: Loading activity history list for User A...
[INFO]: History Service: Loading history logs for user 14
[INFO]: Test 2 Passed: Fetched 6 history records.
[INFO]: Test 3: Filtering history list by featureType="code-gen"...
[INFO]: History Service: Loading history logs for user 14
[INFO]: Test 3 Passed: Successfully filtered; returned 1 code-gen rows.
[INFO]: Test 4: Checking chronological sorting (ASC vs DESC)...
[INFO]: History Service: Loading history logs for user 14
[INFO]: History Service: Loading history logs for user 14
[INFO]: Test 4 Passed: Chronological sort direction validated.
[INFO]: Test 5: Testing tenant isolation (User B lookup on User A's log)...
[INFO]: Test 5 Passed: User B access request blocked with 403 Forbidden.
[INFO]: Test 6: Validation checks for bad/non-numeric history IDs...
[INFO]: Test 6 Passed: Bad numeric format blocked with 400.
[INFO]: Test 7: Testing route validation with missing credentials (unauthenticated)...
[INFO]: Test 7 Passed: Unauthenticated request blocked with 401.
[INFO]: Test 8: Checking missing history ID mappings (404)...
[INFO]: Test 8 Passed: Non-existent log record returned 404.
[INFO]: Cleaning up database test records...
[INFO]: Teardown complete.
[INFO]: ==================================================
[INFO]: History System verification tests completed successfully!
[INFO]: ==================================================
```

### Verification Summary:
- **Save feature usage (all 6 categories)**: ✅ Passed
- **Retrieve logs**: ✅ Passed
- **Filter by category check**: ✅ Passed
- **Sort by order (ASC/DESC)**: ✅ Passed
- **Tenant isolation boundary (403)**: ✅ Passed
- **Bad numeric formats (400)**: ✅ Passed
- **Unauthenticated checks (401)**: ✅ Passed
- **Non-existent log ID (404)**: ✅ Passed
