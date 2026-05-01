"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.accountService = void 0;
const sequelize_1 = require("sequelize");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = require("crypto");
const load_config_1 = require("../_helpers/load-config");
const role_1 = require("../_helpers/role");
const send_email_1 = require("../_helpers/send-email");
const db_1 = require("../_helpers/db");
const accLabel = (a) => `${a.firstName} ${a.lastName}`.trim();
const basic = (a) => a.toJSON();
const authView = (a, jwToken) => {
    const raw = a.toJSON();
    return {
        id: raw.id,
        title: raw.title,
        firstName: raw.firstName,
        lastName: raw.lastName,
        email: raw.email,
        role: raw.role,
        created: raw.createdAt ?? null,
        updated: raw.updatedAt ?? null,
        isVerified: raw.verified != null,
        jwToken,
    };
};
const hashPassword = (plain) => bcryptjs_1.default.hashSync(plain, 10);
const randomString = (bytes = 20) => (0, crypto_1.randomBytes)(Math.ceil(bytes / 2)).toString('hex').slice(0, bytes);
const generateJwt = (a) => jsonwebtoken_1.default.sign({ sub: String(a.id), id: a.id, role: a.role }, load_config_1.config.secret, { expiresIn: '15m' });
async function sendVerification(a, vToken) {
    const link = `http://localhost:4000/accounts/verify-email?token=${encodeURIComponent(vToken)}`;
    const html = `
    <h3>Verify Email</h3>
    <p>Thanks for registering!</p>
    <p>Please use the below token to verify your email address with the <code>/accounts/verify-email</code> api route:</p>
    <p><code>${vToken}</code></p>
    <p>Or click this link to verify directly:</p>
    <p><a href="${link}">${link}</a></p>
  `;
    await (0, send_email_1.sendEmail)({ to: a.email, subject: 'Sign-up Verification API - Verify Email', html });
}
async function sendPasswordReset(a) {
    const t = a.resetToken;
    const link = `http://localhost:4000/accounts/validate-reset-token?token=${encodeURIComponent(t)}`;
    const html = `
    <h3>Reset Password</h3>
    <p>Hi ${accLabel(a)}</p>
    <p>Please use the token below with the <code>/accounts/reset-password</code> api route:</p>
    <p><code>${t}</code></p>
    <p>Or click this link to validate the reset token first:</p>
    <p><a href="${link}">${link}</a></p>
  `;
    await (0, send_email_1.sendEmail)({ to: a.email, subject: 'Sign-up Verification API - Reset Password', html });
}
async function buildRefresh(account, ipAddress) {
    const token = randomString(64);
    const expires = new Date();
    expires.setDate(expires.getDate() + 7);
    await db_1.RefreshToken.create({
        accountId: account.id,
        token,
        expires,
        createdByIp: ipAddress,
    });
    return { token, expires, account };
}
exports.accountService = {
    async authenticate({ email, password, ipAddress }) {
        const a = await db_1.Account.scope('withHash').findOne({ where: { email: email.toLowerCase() } });
        if (!a || !bcryptjs_1.default.compareSync(password, a.passwordHash))
            throw 'Email or password is incorrect';
        if (!a.verified)
            throw 'Not verified. Please check your email';
        const jwtT = generateJwt(a);
        const { token: refreshToken, expires, account } = await buildRefresh(a, ipAddress);
        return {
            ...authView(account, jwtT),
            refreshToken,
            refreshTokenExpires: expires.getTime(),
        };
    },
    async register(params) {
        const { title, firstName, lastName, email, password } = params;
        if (await db_1.Account.findOne({ where: { email: email.toLowerCase() } })) {
            throw `Email "${email}" is already registered`;
        }
        const count = await db_1.Account.count();
        const role = count === 0 ? role_1.Role.Admin : role_1.Role.User;
        const verificationToken = randomString(32);
        const a = (await db_1.Account.create({
            title: title || 'Mr',
            firstName,
            lastName,
            email: email.toLowerCase(),
            passwordHash: hashPassword(password),
            role,
            verificationToken,
            verified: null,
        }));
        try {
            await sendVerification(a, verificationToken);
        }
        catch (err) {
            // Keep local development unblocked when SMTP is not configured.
            // Account is still created; user can verify via token endpoints.
            // eslint-disable-next-line no-console
            console.warn('Verification email was not sent:', err);
        }
        return { message: 'Registration successful, please check your email for verification instructions' };
    },
    async verifyEmail(token) {
        const a = await db_1.Account.findOne({ where: { verificationToken: token } });
        if (!a)
            throw 'Verification failed: invalid token';
        a.verified = new Date();
        a.verificationToken = null;
        await a.save();
        return { message: 'Verification successful' };
    },
    async forgotPassword(email) {
        const a = await db_1.Account.findOne({ where: { email: email.toLowerCase() } });
        if (a) {
            a.resetToken = randomString(20);
            a.resetTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
            await a.save();
            await sendPasswordReset(a);
        }
        return { message: 'Please check your email for password reset instructions' };
    },
    async validateResetToken(token) {
        const a = await db_1.Account.findOne({
            where: { resetToken: token, resetTokenExpires: { [sequelize_1.Op.gt]: new Date() } },
        });
        if (!a)
            throw 'Invalid or expired token';
        return { message: 'Token is valid' };
    },
    async resetPassword(params) {
        const { token, password, confirmPassword } = params;
        if (password !== confirmPassword)
            throw "Passwords don't match";
        const a = await db_1.Account.findOne({
            where: { resetToken: token, resetTokenExpires: { [sequelize_1.Op.gt]: new Date() } },
        });
        if (!a)
            throw 'Invalid or expired token';
        a.passwordHash = hashPassword(password);
        a.resetToken = null;
        a.resetTokenExpires = null;
        await a.save();
        return { message: 'Password reset successful' };
    },
    async getAll() {
        return (await db_1.Account.findAll()).map((a) => basic(a));
    },
    async getById(id) {
        const a = await db_1.Account.findByPk(id);
        if (!a)
            throw 'Account not found';
        return basic(a);
    },
    async create(data, transaction) {
        if (await db_1.Account.findOne({ where: { email: data.email.toLowerCase() } })) {
            throw `Email "${data.email}" is already taken`;
        }
        const a = (await db_1.Account.create({
            title: data.title || 'Mr',
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email.toLowerCase(),
            passwordHash: hashPassword(data.password),
            role: data.role,
            verificationToken: null,
            verified: new Date(),
        }, transaction ? { transaction } : undefined));
        return basic(a);
    },
    async update(id, data, { caller, canChangeRole }) {
        const a = (await db_1.Account.scope('withHash').findByPk(id));
        if (!a)
            throw 'Account not found';
        if (caller.role !== role_1.Role.Admin && caller.id !== a.id)
            throw 'Unauthorized';
        if (data.email !== undefined && data.email) {
            const e = data.email.toLowerCase();
            if (e !== a.email) {
                if (await db_1.Account.findOne({ where: { email: e } }))
                    throw `Email ${e} is already in use`;
                a.email = e;
            }
        }
        if (data.title)
            a.title = data.title;
        if (data.firstName)
            a.firstName = data.firstName;
        if (data.lastName)
            a.lastName = data.lastName;
        if (data.password)
            a.passwordHash = hashPassword(data.password);
        if (data.role && canChangeRole)
            a.role = data.role;
        await a.save();
        const u = (await db_1.Account.findByPk(id));
        return basic(u);
    },
    async _delete(id) {
        const a = await db_1.Account.findByPk(id);
        if (!a)
            throw 'Account not found';
        await a.destroy();
        return { message: 'Account deleted successfully' };
    },
    async refreshToken({ token, ipAddress }) {
        const r = await db_1.RefreshToken.findOne({
            where: { token, revoked: { [sequelize_1.Op.is]: null } },
        });
        if (!r || r.expires < new Date()) {
            if (r && r.expires < new Date()) {
                r.revoked = new Date();
                r.revokedByIp = ipAddress;
                r.reasonReplaced = 'expired on refresh';
                await r.save();
            }
            throw 'Invalid or expired token';
        }
        const a = (await db_1.Account.findByPk(r.accountId));
        if (!a)
            throw 'Account not found';
        const { token: newR, expires, account } = await buildRefresh(a, ipAddress);
        r.revoked = new Date();
        r.revokedByIp = ipAddress;
        r.replacedByToken = newR;
        r.reasonReplaced = 'Rotated on refresh';
        await r.save();
        const jwtT = generateJwt(account);
        return { user: basic(account), token: jwtT, refreshToken: newR, refreshTokenExpires: expires.getTime() };
    },
    async revokeToken({ token, ipAddress, callerId, isAdmin, }) {
        if (token == null || token === '') {
            throw 'Refresh token required (body or cookie)';
        }
        const r = await db_1.RefreshToken.findOne({ where: { token, revoked: { [sequelize_1.Op.is]: null } } });
        if (!r)
            return { message: 'Token revoked' };
        if (!isAdmin && r.accountId !== callerId)
            throw 'Unauthorized to revoke this token';
        r.revoked = new Date();
        r.revokedByIp = ipAddress;
        r.reasonReplaced = 'User revoked';
        await r.save();
        return { message: 'Token revoked' };
    },
};
