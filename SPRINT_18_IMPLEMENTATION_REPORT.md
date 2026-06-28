# Sprint 18 — Profile Management Report

This report outlines the technical design, architectural patterns, password change security mechanisms, input validations, database schemas integration, and verification outcomes completed during Sprint 18 for the **DevMate AI** platform.

---

## Profile Architecture

The Profile Management module enables users to view/edit profile details and securely modify passwords. It connects directly with the database `users` table. It conforms strictly to the Service-Based architecture:

```
User (HTTP Request)
      │
      ▼
┌──────────────┐
│ Route Layer  │  --> secure GET/PUT profile endpoints, JWT verification
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Controllers  │  --> validates parameters schema (name, email, password bounds)
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Services   │  --> manages database updates, verifies current passwords
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Database   │  --> performs SQL queries over users table
└──────────────┘
```

---

## Password Update Flow

1. **Request Submission**: Client sends `PUT /api/profile/change-password` passing `currentPassword` and `newPassword`.
2. **Controller Validations**: Verifies parameters presence, verifies that the `newPassword` length is at least 6 characters.
3. **Identity verification**: Service fetches current password hash from database.
4. **Current Password Verify**: Checks validity by comparing `currentPassword` against database hash using `bcrypt.compare`.
5. **Re-Hashing and updates**: Hashes `newPassword` using `bcrypt.hash` (salt rounds: 12) and saves the hash back to database.

---

## Security Considerations

- **Duplication Checks**: Email updates check that the new email is not already registered by another user.
- **Parametric Isolation**: Raw SQL parameters are fully parameterized using mysql bindings to prevent SQL injections.
- **Access Isolation**: Standard JWT protects routes; only the user corresponding to the token ID can view/edit their own profile details.

---

## Testing & Verification Results

Verification was performed using the integration test script [testProfile.js](file:///c:/Users/Shaurya%20Binjola/Desktop/DevMate_AI/backend/src/utils/testProfile.js).

### Test Suite Execution Output (`npm run profile:test`):

```
> backend@1.0.0 profile:test
> node src/utils/testProfile.js

[INFO]: Initializing MySQL connection pool...
[INFO]: MySQL connection pool configured for database "devmate_ai" on 127.0.0.1:3306
[INFO]: ==================================================
[INFO]: Starting Profile Management Integration Audit...
[INFO]: ==================================================
[INFO]: Test 1: Retrieving profile info details...
[INFO]: Test 1 Passed: Profile retrieved successfully.
[INFO]: Test 2: Updating name and email values...
[INFO]: Test 2 Passed: Profile details successfully updated.
[INFO]: Test 3: Checking duplicate email conflict protection bounds (400)...
[INFO]: Test 3 Passed: Duplicate email edit successfully rejected with 400.
[INFO]: Test 4: Requesting secure password change and hashing update...
[INFO]: Test 4 Passed: Password updated, rehashed and authenticated successfully.
[INFO]: Test 5: Requesting password change with incorrect current password credentials...
[INFO]: Test 5 Passed: Incorrect current password successfully rejected with 400.
[INFO]: Test 6: Fetching profile without auth token context...
[INFO]: Test 6 Passed: Access without user credentials blocked with 401.
[INFO]: Cleaning up database test records...
[INFO]: Teardown complete.
[INFO]: ==================================================
[INFO]: Profile Management verification tests completed successfully!
[INFO]: ==================================================
```

### Verification Summary:
- **Profile view (GET)**: ✅ Passed
- **Profile edit (PUT)**: ✅ Passed
- **Duplicate email checks**: ✅ Passed
- **Password update check**: ✅ Passed
- **Password rehashing checks**: ✅ Passed
- **Incorrect current password bounds checks**: ✅ Passed
- **JWT Protection blocker checks**: ✅ Passed
