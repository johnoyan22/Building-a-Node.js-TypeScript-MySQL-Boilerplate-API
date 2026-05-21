"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = authorize;
const express_jwt_1 = require("express-jwt");
// import config from '../../config.prod.json';
const db_1 = require("../_helpers/db");
function authorize(roles = []) {
    if (typeof roles === 'string') {
        roles = [roles];
    }
    const secret = process.env.JWT_SECRET ?? '';
    return [
        (0, express_jwt_1.expressjwt)({ secret, algorithms: ['HS256'] }),
        async (req, res, next) => {
            const account = await db_1.db.Account.findByPk(req.auth.id);
            if (!account || (roles.length && !roles.includes(account.role))) {
                return res.status(401).json({ message: 'Unauthorized' });
            }
            const refreshTokens = await account.getRefreshTokens();
            req.user = {
                ...req.auth,
                role: account.role,
                ownsToken: (token) => !!refreshTokens.find((x) => x.token === token)
            };
            next();
        }
    ];
}
