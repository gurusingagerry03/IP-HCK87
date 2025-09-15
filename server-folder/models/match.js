'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Match extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Match.belongsTo(models.League, {
        foreignKey: 'league_id',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      });
      Match.belongsTo(models.Team, {
        foreignKey: 'home_team_id',
        as: 'HomeTeam',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      });
      Match.belongsTo(models.Team, {
        foreignKey: 'away_team_id',
        as: 'AwayTeam',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      });
    }
  }
  Match.init(
    {
      league_id: DataTypes.INTEGER,
      home_team_id: DataTypes.INTEGER,
      away_team_id: DataTypes.INTEGER,
      match_date: DataTypes.DATE,
      match_time: DataTypes.TIME,
      home_score: DataTypes.INTEGER,
      away_score: DataTypes.INTEGER,
      status: DataTypes.STRING,
      venue: DataTypes.STRING,
      externalRef: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: 'Match',
    }
  );
  return Match;
};
