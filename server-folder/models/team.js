'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Team extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Team.belongsTo(models.League, {
        foreignKey: 'leagueId',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      });
      Team.hasMany(models.Player, {
        foreignKey: 'teamId',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      });
      Team.hasMany(models.Favorite, {
        foreignKey: 'teamId',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      });
      Team.hasMany(models.Match, {
        foreignKey: 'home_team_id',
        as: 'HomeMatches',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      });
      Team.hasMany(models.Match, {
        foreignKey: 'away_team_id',
        as: 'AwayMatches',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      });
    }
  }
  Team.init(
    {
      leagueId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Leagues',
          key: 'id',
        },
        validate: {
          notNull: {
            msg: 'League ID is required',
          },
          isInt: {
            msg: 'League ID must be an integer',
          },
        },
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: {
            msg: 'Team name is required',
          },
          notEmpty: {
            msg: 'Team name cannot be empty',
          },
          len: {
            args: [1, 100],
            msg: 'Team name must be between 1 and 100 characters',
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
      foundedYear: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
          isInt: {
            msg: 'Founded year must be an integer',
          },
          min: {
            args: [1800],
            msg: 'Founded year must be after 1800',
          },
          max: {
            args: [new Date().getFullYear()],
            msg: 'Founded year cannot be in the future',
          },
        },
      },
      country: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          len: {
            args: [0, 50],
            msg: 'Country must be less than 50 characters',
          },
        },
      },
      stadiumName: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          len: {
            args: [0, 100],
            msg: 'Stadium name must be less than 100 characters',
          },
        },
      },
      stadiumCity: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          len: {
            args: [0, 50],
            msg: 'Stadium city must be less than 50 characters',
          },
        },
      },
      stadiumCapacity: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
          isInt: {
            msg: 'Stadium capacity must be an integer',
          },
          min: {
            args: [0],
            msg: 'Stadium capacity cannot be negative',
          },
        },
      },
      venueAddress: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          len: {
            args: [0, 255],
            msg: 'Venue address must be less than 255 characters',
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
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      lastSyncedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      coach: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          len: {
            args: [0, 100],
            msg: 'Coach name must be less than 100 characters',
          },
        },
      },
      imgUrls: {
        type: DataTypes.JSON,
        defaultValue: [],
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'Team',
    }
  );
  return Team;
};
