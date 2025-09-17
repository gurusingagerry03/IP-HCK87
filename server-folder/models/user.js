'use strict';
const { Model } = require('sequelize');
const { hashPassword } = require('../helpers/bcrypt');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      User.hasMany(models.Favorite, {
        foreignKey: 'userId',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      });
    }
  }

  User.init(
    {
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: { msg: 'Email address already in use!' },
        validate: {
          notNull: { msg: 'Email is required' },
          notEmpty: { msg: 'Email is required' },
          isEmail: {
            msg: 'Must be a valid email address',
          },
          len: {
            args: [3, 255],
            msg: 'Email must be between 3 and 255 characters',
          },
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: { msg: 'Password is required' },
          notEmpty: { msg: 'Password is required' },
          len: {
            args: [6, 255],
            msg: 'Password must be between 6 and 255 characters',
          },
        },
      },
      fullname: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: { msg: 'Full name is required' },
          notEmpty: { msg: 'Full name is required' },
          len: {
            args: [1, 100],
            msg: 'Fullname must be between 1 and 100 characters',
          },
        },
      },
      profileImg: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          isUrl: {
            msg: 'Profile image must be a valid URL',
          },
          len: {
            args: [1, 255],
            msg: 'Profile image URL must be between 1 and 255 characters',
          },
        },
      },
      role: {
        type: DataTypes.ENUM('admin', 'user'),
        allowNull: false,
        defaultValue: 'user',
        validate: {
          notNull: { msg: 'Role is required' },
          notEmpty: { msg: 'Role is required' },
          isIn: {
            args: [['admin', 'user']],
            msg: 'Role must be either admin or user',
          },
        },
      },
    },
    {
      sequelize,
      modelName: 'User',
      tableName: 'Users', // pastikan sesuai nama tabel di DB kamu
    }
  );

  //hash password before saving to database with helpers/bcrypt.js
  User.beforeCreate(async (user, options) => {
    if (user.password) {
      user.password = await hashPassword(user.password);
    }
  });

  return User;
};
