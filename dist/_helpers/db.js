"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSequelize = exports.initialize = exports.RefreshToken = exports.Account = void 0;
const sequelize_1 = require("sequelize");
const promise_1 = require("mysql2/promise");
const load_config_1 = require("./load-config");
const account_model_1 = require("../accounts/account.model");
Object.defineProperty(exports, "Account", { enumerable: true, get: function () { return account_model_1.Account; } });
const refresh_token_model_1 = require("../accounts/refresh-token.model");
Object.defineProperty(exports, "RefreshToken", { enumerable: true, get: function () { return refresh_token_model_1.RefreshToken; } });
const { host, port, user, password, database } = load_config_1.config.database;
let sequelize;
const initialize = async () => {
    const useSsl = process.env.DB_SSL === 'true';
    const sslConfig = useSsl ? { minVersion: 'TLSv1.2', rejectUnauthorized: false } : undefined;
    try {
        const conn = await (0, promise_1.createConnection)({ host, port, user, password, ssl: sslConfig });
        await conn.query(`CREATE DATABASE IF NOT EXISTS \`${database}\``);
        await conn.end();
    }
    catch (err) {
        // eslint-disable-next-line no-console
        console.warn(`Could not create database \`${database}\` (it may already exist or user has limited privileges):`, err);
    }
    sequelize = new sequelize_1.Sequelize(database, user, password, {
        host,
        port,
        dialect: 'mysql',
        logging: false,
        dialectOptions: sslConfig ? { ssl: sslConfig } : undefined,
    });
    (0, account_model_1.initAccountModel)(sequelize);
    (0, refresh_token_model_1.initRefreshTokenModel)(sequelize);
    account_model_1.Account.hasMany(refresh_token_model_1.RefreshToken, { foreignKey: 'accountId', onDelete: 'CASCADE' });
    refresh_token_model_1.RefreshToken.belongsTo(account_model_1.Account, { foreignKey: 'accountId' });
    await sequelize.sync();
};
exports.initialize = initialize;
const getSequelize = () => {
    if (!sequelize)
        throw new Error('Database not initialized. Call initialize() first.');
    return sequelize;
};
exports.getSequelize = getSequelize;
