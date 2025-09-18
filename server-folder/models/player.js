'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Player extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Player.belongsTo(models.Team, {
        foreignKey: 'teamId',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      });
    }
  }
  Player.init(
    {
      teamId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Teams',
          key: 'id',
        },
        validate: {
          notNull: {
            msg: 'Team ID is required',
          },
          isInt: {
            msg: 'Team ID must be an integer',
          },
        },
      },
      fullName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: {
            msg: 'Player name is required',
          },
          notEmpty: {
            msg: 'Player name cannot be empty',
          },
          len: {
            args: [1, 100],
            msg: 'Player name must be between 1 and 100 characters',
          },
        },
      },
      primaryPosition: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          len: {
            args: [0, 50],
            msg: 'Primary position must be less than 50 characters',
          },
        },
      },
      thumbUrl: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          isUrl: {
            msg: 'Thumbnail URL must be a valid URL',
          },
        },
      },
      externalRef: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: {
          msg: 'External reference already exists',
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
      age: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
          isInt: {
            msg: 'Age must be an integer',
          },
          min: {
            args: [14],
            msg: 'Age must be at least 14',
          },
          max: {
            args: [50],
            msg: 'Age cannot be more than 50',
          },
        },
      },
      shirtNumber: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          len: {
            args: [0, 3],
            msg: 'Shirt number must be less than 3 characters',
          },
        },
      },
    },
    {
      sequelize,
      modelName: 'Player',
    }
  );
  return Player;
};
