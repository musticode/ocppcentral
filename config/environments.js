import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const loadEnvironment = () => {
  const env = process.env.NODE_ENV || 'development';
  
  const envFile = `.env.${env}`;
  const envPath = path.resolve(__dirname, '..', envFile);
  
  const result = dotenv.config({ path: envPath });
  
  if (result.error && env !== 'production') {
    console.warn(`Warning: Could not load ${envFile}, falling back to .env`);
    dotenv.config();
  }
  
  console.log(`Environment: ${env}`);
  console.log(`Loaded config from: ${envFile}`);
  
  return {
    env,
    port: process.env.PORT || 3000,
    host: process.env.HOST || 'localhost',
    mongoUri: process.env.MONGO_URI,
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    ocppPort: process.env.OCPP_PORT || 8080,
    ocppHost: process.env.OCPP_HOST || '0.0.0.0',
    ocppProtocol: process.env.OCPP_PROTOCOL || 'ws',
    frontendUrl: process.env.FRONTEND_URL,
    logLevel: process.env.LOG_LEVEL || 'info',
    enableSwagger: process.env.ENABLE_SWAGGER === 'true',
    enableCors: process.env.ENABLE_CORS === 'true',
    enableRateLimiting: process.env.ENABLE_RATE_LIMITING === 'true',
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  };
};

const config = loadEnvironment();

export default config;
