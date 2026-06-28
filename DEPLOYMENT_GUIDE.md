# DevMate AI — Production Deployment Guide

This guide details the steps required to deploy the **DevMate AI** programming assistant platform in a production environment.

---

## 1. Prerequisites
- **Node.js**: `v18.0.0` or higher
- **Package Manager**: npm (ships with Node.js)
- **Database**: MySQL `5.7` or higher (configured on a reliable endpoint, e.g., Amazon RDS or local instance)
- **OpenRouter Account**: Valid API key for accessing LLMs (`qwen/qwen3-coder:free` and fallbacks)

---

## 2. Environment Configurations
Prepare two `.env` files matching variables configured in `ENVIRONMENT_SETUP.md`.

- **Backend environment** (`backend/.env`):
  ```env
  PORT=5000
  NODE_ENV=production
  CORS_ORIGIN=https://devmate-client.com
  JWT_SECRET=super_secret_production_key_change_me
  JWT_EXPIRES_IN=24h
  DB_HOST=rds-endpoint-url
  DB_USER=production_admin
  DB_PASSWORD=secure_password
  DB_NAME=devmate_ai
  DB_CONNECTION_LIMIT=30
  OPENROUTER_API_KEY=sk-or-v1-key-values
  ```

- **Frontend environment** (`frontend/.env`):
  No env variables are mandatory since defaults target port `5000` on localhost, or you can configure options inside bundlers.

---

## 3. Database Initialization
Before starting the backend, initialize the relational tables and keys schema structure:
1. Verify the database `devmate_ai` is created in MySQL.
2. Inside `backend/` directory, run:
   ```bash
   npm run db:init
   ```
3. Run the database test verifying connection capabilities:
   ```bash
   npm run db:test
   ```

---

## 4. Backend Setup & Run
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install production dependencies:
   ```bash
   npm ci --only=production
   ```
3. Start the production processes (we recommend using PM2 process manager for clustering and restart safety):
   ```bash
   npm install -g pm2
   pm2 start src/server.js --name devmate-backend -i max
   ```

---

## 5. Frontend Build & Deploy
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm ci
   ```
3. Compile the production assets bundle:
   ```bash
   npm run build
   ```
4. Deploy the contents of the generated `dist/` directory to static hosting (e.g. AWS S3 + CloudFront, Vercel, Netlify, or Nginx).

---

## 6. Health Verification
Verify that the deployed API is fully reachable:
1. Fetch the health endpoint:
   ```bash
   curl -I https://api.devmate-ai.com/api/health
   ```
2. Check that the HTTP response returns `200 OK` and the database connection is healthy.

---

## 7. Rollback Notes
If an anomaly is detected post-deployment:
1. **Frontend rollback**: Re-route static hosting DNS back to the previous stable release container hash or static build bucket.
2. **Backend rollback**: Reload the previous PM2 process cluster state:
   ```bash
   pm2 rollback [id]
   ```
3. **Database migration rollback**: If tables changed, restore the pre-deployment database backup.
