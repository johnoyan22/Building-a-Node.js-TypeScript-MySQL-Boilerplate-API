import { Request, Response, NextFunction, Router, CookieOptions, type RequestHandler } from 'express';
import Joi from 'joi';
import { accountService } from './account.service';
import { validateRequest } from '../_middleware/validate-request';
import { authorize } from '../_middleware/authorize';
import { Role, type Role as RoleType } from '../_helpers/role';

const router = Router();

const auth0 = () => authorize() as [RequestHandler, RequestHandler];
const authAdmin = () => authorize(Role.Admin) as [RequestHandler, RequestHandler];

const isProd = process.env.NODE_ENV === 'production';
const refreshCookie: CookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: isProd,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
};

const clientIp = (req: Request) => {
  const h = req.headers['x-forwarded-for'];
  if (typeof h === 'string' && h.length) {
    return h.split(',')[0].trim();
  }
  if (Array.isArray(h) && h[0]) {
    return h[0].split(',')[0].trim();
  }
  return req.ip || '0.0.0.0';
};

function registerSchema(req: Request, res: Response, next: NextFunction) {
  validateRequest(
    req,
    next,
    Joi.object({
      title: Joi.string().min(1).max(10).default('Mr'),
      firstName: Joi.string().min(1).max(50).required(),
      lastName: Joi.string().min(1).max(50).required(),
      email: Joi.string().email().required(),
      password: Joi.string().min(6).max(200).required(),
    })
  );
}

router.post('/register', registerSchema, (req, res, next) => {
  const { body } = req;
  accountService
    .register(body)
    .then((r) => res.json(r))
    .catch(next);
});

function verifySchema(req: Request, res: Response, next: NextFunction) {
  validateRequest(req, next, Joi.object({ token: Joi.string().required() }));
}
router.get('/verify-email', (req, res, next) => {
  const token = String(req.query.token ?? '');
  if (!token) {
    return (next as (e: string) => void)('Validation: "token" is required');
  }
  return accountService
    .verifyEmail(token)
    .then((r) => res.json(r))
    .catch(next);
});
router.post('/verify-email', verifySchema, (req, res, next) => {
  accountService
    .verifyEmail(req.body.token)
    .then((r) => res.json(r))
    .catch(next);
});

function authenticateSchema(req: Request, res: Response, next: NextFunction) {
  validateRequest(
    req,
    next,
    Joi.object({ email: Joi.string().email().required(), password: Joi.string().required() })
  );
}
router.post('/authenticate', authenticateSchema, (req, res, next) => {
  accountService
    .authenticate({ email: req.body.email, password: req.body.password, ipAddress: clientIp(req) })
    .then((d) => {
      const { refreshToken, ...rest } = d;
      if (typeof refreshToken === 'string' && (rest as { jwToken: string }).jwToken) {
        res.cookie('refreshToken', refreshToken, refreshCookie);
      }
      return res.json(rest);
    })
    .catch(next);
});
// Backward-compatible alias for common typo in clients.
router.post('/aunthenticate', authenticateSchema, (req, res, next) => {
  accountService
    .authenticate({ email: req.body.email, password: req.body.password, ipAddress: clientIp(req) })
    .then((d) => {
      const { refreshToken, ...rest } = d;
      if (typeof refreshToken === 'string' && (rest as { jwToken: string }).jwToken) {
        res.cookie('refreshToken', refreshToken, refreshCookie);
      }
      return res.json(rest);
    })
    .catch(next);
});

function forgotSchema(req: Request, res: Response, next: NextFunction) {
  validateRequest(req, next, Joi.object({ email: Joi.string().email().required() }));
}
router.post('/forgot-password', forgotSchema, (req, res, next) => {
  accountService
    .forgotPassword(req.body.email)
    .then((r) => res.json(r))
    .catch(next);
});

function resetSchema(req: Request, res: Response, next: NextFunction) {
  validateRequest(
    req,
    next,
    Joi.object({
      token: Joi.string().required(),
      password: Joi.string().min(6).required(),
      confirmPassword: Joi.string().min(6).required(),
    })
  );
}
router.post('/reset-password', resetSchema, (req, res, next) => {
  accountService
    .resetPassword(req.body)
    .then((r) => res.json(r))
    .catch(next);
});

router.post(
  '/validate-reset-token',
  (req, res, next) => {
    validateRequest(req, next, Joi.object({ token: Joi.string().required() }));
  },
  (req, res, next) => {
    accountService
      .validateResetToken(req.body.token)
      .then((r) => res.json(r))
      .catch(next);
  }
);
router.get('/validate-reset-token', (req, res, next) => {
  const token = String(req.query.token ?? '');
  if (!token) {
    return (next as (e: string) => void)('Validation: "token" is required');
  }
  return accountService
    .validateResetToken(token)
    .then((r) => res.json(r))
    .catch(next);
});

const refreshTokenHandler: RequestHandler = (req, res, next) => {
  const body = (req.body ?? {}) as { refreshToken?: string };
  const t = (req as Request & { cookies?: { refreshToken?: string } }).cookies?.refreshToken || body.refreshToken;
  if (!t) {
    return (next as (e: string) => void)('Invalid or missing refresh token');
  }
  return accountService
    .refreshToken({ token: t, ipAddress: clientIp(req) })
    .then((d) => {
      if (d.refreshToken) {
        res.cookie('refreshToken', d.refreshToken, refreshCookie);
      }
      return res.json({ user: d.user, token: d.token });
    })
    .catch(next);
};
router.post('/refresh-token', refreshTokenHandler);
router.get('/refresh-token', refreshTokenHandler);

router.post(
  '/revoke-token',
  ...auth0(),
  (req, res, next) => {
    const fromBody = ((req.body ?? {}) as { refreshToken?: string }).refreshToken;
    const c = (req as Request & { cookies?: { refreshToken?: string } }).cookies;
    const token = (fromBody !== undefined && fromBody !== null && fromBody !== '' ? fromBody : c?.refreshToken) as string | undefined;
    if (token == null || token === '') {
      return (next as (e: string) => void)('Refresh token required (body or cookie)');
    }
    return accountService
      .revokeToken({
        token: token,
        ipAddress: clientIp(req),
        callerId: req.user!.id,
        isAdmin: req.user!.role === Role.Admin,
      })
      .then((r) => {
        if (c?.refreshToken && c.refreshToken === token) {
          res.clearCookie('refreshToken', { path: '/' });
        }
        return res.json(r);
      })
      .catch(next);
  }
);

router.get(
  '/',
  ...auth0(),
  (req, res, next) => {
    accountService
      .getAll()
      .then((r) => res.json(r))
      .catch(next);
  }
);

const ensureSelfOrAdmin = (req: Request) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    throw 'Invalid id';
  }
  if (req.user!.role !== Role.Admin && req.user!.id !== id) {
    throw 'Unauthorized';
  }
  return id;
};

router.get(
  '/:id',
  (req, res, next) => {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) {
        return (next as (e: string) => void)('Invalid id');
      }
      return accountService
        .getById(id)
        .then((r) => res.json(r))
        .catch(next);
    } catch (e) {
      return (next as (e: string) => void)(e as string);
    }
  }
);

const createBody = Joi.object({
  title: Joi.string().min(1).default('Mr'),
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('Admin', 'User').default('User'),
});
function createSchema(req: Request, res: Response, next: NextFunction) {
  validateRequest(req, next, createBody);
}
router.post(
  '/',
  ...authAdmin(),
  createSchema,
  (req, res, next) => {
    accountService
      .create(req.body)
      .then((r) => res.json(r))
      .catch(next);
  }
);

const updateJoi = Joi.object({
  title: Joi.string(),
  firstName: Joi.string(),
  lastName: Joi.string(),
  email: Joi.string().email(),
  password: Joi.string().min(6).allow(''),
  role: Joi.string().valid('Admin', 'User'),
}).min(1);
function updateSchema(req: Request, res: Response, next: NextFunction) {
  validateRequest(req, next, updateJoi);
}
router.put(
  '/:id',
  ...auth0(),
  updateSchema,
  (req, res, next) => {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return (next as (e: string) => void)('Invalid id');
    }
    if (req.user!.role !== Role.Admin && req.user!.id !== id) {
      return (next as (e: string) => void)('Unauthorized');
    }
    const b = { ...req.body } as { role?: RoleType; [k: string]: unknown };
    if (req.user!.role !== Role.Admin) {
      delete b.role;
    }
    return accountService
      .update(
        id,
        b,
        { caller: { id: req.user!.id, role: req.user!.role }, canChangeRole: req.user!.role === Role.Admin }
      )
      .then((r) => res.json(r))
      .catch(next);
  }
);

router.delete(
  '/:id',
  ...auth0(),
  (req, res, next) => {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return (next as (e: string) => void)('Invalid id');
    }
    if (req.user!.role !== Role.Admin && req.user!.id !== id) {
      return (next as (e: string) => void)('Unauthorized');
    }
    return accountService
      ._delete(id)
      .then((r) => res.json(r))
      .catch(next);
  }
);

export default router;
