import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env variables from root of backend directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: parseInt(process.env.PORT, 10) || 5000,
  env: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET || 'devmate_ai_super_secret_jwt_key_sprint_1_foundation',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    name: process.env.DB_NAME || 'devmate_ai',
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT, 10) || 10
  },
  ai: {
    openRouterApiKey: process.env.OPENROUTER_API_KEY || '',
    openRouterBaseUrl: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
    primaryModel: process.env.PRIMARY_MODEL || 'qwen/qwen3-coder:free',
    fallbackModel: process.env.FALLBACK_MODEL || 'deepseek/deepseek-v4-flash:free',
    maxRetries: parseInt(process.env.AI_MAX_RETRIES, 10) || 3
  }
};

// Fail fast on missing critical configurations in production mode
if (config.env === 'production') {
  const criticalEnvVars = ['JWT_SECRET', 'OPENROUTER_API_KEY', 'DB_HOST', 'DB_USER', 'DB_NAME'];
  const missing = criticalEnvVars.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`CRITICAL CONFIGURATION ERROR: Missing required environment variables in production mode: ${missing.join(', ')}`);
  }
}

export default config;
