import { Sequelize } from 'sequelize';
import { createConnection } from 'mysql2/promise';
import { config } from './load-config';
import { initAccountModel, Account } from '../accounts/account.model';
import { initRefreshTokenModel, RefreshToken } from '../accounts/refresh-token.model';

const { host, port, user, password, database } = config.database;

let sequelize: Sequelize;

export { Account, RefreshToken };

export const initialize = async () => {
  const conn = await createConnection({ host, port, user, password });
  await conn.query(`CREATE DATABASE IF NOT EXISTS \`${database}\``);
  await conn.end();

  sequelize = new Sequelize(database, user, password, {
    host,
    port,
    dialect: 'mysql',
    logging: false,
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
