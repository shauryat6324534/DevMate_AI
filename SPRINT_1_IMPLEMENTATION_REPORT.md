# Sprint 1 — Project Setup & Architecture Foundation Report

This report outlines the objectives, file structures, layer divisions, request flows, and verification status established during Sprint 1.

---

## Sprint Objective

Configure the primary workspace foundations and enforce production-grade architecture layers for both the React-Vite frontend and the Node-Express backend of the **DevMate AI** platform, verifying communication via health endpoint integrations.

---

## Folder Structure

The project has been separated into two clean, self-contained subdirectories to isolate dependencies and building assets:

```
DevMate_AI/
├── backend/
│   ├── src/
│   │   ├── config/          # Environment variables & constants configuration
│   │   ├── controllers/     # Route request parsing and validation handlers
│   │   ├── middleware/      # Security, logging, and error-handling layers
│   │   ├── routes/          # API endpoint specifications and router links
│   │   ├── services/        # Business logic, AI algorithms, database triggers
│   │   └── utils/           # Shared logging and response utilities
│   ├── .env                 # Application environment configurations
│   ├── .env.example         # Configuration blueprint template
│   ├── package.json         # Backend dependency manager config
│   └── src/server.js        # Express listener entry point
└── frontend/
    ├── src/
    │   ├── assets/          # Static media resources
    │   ├── index.css        # Tailwind directive & animations styling
    │   ├── App.jsx          # Live control panel page
    │   └── main.jsx         # React application bootstrap entry
    ├── index.html           # Root DOM layout skeleton
    ├── package.json         # Frontend building dependency setup
    └── vite.config.js       # Vite plugin loader configuration
```

---

## Files Created

The following layers were established:

### 1. Configuration & Server Setup
- [backend/package.json](file:///c:/Users/Shaurya%20Binjola/Desktop/DevMate_AI/backend/package.json) — Core dependencies (`express`, `cors`, `helmet`, `morgan`, `dotenv`) and dev-dependencies (`nodemon`).
- [backend/.env.example](file:///c:/Users/Shaurya%20Binjola/Desktop/DevMate_AI/backend/.env.example) & [backend/.env](file:///c:/Users/Shaurya%20Binjola/Desktop/DevMate_AI/backend/.env) — Configuration properties for ports, environment environments, and credentials.
- [backend/src/config/config.js](file:///c:/Users/Shaurya%20Binjola/Desktop/DevMate_AI/backend/src/config/config.js) — Safe loading and validation of environment constants.
- [backend/src/server.js](file:///c:/Users/Shaurya%20Binjola/Desktop/DevMate_AI/backend/src/server.js) — Port binding and uncaught-exception safety catch interceptors.
- [backend/src/app.js](file:///c:/Users/Shaurya%20Binjola/Desktop/DevMate_AI/backend/src/app.js) — Express configurations, CORS headers, Helmet policies, and base path associations.

### 2. Middlware Layer
- [backend/src/middleware/errorMiddleware.js](file:///c:/Users/Shaurya%20Binjola/Desktop/DevMate_AI/backend/src/middleware/errorMiddleware.js) — Global catch-all handler printing debug details.
- [backend/src/middleware/authMiddleware.js](file:///c:/Users/Shaurya%20Binjola/Desktop/DevMate_AI/backend/src/middleware/authMiddleware.js) — JWT sessions token validation and identity injector framework placeholder.
- [backend/src/middleware/validationMiddleware.js](file:///c:/Users/Shaurya%20Binjola/Desktop/DevMate_AI/backend/src/middleware/validationMiddleware.js) — Parameter check middleware skeleton.

### 3. Utility Helpers
- [backend/src/utils/responseHelper.js](file:///c:/Users/Shaurya%20Binjola/Desktop/DevMate_AI/backend/src/utils/responseHelper.js) — Utility formatting JSON outputs.
- [backend/src/utils/logger.js](file:///c:/Users/Shaurya%20Binjola/Desktop/DevMate_AI/backend/src/utils/logger.js) — Console log framework for debugging and tracking.

### 4. Routes Layer
- [backend/src/routes/healthRoutes.js](file:///c:/Users/Shaurya%20Binjola/Desktop/DevMate_AI/backend/src/routes/healthRoutes.js) — Status vital output.
- [backend/src/routes/index.js](file:///c:/Users/Shaurya%20Binjola/Desktop/DevMate_AI/backend/src/routes/index.js) — Master endpoint grouping.
- Placeholders:
  - [authRoutes.js](file:///c:/Users/Shaurya%20Binjola/Desktop/DevMate_AI/backend/src/routes/authRoutes.js), [chatRoutes.js](file:///c:/Users/Shaurya%20Binjola/Desktop/DevMate_AI/backend/src/routes/chatRoutes.js), [codeRoutes.js](file:///c:/Users/Shaurya%20Binjola/Desktop/DevMate_AI/backend/src/routes/codeRoutes.js), [explainRoutes.js](file:///c:/Users/Shaurya%20Binjola/Desktop/DevMate_AI/backend/src/routes/explainRoutes.js), [debugRoutes.js](file:///c:/Users/Shaurya%20Binjola/Desktop/DevMate_AI/backend/src/routes/debugRoutes.js), [optimizeRoutes.js](file:///c:/Users/Shaurya%20Binjola/Desktop/DevMate_AI/backend/src/routes/optimizeRoutes.js), [docRoutes.js](file:///c:/Users/Shaurya%20Binjola/Desktop/DevMate_AI/backend/src/routes/docRoutes.js), [reviewRoutes.js](file:///c:/Users/Shaurya%20Binjola/Desktop/DevMate_AI/backend/src/routes/reviewRoutes.js), [learningRoutes.js](file:///c:/Users/Shaurya%20Binjola/Desktop/DevMate_AI/backend/src/routes/learningRoutes.js), [downloadRoutes.js](file:///c:/Users/Shaurya%20Binjola/Desktop/DevMate_AI/backend/src/routes/downloadRoutes.js), [historyRoutes.js](file:///c:/Users/Shaurya%20Binjola/Desktop/DevMate_AI/backend/src/routes/historyRoutes.js)

### 5. Controller Layer (Validation and Formatting only)
- Placeholders:
  - [authController.js](file:///c:/Users/Shaurya%20Binjola/Desktop/DevMate_AI/backend/src/controllers/authController.js), [chatController.js](file:///c:/Users/Shaurya%20Binjola/Desktop/DevMate_AI/backend/src/controllers/chatController.js), [codeController.js](file:///c:/Users/Shaurya%20Binjola/Desktop/DevMate_AI/backend/src/controllers/codeController.js), [explainController.js](file:///c:/Users/Shaurya%20Binjola/Desktop/DevMate_AI/backend/src/controllers/explainController.js), [debugController.js](file:///c:/Users/Shaurya%20Binjola/Desktop/DevMate_AI/backend/src/controllers/debugController.js), [optimizeController.js](file:///c:/Users/Shaurya%20Binjola/Desktop/DevMate_AI/backend/src/controllers/optimizeController.js), [docController.js](file:///c:/Users/Shaurya%20Binjola/Desktop/DevMate_AI/backend/src/controllers/docController.js), [reviewController.js](file:///c:/Users/Shaurya%20Binjola/Desktop/DevMate_AI/backend/src/controllers/reviewController.js), [learningController.js](file:///c:/Users/Shaurya%20Binjola/Desktop/DevMate_AI/backend/src/controllers/learningController.js), [downloadController.js](file:///c:/Users/Shaurya%20Binjola/Desktop/DevMate_AI/backend/src/controllers/downloadController.js), [historyController.js](file:///c:/Users/Shaurya%20Binjola/Desktop/DevMate_AI/backend/src/controllers/historyController.js)

### 6. Service Layer (Business Logic and Integrations only)
- [backend/src/services/aiService.js](file:///c:/Users/Shaurya%20Binjola/Desktop/DevMate_AI/backend/src/services/aiService.js) — The single target entry point for prompt dispatching.
- [backend/src/services/promptBuilder.js](file:///c:/Users/Shaurya%20Binjola/Desktop/DevMate_AI/backend/src/services/promptBuilder.js) — Formats system and feature models prompts.
- Placeholders:
  - [authService.js](file:///c:/Users/Shaurya%20Binjola/Desktop/DevMate_AI/backend/src/services/authService.js), [chatService.js](file:///c:/Users/Shaurya%20Binjola/Desktop/DevMate_AI/backend/src/services/chatService.js), [codeService.js](file:///c:/Users/Shaurya%20Binjola/Desktop/DevMate_AI/backend/src/services/codeService.js), [explainService.js](file:///c:/Users/Shaurya%20Binjola/Desktop/DevMate_AI/backend/src/services/explainService.js), [debugService.js](file:///c:/Users/Shaurya%20Binjola/Desktop/DevMate_AI/backend/src/services/debugService.js), [optimizeService.js](file:///c:/Users/Shaurya%20Binjola/Desktop/DevMate_AI/backend/src/services/optimizeService.js), [docService.js](file:///c:/Users/Shaurya%20Binjola/Desktop/DevMate_AI/backend/src/services/docService.js), [reviewService.js](file:///c:/Users/Shaurya%20Binjola/Desktop/DevMate_AI/backend/src/services/reviewService.js), [learningService.js](file:///c:/Users/Shaurya%20Binjola/Desktop/DevMate_AI/backend/src/services/learningService.js), [downloadService.js](file:///c:/Users/Shaurya%20Binjola/Desktop/DevMate_AI/backend/src/services/downloadService.js), [historyService.js](file:///c:/Users/Shaurya%20Binjola/Desktop/DevMate_AI/backend/src/services/historyService.js)

### 7. Frontend Integration Files
- [frontend/vite.config.js](file:///c:/Users/Shaurya%20Binjola/Desktop/DevMate_AI/frontend/vite.config.js) — Integrates standard `@tailwindcss/vite` plugin.
- [frontend/tailwind.config.js](file:///c:/Users/Shaurya%20Binjola/Desktop/DevMate_AI/frontend/tailwind.config.js) — Custom dark-theme variables.
- [frontend/src/index.css](file:///c:/Users/Shaurya%20Binjola/Desktop/DevMate_AI/frontend/src/index.css) — Custom styles and theme definitions.
- [frontend/src/App.jsx](file:///c:/Users/Shaurya%20Binjola/Desktop/DevMate_AI/frontend/src/App.jsx) — Modern control panel page.
- [frontend/index.html](file:///c:/Users/Shaurya%20Binjola/Desktop/DevMate_AI/frontend/index.html) — Font links and title configurations.

---

## Architecture & Request Flow Explanation

The architecture strictly adheres to a **Service-Based Request Flow** ensuring complete separation of concerns:

```
[User Request]
      │
      ▼
┌──────────────┐
│ Route Layer  │  --> Receives connection, checks HTTP verbs (GET/POST/etc.)
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Middleware   │  --> Validates headers, parses tokens, checks constraints
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Controllers  │  --> Validates body parameters, sanitizes inputs
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Services     │  --> Contains core business algorithms
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  AI / DB     │  --> Coordinates SQL statements or OpenRouter prompts
└──────────────┘
```

### Key Architectural Guidelines:
1. **Controllers** only compile payloads, handle request details, check basic parameter existence, and format response outputs. They are **never** permitted to run business rules or query database tables.
2. **Services** encapsulate core algorithms. They process prompts, run code operations, and coordinate details.
3. **AI Provider Isolation** is guaranteed: all prompts are formatted by `promptBuilder.js` and dispatched strictly via `aiService.js`. Direct API queries to external providers are prohibited.

---

## Testing & Verification Results

Verification was performed using an autonomous browser subagent, checking local server runtimes:

### 1. Backend Server Check
- **Command Run**: `npm run dev` in `backend/`
- **Port Bounded**: `http://localhost:5000`
- **Health check route output (`/api/health`)**:
  ```json
  {
    "success": true,
    "message": "DevMate AI backend services are active",
    "data": {
      "status": "UP",
      "timestamp": "2026-06-23T12:29:40.125Z",
      "env": "development",
      "reactVersion": "19"
    }
  }
  ```

### 2. Frontend Development Server Check
- **Command Run**: `npm run dev` in `frontend/`
- **Vite Port**: `http://localhost:5173`
- **Output Status**: Compiled correctly in 730 ms without PostCSS warnings.

### 3. Integration & CORS Verification
- Navigated to `http://localhost:5173/` in the browser agent.
- Verified dashboard page loads without style conflicts.
- React polling logic queried `http://localhost:5000/api/health` successfully and parsed the response, updating the dashboard badge to **API: ONLINE**. This confirms that CORS settings are correctly aligned.
