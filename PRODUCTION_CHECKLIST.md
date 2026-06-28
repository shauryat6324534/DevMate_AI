# DevMate AI — Production Readiness Checklist

This checklist tracks tasks required to ensure the **DevMate AI** application is fully hardened, secured, and ready for deployment.

---

## 1. Dependencies and Environment Configuration
- [ ] **Dependencies Audited**: Run `npm audit` on frontend and backend workspaces verifying no high or critical severity alerts remain unresolved.
- [ ] **Lockfile Sync**: Confirm that `package-lock.json` matches dependencies listed in `package.json`.
- [ ] **Production mode active**: Confirm that `NODE_ENV=production` is declared on the runtime container or server.
- [ ] **Critical Envs Check**: Ensure `JWT_SECRET` and `OPENROUTER_API_KEY` are configured with strong production-grade keys.
- [ ] **Fail-Fast Verified**: Confirm that the backend fails to start immediately if any critical variables are omitted in production.

---

## 2. Security and Headers Configuration
- [ ] **Helmet Headers Active**: Verify Helmet middleware is active on the application, returning necessary XSS, framing, and CORS security headers.
- [ ] **CORS Origins Configured**: Ensure the CORS allowed origin matches the actual production domain of the frontend app.
- [ ] **Rate Limiting Active**: Check that authentication, AI assistant, and profile update endpoints are protected by `express-rate-limit`.
- [ ] **Sensitive Logs Protected**: Verify query string logger and request middlewares do not print plain-text user passwords or authorization tokens.

---

## 3. Database Configurations
- [ ] **Connection Pooling Limits**: Confirm that `DB_CONNECTION_LIMIT` is set appropriately for the database server's capacity (e.g. 30).
- [ ] **Schema and Keys Verified**: Run initialization checks verifying relational table constraints, auto-increments, and foreign key boundaries exist.
- [ ] **Backup plan established**: Check backup cron schedule and test DB restore commands.

---

## 4. API and Frontend Integration Checks
- [ ] **Static Assets Compiled**: Verify frontend compile processes build successfully using `npm run build`.
- [ ] **Health Endpoint Online**: Confirm that `/api/health` returns success.
- [ ] **Graceful Failures Checked**: Simulate OpenRouter or MySQL disconnects, confirming fallbacks and friendly error payloads return cleanly.
