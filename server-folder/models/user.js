'use strict';
const { Model } = require('sequelize');
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
      passwordHash: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          len: {
            args: [6, 255],
            msg: 'Password hash must be between 6 and 255 characters',
          },
        },
      },
      displayName: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          len: {
            args: [1, 100],
            msg: 'Display name must be between 1 and 100 characters',
          },
        },
      },
      googleSub: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
        validate: {
          len: {
            args: [1, 255],
            msg: 'Google Sub must be between 1 and 255 characters',
          },
        },
      },
    },
    {
      sequelize,
      modelName: 'User',
    }
  );
  return User;
};
