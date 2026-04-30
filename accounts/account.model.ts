import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { Role } from '../_helpers/role';

export interface AccountAttributes {
  id: number;
  title: string;
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  role: Role;
  verificationToken: string | null;
  verified: Date | null;
  resetToken: string | null;
  resetTokenExpires: Date | null;
}

type AccountCreation = Optional<
  AccountAttributes,
  'id' | 'verificationToken' | 'verified' | 'resetToken' | 'resetTokenExpires' | 'role'
>;

export class Account extends Model<AccountAttributes, AccountCreation> {
  public id!: number;
  public title!: string;
  public firstName!: string;
  public lastName!: string;
  public email!: string;
  public passwordHash!: string;
  public role!: Role;
  public verificationToken!: string | null;
  public verified!: Date | null;
  public resetToken!: string | null;
  public resetTokenExpires!: Date | null;

  get isVerified(): boolean {
    return this.verified != null;
  }

  get isAdmin(): boolean {
    return this.role === Role.Admin;
  }
}

export const initAccountModel = (sequelize: Sequelize) => {
  Account.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      title: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'Mr' },
      firstName: { type: DataTypes.STRING(50), allowNull: false },
      lastName: { type: DataTypes.STRING(50), allowNull: false },
      email: { type: DataTypes.STRING(255), allowNull: false, unique: true, validate: { isEmail: true } },
      passwordHash: { type: DataTypes.STRING(255), allowNull: false },
      role: { type: DataTypes.ENUM('Admin', 'User'), allowNull: false, defaultValue: 'User' },
      verificationToken: { type: DataTypes.STRING(255) },
      verified: { type: DataTypes.DATE },
      resetToken: { type: DataTypes.STRING(255) },
      resetTokenExpires: { type: DataTypes.DATE },
    },
    {
      sequelize,
      tableName: 'accounts',
      defaultScope: { attributes: { exclude: ['passwordHash'] } },
      scopes: { withHash: { attributes: { include: ['passwordHash'] } } },
    }
  );
  return Account;
};
