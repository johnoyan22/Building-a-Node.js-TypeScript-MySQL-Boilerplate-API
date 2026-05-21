import { Sequelize } from 'sequelize';
import { createConnection } from 'mysql2/promise';
import { config } from './load-config';
import { initAccountModel, Account } from '../accounts/account.model';
import { initRefreshTokenModel, RefreshToken } from '../accounts/refresh-token.model';

const { host, port, user, password, database } = config.database;

let sequelize: Sequelize;

export { Account, RefreshToken };

export const initialize = async () => {
  const useSsl = process.env.DB_SSL === 'true';
  const sslConfig = useSsl ? { minVersion: 'TLSv1.2', rejectUnauthorized: false } : undefined;

  try {
    const conn = await createConnection({ host, port, user, password, ssl: sslConfig });
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${database}\``);
    await conn.end();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(`Could not create database \`${database}\` (it may already exist or user has limited privileges):`, err);
  }

  sequelize = new Sequelize(database, user, password, {
    host,
    port,
    dialect: 'mysql',
    logging: false,
    dialectOptions: sslConfig ? { ssl: sslConfig } : undefined,
  });

  initAccountModel(sequelize);
  initRefreshTokenModel(sequelize);

  Account.hasMany(RefreshToken, { foreignKey: 'accountId', onDelete: 'CASCADE' });
  RefreshToken.belongsTo(Account, { foreignKey: 'accountId' });

  await sequelize.sync();
};

export const getSequelize = () => {
  if (!sequelize) throw new Error('Database not initialized. Call initialize() first.');
  return sequelize;
};
