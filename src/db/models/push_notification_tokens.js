// filepath: /Users/ghanshyamdigital/WebstormProjects/outlaw project/OutlawBE/src/db/models/push_notification_tokens.js
import { DataTypes } from 'sequelize';
import { TABLE_NAMES } from '../../helper/constants.js';

export const pushNotificationTokenSchema = {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: TABLE_NAMES.users,
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  token: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  device_os: {
    type: DataTypes.STRING(20), // 'ios' | 'android'
    allowNull: false,
  },
  device_name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  device_model: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  app_version: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  last_used_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  last_notified_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
};
