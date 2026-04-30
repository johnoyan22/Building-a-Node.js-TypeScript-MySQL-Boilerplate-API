"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initAccountModel = exports.Account = void 0;
const sequelize_1 = require("sequelize");
const role_1 = require("../_helpers/role");
class Account extends sequelize_1.Model {
    get isVerified() {
        return this.verified != null;
    }
    get isAdmin() {
        return this.role === role_1.Role.Admin;
    }
}
exports.Account = Account;
const initAccountModel = (sequelize) => {
    Account.init({
        id: { type: sequelize_1.DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        title: { type: sequelize_1.DataTypes.STRING(30), allowNull: false, defaultValue: 'Mr' },
        firstName: { type: sequelize_1.DataTypes.STRING(50), allowNull: false },
        lastName: { type: sequelize_1.DataTypes.STRING(50), allowNull: false },
        email: { type: sequelize_1.DataTypes.STRING(255), allowNull: false, unique: true, validate: { isEmail: true } },
        passwordHash: { type: sequelize_1.DataTypes.STRING(255), allowNull: false },
        role: { type: sequelize_1.DataTypes.ENUM('Admin', 'User'), allowNull: false, defaultValue: 'User' },
        verificationToken: { type: sequelize_1.DataTypes.STRING(255) },
        verified: { type: sequelize_1.DataTypes.DATE },
        resetToken: { type: sequelize_1.DataTypes.STRING(255) },
        resetTokenExpires: { type: sequelize_1.DataTypes.DATE },
    }, {
        sequelize,
        tableName: 'accounts',
        defaultScope: { attributes: { exclude: ['passwordHash'] } },
        scopes: { withHash: { attributes: { include: ['passwordHash'] } } },
    });
    return Account;
};
exports.initAccountModel = initAccountModel;
