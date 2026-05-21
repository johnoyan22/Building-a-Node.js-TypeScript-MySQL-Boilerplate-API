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
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.resend.com',
    port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 465,
    user: process.env.SMTP_USER || 'resend',
    pass: process.env.SMTP_PASS || '',
  },
};
