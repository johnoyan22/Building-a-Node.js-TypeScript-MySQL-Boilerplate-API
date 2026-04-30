import express, { type ErrorRequestHandler } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { errorHandler } from './_middleware/error-handler';
import { initialize } from './_helpers/db';
import accounts from './accounts/accounts.controller';
import { setupSwagger, swaggerPath } from './_helpers/swagger';

const app = express();

app.use(morgan('dev'));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.get('/health', (_req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

app.use('/accounts', accounts);
setupSwagger(app, swaggerPath());

app.use(errorHandler as ErrorRequestHandler);

const port = 4000;

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
