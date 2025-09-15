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
      Team.hasMany(models.ImageTeam, {
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
      leagueId: DataTypes.INTEGER,
      name: DataTypes.STRING,
      logoUrl: DataTypes.STRING,
      foundedYear: DataTypes.INTEGER,
      country: DataTypes.STRING,
      stadiumName: DataTypes.STRING,
      stadiumCity: DataTypes.STRING,
      stadiumCapacity: DataTypes.INTEGER,
      venueAddress: DataTypes.STRING,
      externalRef: DataTypes.STRING,
      description: DataTypes.TEXT,
      lastSyncedAt: DataTypes.DATE,
      coach: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: 'Team',
    }
  );
  return Team;
};
