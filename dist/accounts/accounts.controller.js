"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const joi_1 = __importDefault(require("joi"));
const account_service_1 = require("./account.service");
const validate_request_1 = require("../_middleware/validate-request");
const authorize_1 = require("../_middleware/authorize");
const role_1 = require("../_helpers/role");
const router = (0, express_1.Router)();
const auth0 = () => (0, authorize_1.authorize)();
const authAdmin = () => (0, authorize_1.authorize)(role_1.Role.Admin);
const isProd = process.env.NODE_ENV === 'production';
const refreshCookie = {
    httpOnly: true,
    sameSite: isProd ? 'none' : 'lax',
    secure: isProd,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
};
const clientIp = (req) => {
    const h = req.headers['x-forwarded-for'];
    if (typeof h === 'string' && h.length) {
        return h.split(',')[0].trim();
    }
    if (Array.isArray(h) && h[0]) {
        return h[0].split(',')[0].trim();
    }
    return req.ip || '0.0.0.0';
};
function registerSchema(req, res, next) {
    (0, validate_request_1.validateRequest)(req, next, joi_1.default.object({
        title: joi_1.default.string().min(1).max(10).default('Mr'),
        firstName: joi_1.default.string().min(1).max(50).required(),
        lastName: joi_1.default.string().min(1).max(50).required(),
        email: joi_1.default.string().email().required(),
        password: joi_1.default.string().min(6).max(200).required(),
    }));
}
router.post('/register', registerSchema, (req, res, next) => {
    const { body } = req;
    account_service_1.accountService
        .register(body)
        .then((r) => res.json(r))
        .catch(next);
});
function verifySchema(req, res, next) {
    (0, validate_request_1.validateRequest)(req, next, joi_1.default.object({ token: joi_1.default.string().required() }));
}
router.get('/verify-email', (req, res, next) => {
    const token = String(req.query.token ?? '');
    if (!token) {
        return next('Validation: "token" is required');
    }
    return account_service_1.accountService
        .verifyEmail(token)
        .then((r) => res.json(r))
        .catch(next);
});
router.post('/verify-email', verifySchema, (req, res, next) => {
    account_service_1.accountService
        .verifyEmail(req.body.token)
        .then((r) => res.json(r))
        .catch(next);
});
function authenticateSchema(req, res, next) {
    (0, validate_request_1.validateRequest)(req, next, joi_1.default.object({ email: joi_1.default.string().email().required(), password: joi_1.default.string().required() }));
}
router.post('/authenticate', authenticateSchema, (req, res, next) => {
    account_service_1.accountService
        .authenticate({ email: req.body.email, password: req.body.password, ipAddress: clientIp(req) })
        .then((d) => {
        const { refreshToken, ...rest } = d;
        if (typeof refreshToken === 'string' && rest.jwToken) {
            res.cookie('refreshToken', refreshToken, refreshCookie);
        }
        return res.json({ ...rest, refreshToken });
    })
        .catch(next);
});
// Backward-compatible alias for common typo in clients.
router.post('/aunthenticate', authenticateSchema, (req, res, next) => {
    account_service_1.accountService
        .authenticate({ email: req.body.email, password: req.body.password, ipAddress: clientIp(req) })
        .then((d) => {
        const { refreshToken, ...rest } = d;
        if (typeof refreshToken === 'string' && rest.jwToken) {
            res.cookie('refreshToken', refreshToken, refreshCookie);
        }
        return res.json({ ...rest, refreshToken });
    })
        .catch(next);
});
function forgotSchema(req, res, next) {
    (0, validate_request_1.validateRequest)(req, next, joi_1.default.object({ email: joi_1.default.string().email().required() }));
}
router.post('/forgot-password', forgotSchema, (req, res, next) => {
    account_service_1.accountService
        .forgotPassword(req.body.email)
        .then((r) => res.json(r))
        .catch(next);
});
function resetSchema(req, res, next) {
    (0, validate_request_1.validateRequest)(req, next, joi_1.default.object({
        token: joi_1.default.string().required(),
        password: joi_1.default.string().min(6).required(),
        confirmPassword: joi_1.default.string().min(6).required(),
    }));
}
router.post('/reset-password', resetSchema, (req, res, next) => {
    account_service_1.accountService
        .resetPassword(req.body)
        .then((r) => res.json(r))
        .catch(next);
});
router.post('/validate-reset-token', (req, res, next) => {
    (0, validate_request_1.validateRequest)(req, next, joi_1.default.object({ token: joi_1.default.string().required() }));
}, (req, res, next) => {
    account_service_1.accountService
        .validateResetToken(req.body.token)
        .then((r) => res.json(r))
        .catch(next);
});
router.get('/validate-reset-token', (req, res, next) => {
    const token = String(req.query.token ?? '');
    if (!token) {
        return next('Validation: "token" is required');
    }
    return account_service_1.accountService
        .validateResetToken(token)
        .then((r) => res.json(r))
        .catch(next);
});
const refreshTokenHandler = (req, res, next) => {
    const body = (req.body ?? {});
    const t = req.cookies?.refreshToken || body.refreshToken;
    if (!t) {
        return next('Invalid or missing refresh token');
    }
    return account_service_1.accountService
        .refreshToken({ token: t, ipAddress: clientIp(req) })
        .then((d) => {
        if (d.refreshToken) {
            res.cookie('refreshToken', d.refreshToken, refreshCookie);
        }
        const user = d.user;
        const responsePayload = {
            id: user.id,
            title: user.title,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            created: user.createdAt ?? user.created ?? null,
            updated: user.updatedAt ?? user.updated ?? null,
            isVerified: user.verified != null || user.isVerified === true,
            jwToken: d.token,
            refreshToken: d.refreshToken,
            user: d.user,
            token: d.token,
        };
        return res.json(responsePayload);
    })
        .catch(next);
};
router.post('/refresh-token', refreshTokenHandler);
router.get('/refresh-token', refreshTokenHandler);
router.post('/revoke-token', ...auth0(), (req, res, next) => {
    const fromBody = (req.body ?? {}).refreshToken;
    const c = req.cookies;
    const token = (fromBody !== undefined && fromBody !== null && fromBody !== '' ? fromBody : c?.refreshToken);
    if (token == null || token === '') {
        return next('Refresh token required (body or cookie)');
    }
    return account_service_1.accountService
        .revokeToken({
        token: token,
        ipAddress: clientIp(req),
        callerId: req.user.id,
        isAdmin: req.user.role === role_1.Role.Admin,
    })
        .then((r) => {
        if (c?.refreshToken && c.refreshToken === token) {
            res.clearCookie('refreshToken', { path: '/' });
        }
        return res.json(r);
    })
        .catch(next);
});
router.get('/', ...authAdmin(), (req, res, next) => {
    account_service_1.accountService
        .getAll()
        .then((r) => res.json(r))
        .catch(next);
});
const ensureSelfOrAdmin = (req) => {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
        throw 'Invalid id';
    }
    if (req.user.role !== role_1.Role.Admin && req.user.id !== id) {
        throw 'Unauthorized';
    }
    return id;
};
router.get('/:id', ...auth0(), (req, res, next) => {
    try {
        const id = ensureSelfOrAdmin(req);
        return account_service_1.accountService
            .getById(id)
            .then((r) => res.json(r))
            .catch(next);
    }
    catch (e) {
        return next(e);
    }
});
const createBody = joi_1.default.object({
    title: joi_1.default.string().min(1).default('Mr'),
    firstName: joi_1.default.string().required(),
    lastName: joi_1.default.string().required(),
    email: joi_1.default.string().email().required(),
    password: joi_1.default.string().min(6).required(),
    role: joi_1.default.string().valid('Admin', 'User').default('User'),
});
function createSchema(req, res, next) {
    (0, validate_request_1.validateRequest)(req, next, createBody);
}
router.post('/', ...authAdmin(), createSchema, (req, res, next) => {
    account_service_1.accountService
        .create(req.body)
        .then((r) => res.json(r))
        .catch(next);
});
const updateJoi = joi_1.default.object({
    title: joi_1.default.string(),
    firstName: joi_1.default.string(),
    lastName: joi_1.default.string(),
    email: joi_1.default.string().email(),
    password: joi_1.default.string().min(6).allow(''),
    role: joi_1.default.string().valid('Admin', 'User'),
}).min(1);
function updateSchema(req, res, next) {
    (0, validate_request_1.validateRequest)(req, next, updateJoi);
}
router.put('/:id', ...auth0(), updateSchema, (req, res, next) => {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
        return next('Invalid id');
    }
    if (req.user.role !== role_1.Role.Admin && req.user.id !== id) {
        return next('Unauthorized');
    }
    const b = { ...req.body };
    if (req.user.role !== role_1.Role.Admin) {
        delete b.role;
    }
    return account_service_1.accountService
        .update(id, b, { caller: { id: req.user.id, role: req.user.role }, canChangeRole: req.user.role === role_1.Role.Admin })
        .then((r) => res.json(r))
        .catch(next);
});
router.delete('/:id', ...auth0(), (req, res, next) => {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
        return next('Invalid id');
    }
    if (req.user.role !== role_1.Role.Admin && req.user.id !== id) {
        return next('Unauthorized');
    }
    return account_service_1.accountService
        ._delete(id)
        .then((r) => res.json(r))
        .catch(next);
});
exports.default = router;
