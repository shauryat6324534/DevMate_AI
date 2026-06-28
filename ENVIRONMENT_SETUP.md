# DevMate AI — Environment Setup Variables

This document lists every environment variable utilized by the **DevMate AI** backend platform, detailing their purposes, default parameters, and example values.

---

## Environment Variables Directory

| Variable Name | Purpose / Function | Required? | Default / Fallback | Example Value |
| :--- | :--- | :--- | :--- | :--- |
| `PORT` | Local network port for backend server | Optional | `5000` | `8080` |
| `NODE_ENV` | Running runtime profile context | Optional | `development` | `production` |
| `CORS_ORIGIN` | Allowed domains for client requests CORS verification | Optional | `http://localhost:5173` | `https://client.devmate.ai` |
| `JWT_SECRET` | Secret key used to sign and verify user session tokens | **Required** | None (Fails on prod) | `w9vB7zXp2Y1qRsT5u` |
| `JWT_EXPIRES_IN`| Lifetime window of signed user tokens | Optional | `24h` | `7d` |
| `DB_HOST` | Host address of target MySQL instance | **Required** | `127.0.0.1` | `rds.amazonaws.com` |
| `DB_USER` | Username for database access authentication | **Required** | `root` | `devmate_admin` |
| `DB_PASSWORD` | Password for database access authentication | Optional | `""` | `P@ssw0rd99!` |
| `DB_NAME` | Relational database schema name | **Required** | `devmate_ai` | `devmate_ai_prod` |
| `DB_CONNECTION_LIMIT` | Maximum size bounds of MySQL pooling cluster | Optional | `10` | `25` |
| `OPENROUTER_API_KEY` | OpenRouter authorization token for queries | **Required** | None (Fails on prod) | `sk-or-v1-abc123xyz` |
| `OPENROUTER_BASE_URL`| Endpoint endpoint destination for OpenRouter APIs | Optional | `https://openrouter.ai/api/v1`| `https://openrouter.ai/api/v1` |
| `PRIMARY_MODEL` | Main coder LLM code model signature query | Optional | `qwen/qwen3-coder:free` | `meta-llama/llama-3-8b` |
| `FALLBACK_MODEL` | Failover LLM model signature query | Optional | `deepseek/deepseek-v4-flash:free`| `mistralai/mistral-7b` |
| `AI_MAX_RETRIES` | Max attempts bounds for transient network recovery calls | Optional | `3` | `5` |

---

## Critical Hashing Security Notes

1. **Production Mode Enforcement**:
   - If `NODE_ENV=production` is active, the backend validates the presence of critical parameters on launch. If any of `JWT_SECRET`, `OPENROUTER_API_KEY`, `DB_HOST`, `DB_USER`, or `DB_NAME` are undefined or empty, the server will crash immediately with an error trace.
2. **Secrets Precaution**:
   - Never commit `.env` files to git repositories. Always populate production servers using secure environment variable configurations (e.g. AWS Secret Manager, Vault, or secure server environment inputs).
