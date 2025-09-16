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
        allowNull: true,
        unique: { msg: 'Email address already in use!' },
        validate: {
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
        allowNull: true,
        validate: {
          len: {
            args: [6, 255],
            msg: 'Password must be between 6 and 255 characters',
          },
        },
      },
      fullname: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
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
