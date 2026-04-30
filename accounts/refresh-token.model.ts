import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

export interface RefreshTokenAttributes {
  id: number;
  accountId: number;
  token: string;
  expires: Date;
  created: Date;
  createdByIp: string;
  revoked: Date | null;
  revokedByIp: string | null;
  reasonReplaced: string | null;
  replacedByToken: string | null;
}

type RefreshTokenCreation = Optional<RefreshTokenAttributes, 'id' | 'revoked' | 'revokedByIp' | 'reasonReplaced' | 'replacedByToken' | 'created'>;

export class RefreshToken extends Model<RefreshTokenAttributes, RefreshTokenCreation> {
  public id!: number;
  public accountId!: number;
  public token!: string;
  public expires!: Date;
  public created!: Date;
  public createdByIp!: string;
  public revoked!: Date | null;
  public revokedByIp!: string | null;
  public reasonReplaced!: string | null;
  public replacedByToken!: string | null;
}

export const initRefreshTokenModel = (sequelize: Sequelize) => {
  RefreshToken.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      accountId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'accounts', key: 'id' } },
      token: { type: DataTypes.STRING(500), allowNull: false, unique: true },
      expires: { type: DataTypes.DATE(6), allowNull: false },
      created: { type: DataTypes.DATE(6), allowNull: false, defaultValue: () => new Date() },
      createdByIp: { type: DataTypes.STRING(100), allowNull: false },
      revoked: { type: DataTypes.DATE(6) },
      revokedByIp: { type: DataTypes.STRING(100) },
      reasonReplaced: { type: DataTypes.STRING(255) },
      replacedByToken: { type: DataTypes.STRING(500) },
    },
    { sequelize, tableName: 'refreshTokens' }
  );
  return RefreshToken;
};
