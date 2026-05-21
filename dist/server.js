"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const error_handler_1 = require("./_middleware/error-handler");
const db_1 = require("./_helpers/db");
const accounts_controller_1 = __importDefault(require("./accounts/accounts.controller"));
const swagger_1 = require("./_helpers/swagger");
const app = (0, express_1.default)();
app.use((0, morgan_1.default)('dev'));
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
    : [];
const isProd = process.env.NODE_ENV === 'production';
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, postman)
        if (!origin)
            return callback(null, true);
        // In development or if ALLOWED_ORIGINS is not set, allow the requesting origin
        if (!isProd || allowedOrigins.length === 0) {
            return callback(null, true);
        }
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
app.use((req, _res, next) => {
    if (req.body == null || typeof req.body !== 'object') {
        req.body = {};
    }
    next();
});
app.get('/health', (_req, res) => {
    res.json({ ok: true, ts: new Date().toISOString() });
});
app.use('/accounts', accounts_controller_1.default);
(0, swagger_1.setupSwagger)(app, (0, swagger_1.swaggerPath)());
app.use(error_handler_1.errorHandler);
const rawPort = process.env.PORT;
const port = rawPort != null && rawPort !== '' && !Number.isNaN(Number(rawPort)) ? Number(rawPort) : 4000;
void (0, db_1.initialize)()
    .then(() => {
    app.listen(port, () => {
        // eslint-disable-next-line no-console
        console.log(`Server listening on http://localhost:${port} — Swagger: http://localhost:${port}/api-docs`);
    });
})
    .catch((e) => {
    // eslint-disable-next-line no-console
    console.error('Failed to start', e);
    process.exit(1);
});
