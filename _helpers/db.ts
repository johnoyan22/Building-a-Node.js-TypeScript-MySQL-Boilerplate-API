import { Sequelize } from 'sequelize';
import { createConnection } from 'mysql2/promise';
import { config } from './load-config';
import accountModel from '../accounts/account.model';
import refreshTokenModel from '../accounts/refresh-token.model';

const { host, port, user, password, database } = config.database;

export const db: any = {};

export const initialize = async () => {
  const useSsl = process.env.DB_SSL === 'true';
  const sslConfig = useSsl ? { minVersion: 'TLSv1.2', rejectUnauthorized: false } : undefined;

  try {
    const conn = await createConnection({ host, port, user, password, database, ssl: sslConfig });
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${database}\``);
    await conn.end();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(`Could not create database \`${database}\` (it may already exist or user has limited privileges):`, err);
  }

  const sequelize = new Sequelize(database, user, password, {
    host,
    port,
    dialect: 'mysql',
    logging: false,
    dialectOptions: sslConfig ? { ssl: sslConfig } : undefined,
  });

  db.Account = accountModel(sequelize);
  db.RefreshToken = refreshTokenModel(sequelize);

  db.Account.hasMany(db.RefreshToken, { foreignKey: 'accountId', onDelete: 'CASCADE' });
  db.RefreshToken.belongsTo(db.Account, { foreignKey: 'accountId' });

  db.sequelize = sequelize;

  await sequelize.sync({ alter: true });
};

export const getSequelize = () => {
  if (!db.sequelize) throw new Error('Database not initialized. Call initialize() first.');
  return db.sequelize;
};