"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = void 0;
const express_jwt_1 = require("express-jwt");
const load_config_1 = require("../_helpers/load-config");
const db_1 = require("../_helpers/db");
const jwtCheck = (0, express_jwt_1.expressjwt)({
    secret: load_config_1.config.secret,
    algorithms: ['HS256'],
    requestProperty: 'user',
});
const authorize = (...allowedRoles) => {
    const needFilter = allowedRoles.length > 0;
    const allow = new Set(allowedRoles);
    return [
        jwtCheck,
        async (req, res, next) => {
            const payload = req.user;
            const id = payload?.id ?? Number.parseInt(String(payload.sub), 10);
            if (!id) {
                return res.status(401).json({ message: 'Unauthorized' });
            }
            const a = await db_1.Account.findByPk(id);
            if (!a) {
                return res.status(401).json({ message: 'Unauthorized' });
            }
            const u = a.toJSON();
            if (needFilter && !allow.has(u.role)) {
                return res.status(401).json({ message: 'Unauthorized' });
            }
            const ownsToken = (d) => d.accountId === u.id;
            req.user = { id: u.id, sub: String(u.id), role: u.role, ownsToken };
            next();
        },
    ];
};
exports.authorize = authorize;
