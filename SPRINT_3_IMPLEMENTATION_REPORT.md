# Sprint 3 — Authentication System Report

This report outlines the authentication workflows, JWT flows, password hashing designs, security considerations, and test validations completed during Sprint 3.

---

## Authentication Flow

The end-to-end user registration and login workflows are structured to isolate validation, business logic, and security:

```
                  ┌───────────────────────┐
                  │   Incoming Request    │
                  └───────────┬───────────┘
                              │
                              ▼
                  ┌───────────────────────┐
                  │ authController.js     │ <--- Enforces input existence,
                  └───────────┬───────────┘      validates email, check strength
                              │
                              ▼
                  ┌───────────────────────┐
                  │ authService.js        │ <--- Duplicate check, hash credentials,
                  └───────────┬───────────┘      sign JWT token
                              │
                              ▼
                  ┌───────────────────────┐
                  │     MySQL Database    │ <--- Read & write operations
                  └───────────────────────┘
```

### Registration Steps:
1. **Controller Check**: Validates parameters (`name`, `email`, `password`). Employs regex check to verify email structure. Validates password strength (length >= 8, containing numbers, symbols, uppercase).
2. **Duplicate Validation**: Queries database to check if email exists. If found, returns 400.
3. **Hashing**: Salting and hashing via `bcryptjs` with 12 complexity rounds.
4. **Insertion**: Saves records in the `users` table.
5. **Token signing**: Returns signed JWT context back to the user client.

---

## JWT Flow

Stateless user session tracking utilizes JWT (JSON Web Tokens) to authenticate API queries:

```
┌──────────┐            1. POST /api/auth/login             ┌──────────┐
│  Client  │ ─────────────────────────────────────────────> │  Server  │
│          │ <───────────────────────────────────────────── │          │
│          │         2. Returns token in JSON body          └──────────┘
└──────────┘                                                     │
     │                                                           ▼
     │ 3. Attaches header: Authorization: Bearer <token>   ┌─────────────┐
     ├────────────────────────────────────────────────────>│ Middleware  │
     │                                                     └──────┬──────┘
     │                                                            │ (jwt.verify)
     │                                                            ▼
     │                                                     ┌─────────────┐
     │ <────────────────────────────────────────────────── │ Controller  │
     │                 4. Returns JSON Data                └─────────────┘
```

### Steps:
1. **Issuance**: Signed at login or register using `jwt.sign()` with payload `{ id: userId }`, utilizing `config.jwtSecret` and `config.jwtExpiresIn` (defaulting to `24h`).
2. **Header verification**: For protected API paths, the client sends `Authorization: Bearer <token>`.
3. **Auth Middleware**: Intercepts request, checks token signature using `jwt.verify`. Ensures user continues to exist in the database, then populates `req.user`.

---

## Password Hashing Explanation

- **No Plaintext Storage**: User passwords are never saved in cleartext, preventing data disclosure if database leaks occur.
- **Bcryptjs Algorithm**: A robust adaptive hashing function. Includes automatic salting to protect against rainbow table lookups.
- **Salt Complexity (Work Factor)**: 12 salt rounds is chosen, which strikes a secure balance between server response time (~600ms per registration/login) and high security margins against brute-force attempts.

---

## Security Decisions

1. **Strict Input Sanitization**: Trims whitespace parameters to prevent padding bypasses, and checks structures before SQL insertion.
2. **Standardized Rejections**: Login failures return generic warnings (`Invalid email or password`) to prevent account enumeration sweeps by malicious entities.
3. **Caseless Database Indexing**: Emails are saved insidecaseless indices, preventing duplicates under varying capital letters (e.g. `User@domain.com` vs `user@domain.com`).
4. **Middleware Protection isolation**: Decrypts and queries records dynamically at each middleware check to ensure disabled or deleted user accounts lose session permissions immediately.

---

## Testing Results

Verification was performed using automated unit and integration tests:

- **Arithmetic & Connection Pool Verification**: Passed in 59ms.
- **Strong Password User Registration**: Registered user (`auth-test-***@devmate.ai`), returning 201 status and signed JWT.
- **Duplicate User Email Block**: Attempting duplicate registration rejected with 400 Bad Request.
- **Password Strength Checks**: Checked weak, lowercase-only, and symbol-less inputs. All rejected with 400.
- **Successful Login**: Checked valid credentials. Decrypted hash and returned JWT session (status 200).
- **Incorrect Credentials rejection**: Checked invalid logins. Blocked access with 401 Unauthorized.
- **Protect Middleware (Valid Token)**: Sent valid header. Decrypted successfully and injected user context.
- **Protect Middleware (Bad Token)**: Sent invalid header. Blocked request with 401 Unauthorized.
