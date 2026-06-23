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
    openRouterApiKey: process.env.OPENROUTER_API_KEY || ''
  }
};

export default config;
