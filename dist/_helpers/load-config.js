"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables from .env file
dotenv_1.default.config();
exports.config = {
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
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:4200',
};
