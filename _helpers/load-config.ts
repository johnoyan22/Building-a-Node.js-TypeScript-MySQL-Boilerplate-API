import dotenv from 'dotenv';
import type { AppConfig } from '../_types/config';

// Load environment variables from .env file
dotenv.config();

export const config: AppConfig = {
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'api_boilerplate',
  },
  secret: process.env.JWT_SECRET || 'secret',
  emailFrom: process.env.EMAIL_FROM || 'onboarding@resend.dev',
  emailTo: process.env.EMAIL_TO || '',
  resendApiKey: process.env.RESEND_API_KEY || process.env.SMTP_PASS || '',
  apiUrl: process.env.API_URL || 'http://localhost:4000',
};
