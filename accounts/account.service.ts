import { Op, Transaction } from 'sequelize';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';
import { config } from '../_helpers/load-config';
import { Role, type Role as RoleType } from '../_helpers/role';
import { sendEmail } from '../_helpers/send-email';
import { Account, RefreshToken } from '../_helpers/db';
import type { Account as AccModel } from './account.model';

const accLabel = (a: { firstName: string; lastName: string }) => `${a.firstName} ${a.lastName}`.trim();

const basic = (a: AccModel) => a.toJSON() as unknown as Record<string, unknown>;
const authView = (a: AccModel, jwToken: string) => {
  const raw = a.toJSON() as unknown as Record<string, unknown>;
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

const hashPassword = (plain: string) => bcrypt.hashSync(plain, 10);

const randomString = (bytes = 20) => randomBytes(Math.ceil(bytes / 2)).toString('hex').slice(0, bytes);

const generateJwt = (a: { id: number; role: RoleType }) =>
  jwt.sign(
    { sub: String(a.id), id: a.id, role: a.role },
    config.secret,
    { expiresIn: '15m' }
  );

async function sendVerification(a: AccModel, vToken: string) {
  const link = `http://localhost:4000/accounts/verify-email?token=${encodeURIComponent(vToken)}`;
  const html = `
    <h3>Verify Email</h3>
    <p>Thanks for registering!</p>
    <p>Please use the below token to verify your email address with the <code>/accounts/verify-email</code> api route:</p>
    <p><code>${vToken}</code></p>
    <p>Or click this link to verify directly:</p>
    <p><a href="${link}">${link}</a></p>
  `;
  await sendEmail({ to: a.email, subject: 'Sign-up Verification API - Verify Email', html });
}

async function sendPasswordReset(a: AccModel) {
  const t = a.resetToken as string;
  const link = `http://localhost:4000/accounts/validate-reset-token?token=${encodeURIComponent(t)}`;
  const html = `
    <h3>Reset Password</h3>
    <p>Hi ${accLabel(a)}</p>
    <p>Please use the token below with the <code>/accounts/reset-password</code> api route:</p>
    <p><code>${t}</code></p>
    <p>Or click this link to validate the reset token first:</p>
    <p><a href="${link}">${link}</a></p>
  `;
  await sendEmail({ to: a.email, subject: 'Sign-up Verification API - Reset Password', html });
}

async function buildRefresh(account: AccModel, ipAddress: string) {
  const token = randomString(64);
  const expires = new Date();
  expires.setDate(expires.getDate() + 7);
  await RefreshToken.create({
    accountId: account.id,
    token,
    expires,
    createdByIp: ipAddress,
  });
  return { token, expires, account } as const;
}

export const accountService = {
  async authenticate({ email, password, ipAddress }: { email: string; password: string; ipAddress: string }) {
    const a = await Account.scope('withHash').findOne({ where: { email: email.toLowerCase() } });
    if (!a || !bcrypt.compareSync(password, a.passwordHash)) throw 'Email or password is incorrect';
    if (!a.verified) throw 'Not verified. Please check your email';
    const jwtT = generateJwt(a);
    const { token: refreshToken, expires, account } = await buildRefresh(a, ipAddress);
    return {
      ...authView(account, jwtT),
      refreshToken,
      refreshTokenExpires: expires.getTime(),
    };
  },

  async register(params: { title: string; firstName: string; lastName: string; email: string; password: string }) {
    const { title, firstName, lastName, email, password } = params;
    if (await Account.findOne({ where: { email: email.toLowerCase() } })) {
      throw `Email "${email}" is already registered`;
    }
    const count = await Account.count();
    const role: RoleType = count === 0 ? Role.Admin : Role.User;
    const verificationToken = randomString(32);
    const a = (await Account.create({
      title: title || 'Mr',
      firstName,
      lastName,
      email: email.toLowerCase(),
      passwordHash: hashPassword(password),
      role,
      verificationToken,
      verified: null,
    })) as AccModel;
    try {
      await sendVerification(a, verificationToken);
    } catch (err) {
      // Keep local development unblocked when SMTP is not configured.
      // Account is still created; user can verify via token endpoints.
      // eslint-disable-next-line no-console
      console.warn('Verification email was not sent:', err);
    }
    return { message: 'Registration successful, please check your email for verification instructions' };
  },

  async verifyEmail(token: string) {
    const a = await Account.findOne({ where: { verificationToken: token } });
    if (!a) throw 'Verification failed: invalid token';
    a.verified = new Date();
    a.verificationToken = null;
    await a.save();
    return { message: 'Verification successful' };
  },

  async forgotPassword(email: string) {
    const a = await Account.findOne({ where: { email: email.toLowerCase() } });
    if (a) {
      a.resetToken = randomString(20);
      a.resetTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await a.save();
      await sendPasswordReset(a);
    }
    return { message: 'Please check your email for password reset instructions' };
  },

  async validateResetToken(token: string) {
    const a = await Account.findOne({
      where: { resetToken: token, resetTokenExpires: { [Op.gt]: new Date() } },
    });
    if (!a) throw 'Invalid or expired token';
    return { message: 'Token is valid' };
  },

  async resetPassword(params: { token: string; password: string; confirmPassword: string }) {
    const { token, password, confirmPassword } = params;
    if (password !== confirmPassword) throw "Passwords don't match";
    const a = await Account.findOne({
      where: { resetToken: token, resetTokenExpires: { [Op.gt]: new Date() } },
    });
    if (!a) throw 'Invalid or expired token';
    a.passwordHash = hashPassword(password);
    a.resetToken = null;
    a.resetTokenExpires = null;
    await a.save();
    return { message: 'Password reset successful' };
  },

  async getAll() {
    return (await Account.findAll()).map((a) => basic(a as AccModel));
  },

  async getById(id: number) {
    const a = await Account.findByPk(id);
    if (!a) throw 'Account not found';
    return basic(a as AccModel);
  },

  async create(
    data: { title: string; firstName: string; lastName: string; email: string; password: string; role: RoleType },
    transaction?: Transaction
  ) {
    if (await Account.findOne({ where: { email: data.email.toLowerCase() } })) {
      throw `Email "${data.email}" is already taken`;
    }
    const a = (await Account.create(
      {
        title: data.title || 'Mr',
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email.toLowerCase(),
        passwordHash: hashPassword(data.password),
        role: data.role,
        verificationToken: null,
        verified: new Date(),
      },
      transaction ? { transaction } : undefined
    )) as AccModel;
    return basic(a);
  },

  async update(
    id: number,
    data: Partial<{ title: string; firstName: string; lastName: string; email: string; password: string; role: RoleType }>,
    { caller, canChangeRole }: { caller: { id: number; role: RoleType }; canChangeRole: boolean }
  ) {
    const a = (await Account.scope('withHash').findByPk(id)) as AccModel | null;
    if (!a) throw 'Account not found';
    if (caller.role !== Role.Admin && caller.id !== a.id) throw 'Unauthorized';
    if (data.email !== undefined && data.email) {
      const e = data.email.toLowerCase();
      if (e !== a.email) {
        if (await Account.findOne({ where: { email: e } })) throw `Email ${e} is already in use`;
        a.email = e;
      }
    }
    if (data.title) a.title = data.title;
    if (data.firstName) a.firstName = data.firstName;
    if (data.lastName) a.lastName = data.lastName;
    if (data.password) a.passwordHash = hashPassword(data.password);
    if (data.role && canChangeRole) a.role = data.role;
    await a.save();
    const u = (await Account.findByPk(id)) as AccModel;
    return basic(u) as Record<string, unknown>;
  },

  async _delete(id: number) {
    const a = await Account.findByPk(id);
    if (!a) throw 'Account not found';
    await a.destroy();
    return { message: 'Account deleted successfully' };
  },

  async refreshToken({ token, ipAddress }: { token: string; ipAddress: string }) {
    const r = await RefreshToken.findOne({
      where: { token, revoked: { [Op.is]: null } },
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
    const a = (await Account.findByPk(r.accountId)) as AccModel;
    if (!a) throw 'Account not found';
    const { token: newR, expires, account } = await buildRefresh(a, ipAddress);
    r.revoked = new Date();
    r.revokedByIp = ipAddress;
    r.replacedByToken = newR;
    r.reasonReplaced = 'Rotated on refresh';
    await r.save();
    const jwtT = generateJwt(account);
    return { user: basic(account), token: jwtT, refreshToken: newR, refreshTokenExpires: expires.getTime() };
  },

  async revokeToken({
    token,
    ipAddress,
    callerId,
    isAdmin,
  }: {
    token: string | null | undefined;
    ipAddress: string;
    callerId: number;
    isAdmin: boolean;
  }) {
    if (token == null || token === '') {
      throw 'Refresh token required (body or cookie)';
    }
    const r = await RefreshToken.findOne({ where: { token, revoked: { [Op.is]: null } } });
    if (!r) return { message: 'Token revoked' };
    if (!isAdmin && r.accountId !== callerId) throw 'Unauthorized to revoke this token';
    r.revoked = new Date();
    r.revokedByIp = ipAddress;
    r.reasonReplaced = 'User revoked';
    await r.save();
    return { message: 'Token revoked' };
  },
};
