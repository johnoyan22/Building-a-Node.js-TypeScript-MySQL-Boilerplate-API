"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initRefreshTokenModel = exports.RefreshToken = void 0;
const sequelize_1 = require("sequelize");
class RefreshToken extends sequelize_1.Model {
}
exports.RefreshToken = RefreshToken;
const initRefreshTokenModel = (sequelize) => {
    RefreshToken.init({
        id: { type: sequelize_1.DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        accountId: { type: sequelize_1.DataTypes.INTEGER, allowNull: false, references: { model: 'accounts', key: 'id' } },
        token: { type: sequelize_1.DataTypes.STRING(500), allowNull: false, unique: true },
        expires: { type: sequelize_1.DataTypes.DATE(6), allowNull: false },
        created: { type: sequelize_1.DataTypes.DATE(6), allowNull: false, defaultValue: () => new Date() },
        createdByIp: { type: sequelize_1.DataTypes.STRING(100), allowNull: false },
        revoked: { type: sequelize_1.DataTypes.DATE(6) },
        revokedByIp: { type: sequelize_1.DataTypes.STRING(100) },
        reasonReplaced: { type: sequelize_1.DataTypes.STRING(255) },
        replacedByToken: { type: sequelize_1.DataTypes.STRING(500) },
    }, { sequelize, tableName: 'refreshTokens' });
    return RefreshToken;
};
exports.initRefreshTokenModel = initRefreshTokenModel;
