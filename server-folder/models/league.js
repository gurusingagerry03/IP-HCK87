'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class League extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      League.hasMany(models.Team, {
        foreignKey: 'leagueId',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      });
      League.hasMany(models.Match, {
        foreignKey: 'league_id',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      });
    }
  }
  League.init(
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: {
            msg: 'League name is required',
          },
          notEmpty: {
            msg: 'League name cannot be empty',
          },
          len: {
            args: [1, 100],
            msg: 'League name must be between 1 and 100 characters',
          },
        },
      },
      country: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: {
            msg: 'Country is required',
          },
          notEmpty: {
            msg: 'Country cannot be empty',
          },
          len: {
            args: [2, 50],
            msg: 'Country must be between 2 and 50 characters',
          },
        },
      },
      externalRef: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: {
          msg: 'External reference already exists in database',
        },
        validate: {
          notNull: {
            msg: 'External reference is required',
          },
          notEmpty: {
            msg: 'External reference cannot be empty',
          },
        },
      },
      logoUrl: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          isUrl: {
            msg: 'Logo URL must be a valid URL',
          },
        },
      },
    },
    {
      sequelize,
      modelName: 'League',
    }
  );
  return League;
};
