import { NextFunction, Request, Response } from 'express';
import { expressjwt } from 'express-jwt';
import { config } from '../_helpers/load-config';
import { Account } from '../_helpers/db';
import { type Role as RoleType } from '../_helpers/role';

const jwtCheck = expressjwt({
  secret: config.secret,
  algorithms: ['HS256'],
  requestProperty: 'user',
});

type JwtUser = { sub: string; id: number; role: RoleType; iat: number; exp: number };

export const authorize = (...allowedRoles: RoleType[]) => {
  const needFilter = allowedRoles.length > 0;
  const allow = new Set(allowedRoles);

  return [
    jwtCheck as (req: Request, res: Response, next: NextFunction) => void,
    async (req: Request, res: Response, next: NextFunction) => {
      const payload = (req as Request & { user: JwtUser }).user;
      const id = payload?.id ?? Number.parseInt(String(payload.sub), 10);
      if (!id) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      const a = await Account.findByPk(id);
      if (!a) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      const u = a.toJSON() as { id: number; role: RoleType };
      if (needFilter && !allow.has(u.role)) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      const ownsToken = (d: { token: string; accountId: number }) => d.accountId === u.id;
      req.user = { id: u.id, sub: String(u.id), role: u.role, ownsToken };
      next();
    },
  ];
};
