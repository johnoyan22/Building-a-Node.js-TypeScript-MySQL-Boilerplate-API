"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSequelize = exports.initialize = exports.db = void 0;
const sequelize_1 = require("sequelize");
const promise_1 = require("mysql2/promise");
const load_config_1 = require("./load-config");
const account_model_1 = __importDefault(require("../accounts/account.model"));
const refresh_token_model_1 = __importDefault(require("../accounts/refresh-token.model"));
const { host, port, user, password, database } = load_config_1.config.database;
exports.db = {};
const initialize = async () => {
    const useSsl = process.env.DB_SSL === 'true';
    const sslConfig = useSsl ? { minVersion: 'TLSv1.2', rejectUnauthorized: false } : undefined;
    try {
        const conn = await (0, promise_1.createConnection)({ host, port, user, password, database, ssl: sslConfig });
        await conn.query(`CREATE DATABASE IF NOT EXISTS \`${database}\``);
        await conn.end();
    }
    catch (err) {
        // eslint-disable-next-line no-console
        console.warn(`Could not create database \`${database}\` (it may already exist or user has limited privileges):`, err);
    }
    const sequelize = new sequelize_1.Sequelize(database, user, password, {
        host,
        port,
        dialect: 'mysql',
        logging: false,
        dialectOptions: sslConfig ? { ssl: sslConfig } : undefined,
    });
    exports.db.Account = (0, account_model_1.default)(sequelize);
    exports.db.RefreshToken = (0, refresh_token_model_1.default)(sequelize);
    exports.db.Account.hasMany(exports.db.RefreshToken, { foreignKey: 'accountId', onDelete: 'CASCADE' });
    exports.db.RefreshToken.belongsTo(exports.db.Account, { foreignKey: 'accountId' });
    exports.db.sequelize = sequelize;
    await sequelize.sync({ alter: true });
};
exports.initialize = initialize;
const getSequelize = () => {
    if (!exports.db.sequelize)
        throw new Error('Database not initialized. Call initialize() first.');
    return exports.db.sequelize;
};
exports.getSequelize = getSequelize;
