import express, { type ErrorRequestHandler, type Request } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { errorHandler } from './_middleware/error-handler';
import { initialize } from './_helpers/db';
import accounts from './accounts/accounts.controller';
import { setupSwagger, swaggerPath } from './_helpers/swagger';

const app = express();

app.use(morgan('dev'));
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
  : [];

const isProd = process.env.NODE_ENV === 'production';

app.use(
  cors({
    origin: (origin, callback) => {

      if (!origin) return callback(null, true);

      if (!isProd || allowedOrigins.length === 0) {
        return callback(null, true);
      }
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use((req, _res, next) => {
  if (req.body == null || typeof req.body !== 'object') {
    (req as Request & { body: Record<string, unknown> }).body = {};
  }
  next();
});
app.get('/health', (_req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

app.use('/accounts', accounts);
setupSwagger(app, swaggerPath());
app.use(errorHandler as ErrorRequestHandler);

const rawPort = process.env.PORT;
const port =
  rawPort != null && rawPort !== '' && !Number.isNaN(Number(rawPort)) ? Number(rawPort) : 4000;

void initialize()
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
